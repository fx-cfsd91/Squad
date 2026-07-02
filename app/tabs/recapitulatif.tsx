import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as XLSX from 'xlsx';
import HeaderBar from '../../components/header-bar';
import { API_CONFIG, API_HEADERS, STORAGE_KEYS, BELT_COLORS } from '../../constants/config';
import { fetchEleves } from '../../lib/api';

const REMOTE_JSON_URL = API_CONFIG.ELEVES_FETCH_URL;
const UPLOAD_URL = API_CONFIG.ELEVES_SAVE_URL;
const TARGET_JSON_NAME = 'eleves.json';

type Eleve = {
  id: string;
  nom: string; prenom: string;
  jour?: string; discipline?: string;
  combattant?: boolean; etudiant?: boolean;
  telUrgence?: string; telEleve?: string; email?: string;
  adresse?: string; naissance?: string; ceinture?: string; licence?: string;
  photo?: string; createdAt?: string; age?: number;
};

export default function Recapitulatif() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const containerPadding = 24; // FlatList content padding left+right
  const columnGap = 12;
  const innerWidth = Math.max(width - containerPadding, 320);
  const minCardWidth = 140; // largeur mini d'une carte (réduit pour plus de colonnes)
  const numColumns = isSmallScreen ? 2 : Math.max(1, Math.min(12, Math.floor((innerWidth + columnGap) / (minCardWidth + columnGap))));
  const cardWidth = Math.floor((innerWidth - columnGap * (numColumns - 1)) / numColumns);
  const photoSize = Math.max(48, Math.min(96, Math.round(cardWidth * 0.28)));
  
  const [data, setData] = useState<Eleve[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrId, setQrId] = useState<string | null>(null);
  const [lastError, setLastError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [fileSearchVisible, setFileSearchVisible] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [fileResults, setFileResults] = useState<Eleve[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; prenom: string; nom: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const isMountedRef = React.useRef(true);
  
  const clean = (s?: any) => (s == null ? '' : String(s).trim());
  
  // Cleanup quand le composant est démonté
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---- compression des photos (admin)
  const compressBase64Web = (base64: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        const MAX = 400;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        resolve(dataUrl.replace(/^data:image\/\w+;base64,/, ''));
      };
      img.onerror = () => reject(new Error('load'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });

  const compressBase64Native = async (base64: string, id: string): Promise<string> => {
    const tempUri = `${(FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? ''}photo_cmp_${id}.jpg`;
    await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: 'base64' as any });
    const r = await ImageManipulator.manipulateAsync(
      tempUri,
      [{ resize: { width: 400 } }],
      { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return r.base64 || base64;
  };

  const doCompressAll = async () => {
    setCompressing(true);
    setCompressProgress('Chargement des photos depuis le serveur…');

    // 1. Récupération fraîche (sans cache) pour avoir les photos à jour
    let freshData: Eleve[] = data;
    try {
      const r = await fetch(REMOTE_JSON_URL, { cache: 'no-store', headers: API_HEADERS });
      if (r.ok) {
        const raw = await r.json();
        if (Array.isArray(raw)) freshData = raw;
        else if (raw?.data) freshData = raw.data;
        else if (raw?.eleves) freshData = raw.eleves;
      }
    } catch (e) {
      console.warn('Fetch sans cache échoué, on utilise les données locales', e);
    }

    if (!isMountedRef.current) return;

    const updated = freshData.map(e => ({ ...e }));
    const withPhoto = updated.filter(e => e.photo && e.photo.length > 0);
    const total = withPhoto.length;

    if (total === 0) {
      if (isMountedRef.current) {
        setCompressing(false);
        setCompressProgress('');
        Alert.alert('Info', 'Aucune photo trouvée dans les données du serveur.');
      }
      return;
    }

    let done = 0, saved = 0;

    for (let i = 0; i < updated.length; i++) {
      const eleve = updated[i];
      if (!eleve.photo || eleve.photo.length === 0) continue;
      done++;
      
      if (!isMountedRef.current) return;
      
      setCompressProgress(`${done}/${total} – ${eleve.prenom} ${eleve.nom}`);
      try {
        const original = eleve.photo;
        const compressed = Platform.OS === 'web'
          ? await compressBase64Web(original)
          : await compressBase64Native(original, eleve.id);
        if (compressed && compressed.length < original.length) {
          updated[i] = { ...eleve, photo: compressed };
          saved++;
        }
      } catch (e) {
        console.warn('Compression échouée pour', eleve.id, e);
      }
    }

    if (!isMountedRef.current) return;

    // 2. Sauvegarde individuelle via PUT pour chaque photo modifiée
    if (saved > 0) {
      let saveErrors = 0;
      for (let i = 0; i < updated.length; i++) {
        const orig = freshData[i];
        const upd = updated[i];
        if (!upd.photo || upd.photo === orig?.photo) continue; // non modifié
        
        if (!isMountedRef.current) return;
        
        setCompressProgress(`Sauvegarde ${upd.prenom} ${upd.nom}…`);
        try {
          const res = await fetch(REMOTE_JSON_URL, {
            method: 'PUT',
            headers: API_HEADERS,
            body: JSON.stringify({ id: upd.id, photo: upd.photo }),
          });
          if (!res.ok) saveErrors++;
        } catch (e) {
          saveErrors++;
          console.warn('Sauvegarde échouée pour', upd.id, e);
        }
      }
      
      if (!isMountedRef.current) return;
      
      setData(updated);
      setCompressing(false);
      setCompressProgress('');
      Alert.alert(
        'Compression terminée',
        `${saved} photo(s) compressée(s) sur ${total}.${saveErrors > 0 ? `\n⚠️ ${saveErrors} erreur(s) de sauvegarde.` : ''}`
      );
    } else {
      if (isMountedRef.current) {
        setCompressing(false);
        setCompressProgress('');
        Alert.alert('Compression terminée', `Aucune photo n'a pu être réduite (déjà optimisées ou erreur).`);
      }
    }
  };

  const compressAllPhotos = () => {
    const withPhoto = data.filter(e => e.photo && e.photo.length > 0);
    if (withPhoto.length === 0) {
      Alert.alert('Info', 'Aucun élève n\'a de photo enregistrée.');
      return;
    }
    const totalKB = Math.round(withPhoto.reduce((acc, e) => acc + (e.photo ? e.photo.length * 0.75 / 1024 : 0), 0));
    Alert.alert(
      'Compresser les photos',
      `${withPhoto.length} photo(s) — ~${totalKB} Ko au total\n\nChaque photo sera redimensionnée (max 400 px) et compressée en JPEG 65 %. Opération irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Compresser', style: 'destructive', onPress: doCompressAll },
      ]
    );
  };

  // ---- actions serveur uniquement
  const fetchFromServer = async () => {
    try {
      setLoading(true);
      setLastError('');
      console.log('🌐 Chargement des élèves...');
      
      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: API_HEADERS
      });

      if (!isMountedRef.current) return;

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      let arrRaw: any = await r.json();
      console.log('Server response fetchFromServer type:', typeof arrRaw, Object.keys(arrRaw || {}));
      
      let arr: Eleve[] = [];
      if (Array.isArray(arrRaw)) arr = arrRaw;
      else if (arrRaw && Array.isArray(arrRaw.data)) arr = arrRaw.data;
      else if (arrRaw && Array.isArray(arrRaw.eleves)) arr = arrRaw.eleves;
      else if (arrRaw && Array.isArray(arrRaw.results)) arr = arrRaw.results;
      else {
        try { const parsed = JSON.parse(String(arrRaw)); if (Array.isArray(parsed)) arr = parsed; } catch(_){}
      }
      
      if (!Array.isArray(arr)) throw new Error('JSON inattendu (tableau)');
      
      if (!isMountedRef.current) return;
      
      setData(arr);
      const now = new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(now);
      console.log('✅ Élèves chargés:', arr.length);
      
      Alert.alert('Import OK', `${arr.length} enregistrements depuis le serveur`);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setLastError('IMPORT: ' + (e?.message || 'Erreur'));
      Alert.alert('Erreur import', e?.message || '');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const uploadToServer = async (arr: Eleve[]) => {
    try {
      setLoading(true); setLastError('');
      // Envoi direct de la nouvelle liste pour écrasement
      const r = await fetch(REMOTE_JSON_URL, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ data: arr })
      });
      
      if (!isMountedRef.current) return;
      
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      if (!out.ok) throw new Error(out.error || 'Erreur serveur');
      
      if (!isMountedRef.current) return;
      
      Alert.alert('Téléversement OK', `${out.count} enregistrements`);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setLastError('UPLOAD: ' + (e?.message || 'Erreur'));
      Alert.alert('Erreur upload', e?.message || '');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ---- supprimer un élève via l'API DELETE
  const removeEleve = useCallback(async (id: string) => {
    // Suppression optimiste : retirer de la liste immédiatement
    let removed: Eleve | undefined;
    setData(prevData => {
      removed = prevData.find(x => String(x.id) === String(id));
      return prevData.filter(x => String(x.id) !== String(id));
    });
    setDeleteError(null);
    try {
      const r = await fetch(REMOTE_JSON_URL, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ action: 'delete', id })
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`Serveur: HTTP ${r.status} — ${body.slice(0, 120)}`);
      }
    } catch (e: any) {
      if (!isMountedRef.current) return;
      // Rollback : remettre l'élève dans la liste
      if (removed) setData(prevData => [...prevData, removed as Eleve]);
      setDeleteError(e?.message || 'Erreur inconnue');
    }
  }, []);

  // ---- copier lien fiche web
  // Fonction copyLink retirée

  // ---- export Excel (XLSX)
  const exportToExcel = async () => {
    try {
      console.log('DEBUG: exportToExcel appelée, data.length =', data.length);
      
      if (data.length === 0) {
        Alert.alert('Erreur', 'Aucune donnée à exporter');
        return;
      }

      // Préparer les données pour Excel
      const excelData = data.map(eleve => ({
        'ID': eleve.id,
        'Nom': eleve.nom,
        'Prénom': eleve.prenom,
        'Naissance': eleve.naissance || '',
        'Âge': eleve.age || '',
        'Jour': eleve.jour || '',
        'Discipline': eleve.discipline || '',
        'Compétiteur': eleve.combattant ? 'Oui' : 'Non',
        'Étudiant': eleve.etudiant ? 'Oui' : 'Non',
        'Tel Urgence': eleve.telUrgence || '',
        'Tel Élève': eleve.telEleve || '',
        'Email': eleve.email || '',
        'Adresse': eleve.adresse || '',
        'Ceinture': eleve.ceinture || '',
        'Licence': eleve.licence || '',
        'Créé le': eleve.createdAt || ''
      }));

      console.log('DEBUG: excelData préparée, éléments:', excelData.length);

      // Créer un workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Élèves');

      console.log('DEBUG: workbook créé');

      // Générer le fichier en base64
      const fileName = `eleves_cfsd91_${new Date().toISOString().split('T')[0]}.xlsx`;
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log('DEBUG: fichier généré, fileName =', fileName);

      if (!isMountedRef.current) return;

      // Sur le web : créer un lien de téléchargement
      if (Platform.OS === 'web') {
        const binaryString = atob(wbout);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien et simuler le clic
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('📊 Excel téléchargé:', data.length, 'élèves');
        if (isMountedRef.current) {
          Alert.alert('Export Excel', `${data.length} élèves exportés en Excel`);
        }
      } else {
        // Sur mobile : utiliser le FileSystem et Sharing
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const fileUri = cacheDir ? `${cacheDir}${fileName}` : fileName;
        
        console.log('DEBUG: tentative sauvegarde à', fileUri);
        
        // Utiliser writeAsStringAsync en ignorant la dépréciation
        try {
          await (FileSystem as any).writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });
        } catch (e) {
          console.warn('Fallback: éciture directe');
        }

        console.log('DEBUG: fichier sauvegardé');

        if (!isMountedRef.current) return;

        // Partager le fichier
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('DEBUG: Sharing disponible?', isAvailable);
        
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Exporter les élèves en Excel'
          });
        } else {
          if (isMountedRef.current) {
            Alert.alert('Export Excel', `Fichier sauvegardé: ${fileName}`);
          }
        }

        console.log('📊 Excel exporté:', data.length, 'élèves');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('💥 Erreur export Excel:', error);
      console.error('Stack:', error?.stack);
      Alert.alert('Erreur', `Impossible d'exporter: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  // ---- recherche
  const filtered = useMemo(() => {
    let result = data;
    
    // Filtrer si recherche
    if (q) {
      const s = q.toLowerCase();
      result = data.filter(e =>
        [e.nom, e.prenom, e.discipline, e.jour, e.telUrgence, e.telEleve, e.email]
          .some(v => (v || '').toLowerCase().includes(s))
      );
      console.log('🔍 Recherche "' + q + '":', result.length, 'résultats');
    }
    
    // Trier par nom (ordre alphabétique)
    result.sort((a, b) => {
      const nomA = (a.nom || '').toLowerCase();
      const nomB = (b.nom || '').toLowerCase();
      return nomA.localeCompare(nomB, 'fr');
    });
    
    return result;
  }, [data, q]);

  // Charger au focus (couvre le montage initial ET le retour sur la page)
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      loadElevesFromServer();
      
      return () => {
        isMountedRef.current = false;
      };
    }, [])
  );

  const loadElevesFromServer = async () => {
    try {
      setLoading(true);
      console.log('🌐 Chargement des élèves...');

      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: API_HEADERS
      });
      
      if (!isMountedRef.current) return;
      
      console.log('📡 Réponse status:', r.status);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      
      let arrRaw: any = await r.json();
      
      if (!isMountedRef.current) return;
      
      console.log('Server response loadElevesFromServer type:', typeof arrRaw, Object.keys(arrRaw || {}));
      
      let arr: Eleve[] = [];
      if (Array.isArray(arrRaw)) arr = arrRaw;
      else if (arrRaw && Array.isArray(arrRaw.data)) arr = arrRaw.data;
      else if (arrRaw && Array.isArray(arrRaw.eleves)) arr = arrRaw.eleves;
      else if (arrRaw && Array.isArray(arrRaw.results)) arr = arrRaw.results;
      else {
        try { const parsed = JSON.parse(String(arrRaw)); if (Array.isArray(parsed)) arr = parsed; } catch(_){}
      }
      if (!Array.isArray(arr)) throw new Error('JSON inattendu');

      if (!isMountedRef.current) return;
      
      console.log('✅ Chargé:', arr.length, 'élèves');
      setData(arr);
      const now = new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(now);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      console.error('❌ Erreur chargement:', error);
      setData([]);
      setLastError(error?.message || 'Erreur');
      Alert.alert('Erreur', `Impossible de charger les élèves: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 56 }}>
      <HeaderBar
        title="Récapitulatif"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="transparent"
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {lastSyncTime && (
              <View style={{ paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 12, color: '#374151' }}>Dernière sync</Text>
                <Text style={{ fontSize: 12, color: '#111', fontWeight: '600' }}>{lastSyncTime}</Text>
              </View>
            )}
            <Pressable onPress={loadElevesFromServer} accessibilityLabel="Rafraîchir" style={{ padding: 6 }}>
              <Ionicons name="refresh" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={() => setFileSearchVisible(true)} accessibilityLabel="Rechercher fichier" style={{ padding: 6 }}>
              <Ionicons name="search" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={exportToExcel} accessibilityLabel="Exporter Excel" style={{ padding: 6 }}>
              <Ionicons name="document" size={22} color="#b40a0a" />
            </Pressable>
            <Pressable onPress={compressAllPhotos} accessibilityLabel="Compresser les photos" style={{ padding: 6 }}>
              <Ionicons name="resize" size={22} color="#f59e0b" />
            </Pressable>
            <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={{ padding: 6 }}>
              <Ionicons name="arrow-back" size={22} color="#000" />
            </Pressable>
          </View>
        )}
      />

      {/* Overlay compression en cours */}
      {compressing && (
        <View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={{ color: '#f59e0b', fontWeight: '700', fontSize: 16, marginTop: 16 }}>Compression en cours…</Text>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>{compressProgress}</Text>
        </View>
      )}

      {/* File search modal */}
      {fileSearchVisible && (
        <View style={{ position: 'absolute', left: 12, right: 12, top: 80, backgroundColor: '#111', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333' }}>
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Rechercher dans eleves.json</Text>
          <TextInput
            value={fileQuery}
            onChangeText={setFileQuery}
            placeholder="Nom Prénom ou email"
            placeholderTextColor="#999"
            style={{ backgroundColor: '#0b0b0b', color: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => {
              Alert.alert('Info', 'Utilisez le champ de recherche principal pour chercher dans les élèves chargés du serveur.');
            }}>
              <Text style={s.btnTx}>Rechercher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#444' }]} onPress={() => { setFileSearchVisible(false); setFileQuery(''); setFileResults([]); }}>
              <Text style={s.btnTx}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ maxHeight: 280 }}>
            {fileResults.length === 0 ? (
              <Text style={{ color: '#9ca3af' }}>Aucun résultat</Text>
            ) : (
              <FlatList
                data={fileResults}
                keyExtractor={it => it.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' }} onPress={() => {
                    setFileSearchVisible(false);
                    router.push(`/tabs/fiche/${item.id}`);
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{item.prenom} {item.nom}</Text>
                    <Text style={{ color: '#9ca3af' }}>{item.email || '—'}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      )}

      {/* Barre de recherche et compteur */}
      <View style={{ padding: 12, backgroundColor: '#111' }}>
        <TextInput
          style={{
            backgroundColor: '#333',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8
          }}
          placeholder="Rechercher un élève..."
          placeholderTextColor="#999"
          value={q}
          onChangeText={setQ}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#999' }}>
              {filtered.length} élève{filtered.length > 1 ? 's' : ''} 
              {q ? ` (${data.length} au total)` : ''}
            </Text>
          </View>
        </View>
      </View>

      {loading && <View style={{ margin: 12 }}><ActivityIndicator color="#b40a0a" /></View>}

      {/* liste */}
      <FlatList
        key={numColumns}
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 12, justifyContent: 'flex-start' } : undefined}
        removeClippedSubviews={false}
        maxToRenderPerBatch={50}
        updateCellsBatchingPeriod={100}
        initialNumToRender={20}
        windowSize={10}
        getItemLayout={undefined}
        refreshing={loading}
        onRefresh={loadElevesFromServer}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 16, marginBottom: 12 }}>
              {data.length === 0 ? 'Aucune donnée chargée' : 'Aucun résultat pour cette recherche'}
            </Text>
            {data.length === 0 && (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#666', textAlign: 'center', marginBottom: 16 }}>
                  Utilisez les boutons ci-dessus pour charger les données
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#b40a0a', padding: 12, borderRadius: 8 }}
                  onPress={fetchFromServer}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Charger depuis le serveur</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.rowCard, { width: cardWidth, flexDirection: 'row', alignItems: 'flex-start' }]}>
            <Pressable
              style={{ flex: 1, gap: 8 }}
              onPress={() => {
                console.log('ID transmis à la fiche:', item.id);
                router.push(`/tabs/fiche/${item.id}`);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                  {item.photo ? (
                    <Image source={{ uri: item.photo.startsWith('data:image') ? item.photo : `data:image/jpeg;base64,${item.photo}` }} style={[s.photo, { width: photoSize, height: photoSize }]} />
                  ) : (
                    <View style={[s.photo, { width: photoSize, height: photoSize, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}>
                      <Ionicons name="person" size={24} color="#777" />
                    </View>
                  )}
                  {item.ceinture ? (
                    <View style={{
                      height: 6,
                      backgroundColor: BELT_COLORS[item.ceinture] ?? '#555',
                      borderRadius: 3,
                      marginTop: 4,
                      width: photoSize,
                      borderWidth: item.ceinture === 'Blanche' ? 1 : 0,
                      borderColor: '#444',
                    }} />
                  ) : null}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.name, s.fullWidth, Platform.OS === 'web' ? ({ whiteSpace: 'normal' } as any) : undefined]}>{item.prenom} {item.nom}</Text>
                <Text style={[s.muted, s.fullWidth]}>📋 {item.discipline || 'Non spécifié'}</Text>
                {item.licence && (
                  <Text style={[s.mutedSmall, s.fullWidth]}>🏷️ N° {item.licence}</Text>
                )}
                {item.age && (
                  <Text style={[s.mutedSmall, s.fullWidth]}>🎂 {item.age} ans</Text>
                )}
                <View style={{ marginTop: 4 }}>
                  <Text style={[s.mutedSmall, s.fullWidth]}>📞 U: {item.telUrgence || 'Non renseigné'}</Text>
                </View>
                <View>
                  <Text style={[s.mutedSmall, s.fullWidth]}>📱 E: {item.telEleve || 'Non renseigné'}</Text>
                </View>
                {!!item.email && (
                  <Text style={[
                    s.mutedSmall,
                    s.fullWidth,
                    { color: '#4ade80', marginTop: 2 },
                    Platform.OS === 'web' ? ({ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' } as any) : undefined
                  ]}>✉️ {item.email}</Text>
                )}
              </View>
            </Pressable>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#b40a0a',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
                marginTop: 4,
                marginLeft: 4,
                flexShrink: 0,
              }}
              activeOpacity={0.7}
              onPress={() => setDeleteConfirm({ id: item.id, prenom: item.prenom, nom: item.nom })}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <View style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 24, marginHorizontal: 24, width: Math.min(360, width - 48) }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Supprimer élève</Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 6 }}>
              Supprimer {deleteConfirm.prenom} {deleteConfirm.nom} ?
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>Cette action est irréversible.</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: '#374151', borderRadius: 8, padding: 12, alignItems: 'center' }}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Annuler</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, backgroundColor: '#b40a0a', borderRadius: 8, padding: 12, alignItems: 'center' }}
                onPress={() => { const id = deleteConfirm.id; setDeleteConfirm(null); removeEleve(id); }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Bannière erreur suppression */}
      {deleteError && (
        <Pressable
          style={{ position: 'absolute', bottom: 60, left: 16, right: 16, backgroundColor: '#7f1d1d', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 9998 }}
          onPress={() => setDeleteError(null)}
        >
          <Ionicons name="alert-circle" size={20} color="#fca5a5" />
          <Text style={{ color: '#fca5a5', flex: 1, fontSize: 13 }}>{deleteError}</Text>
          <Ionicons name="close" size={16} color="#fca5a5" />
        </Pressable>
      )}

      {/* modal QR */}
      {qrId && null}
      <View style={{ height: 50, backgroundColor: '#000', width: '100%' }} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  card: {
    backgroundColor: '#141414', borderColor: '#475569', borderWidth: 1,
    borderRadius: 12, margin: 12, padding: 12
  },
  h1: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#64748b', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: '#fff',
    backgroundColor: 'rgba(255,255,255,.06)'
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },

  btn: { backgroundColor: '#b40a0a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnSm: { backgroundColor: '#b40a0a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnTx: { color: '#fff' },

  rowCard: {
    backgroundColor: '#111', borderColor: '#28323f', borderWidth: 1,
    borderRadius: 12, padding: 16, marginBottom: 10
  },
  name: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  muted: { color: '#9ca3af', fontSize: 14, marginBottom: 2 },
  mutedSmall: { color: '#9ca3af', fontSize: 12, marginBottom: 1, lineHeight: 16 },
  fullWidth: { width: '100%' },
  photo: {
    width: 70, height: 70, borderRadius: 12,
    borderWidth: 1, borderColor: '#64748b', backgroundColor: '#0b0b0b'
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },

  modal: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,.9)', justifyContent: 'center', alignItems: 'center', padding: 16
  },
  box: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#fff', borderRadius: 12, padding: 16,
    width: Math.min(420, Platform.OS === 'web' ? 420 : 360)
  },

  importBtn: {
  backgroundColor: '#b40a0a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  importBtnTx: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
