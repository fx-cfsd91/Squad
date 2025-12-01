// app/(tabs)/recapitulatif.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import HeaderBar from '../../components/header-bar';

const STORAGE_KEY = 'eleves_cfsd91';
const REMOTE_JSON_URL = 'https://cfsd91.com/eleves.php';
const UPLOAD_URL      = 'https://cfsd91.com/eleves_save.php';
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
    // ---- supprimer
    const removeEleve = async (id: string) => {
      const next = data.filter(x => x.id !== id);
      setData(next);
      try {
        const r = await fetch(REMOTE_JSON_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': 'KEYOFSQUAD01@'
          },
          body: JSON.stringify({ data: next })
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const out = await r.json();
        if (!out.ok && !out.success) throw new Error(out.error || 'Erreur serveur');
        Alert.alert('Suppression OK', `${out.count} enregistrements restants`);
      } catch (e: any) {
        Alert.alert('Erreur suppression', e?.message || 'Erreur inconnue');
      }
    };
  const [data, setData] = useState<Eleve[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrId, setQrId] = useState<string | null>(null);
  const [lastError, setLastError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [fileSearchVisible, setFileSearchVisible] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [fileResults, setFileResults] = useState<Eleve[]>([]);
  const clean = (s?: any) => (s == null ? '' : String(s).trim());

  // ---- actions serveur uniquement
  const fetchFromServer = async () => {
    try {
      setLoading(true); setLastError('');
      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: { 'X-API-KEY': 'KEYOFSQUAD01@' }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let arrRaw: any = await r.json();
      console.log('Server response fetchFromServer type:', typeof arrRaw, Object.keys(arrRaw || {}));
      let arr: Eleve[] = [];
      if (Array.isArray(arrRaw)) arr = arrRaw;
      else if (arrRaw && Array.isArray(arrRaw.data)) arr = arrRaw.data;
      else if (arrRaw && Array.isArray(arrRaw.eleves)) arr = arrRaw.eleves;
      else if (arrRaw && Array.isArray(arrRaw.results)) arr = arrRaw.results;
      else {
        // try to coerce if it's a string containing JSON array
        try { const parsed = JSON.parse(String(arrRaw)); if (Array.isArray(parsed)) arr = parsed; } catch(_){}
      }
      if (!Array.isArray(arr)) throw new Error('JSON inattendu (tableau)');
      setData(arr);
      setLastSyncTime(new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Écrire la copie locale `eleves.json` dans le FileSystem pour contourner
      // les limites d'AsyncStorage/SQLite sur Android (Row too big...).
      try {
        const fileUri = `${FileSystem.documentDirectory}${TARGET_JSON_NAME}`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(arr));
        console.log('📁 eleves.json sauvegardé:', fileUri);
      } catch (fsErr) {
        console.error('❌ Impossible d\'écrire eleves.json:', fsErr);
      }
      Alert.alert('Import OK', `${arr.length} enregistrements depuis le serveur`);
    } catch (e: any) {
      setLastError('IMPORT: ' + (e?.message || 'Erreur'));
      Alert.alert('Erreur import', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  const uploadToServer = async (arr: Eleve[]) => {
    try {
      setLoading(true); setLastError('');
      // Envoi direct de la nouvelle liste pour écrasement
      const r = await fetch(REMOTE_JSON_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'KEYOFSQUAD01@'
        },
        body: JSON.stringify({ data: arr })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      if (!out.ok) throw new Error(out.error || 'Erreur serveur');
      Alert.alert('Téléversement OK', `${out.count} enregistrements`);
    } catch (e: any) {
      setLastError('UPLOAD: ' + (e?.message || 'Erreur'));
      Alert.alert('Erreur upload', e?.message || '');
    } finally {
      setLoading(false);
    }
  };


  // ---- copier lien fiche web
  // Fonction copyLink retirée

  // ---- export CSV
  const exportToCSV = async () => {
    try {
      if (data.length === 0) {
        Alert.alert('Export CSV', 'Aucune donnée à exporter');
        return;
      }

      // En-têtes CSV
      const headers = [
        'ID', 'Nom', 'Prénom', 'Naissance', 'Age', 'Jour', 'Discipline', 
        'Combattant', 'Étudiant', 'Tél. Urgence', 'Tél. Élève', 'Email', 
        'Adresse', 'Ceinture', 'Licence', 'Date création'
      ];

      // Fonction pour échapper les valeurs CSV
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Si contient virgule, guillemet ou saut de ligne, encadrer avec guillemets
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Construire les lignes CSV
      const rows = data.map(eleve => [
        escapeCSV(eleve.id),
        escapeCSV(eleve.nom),
        escapeCSV(eleve.prenom),
        escapeCSV(eleve.naissance),
        escapeCSV(eleve.age),
        escapeCSV(eleve.jour),
        escapeCSV(eleve.discipline),
        escapeCSV(eleve.combattant ? 'Oui' : 'Non'),
        escapeCSV(eleve.etudiant ? 'Oui' : 'Non'),
        escapeCSV(eleve.telUrgence),
        escapeCSV(eleve.telEleve),
        escapeCSV(eleve.email),
        escapeCSV(eleve.adresse),
        escapeCSV(eleve.ceinture),
        escapeCSV(eleve.licence),
        escapeCSV(eleve.createdAt)
      ].join(','));

      // Assembler le CSV complet
      const csvContent = [headers.join(','), ...rows].join('\n');

      // Sauvegarder le fichier dans le cache (compatible avec toutes les versions)
      const fileName = `eleves_cfsd91_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Partager le fichier
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les élèves en CSV'
        });
      } else {
        Alert.alert('Export CSV', `Fichier sauvegardé: ${fileName}`);
      }

      console.log('📊 CSV exporté:', data.length, 'élèves');
    } catch (error: any) {
      console.error('💥 Erreur export CSV:', error);
      Alert.alert('Erreur', `Impossible d'exporter le CSV: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  // ---- recherche
  const filtered = useMemo(() => {
    if (!q) return data;
    
    const s = q.toLowerCase();
    const result = data.filter(e =>
      [e.nom, e.prenom, e.discipline, e.jour, e.telUrgence, e.telEleve, e.email]
        .some(v => (v || '').toLowerCase().includes(s))
    );
    
    console.log('🔍 Recherche "' + q + '":', result.length, 'résultats');
    return result;
  }, [data, q]);

  // ---- init - charger uniquement depuis le serveur
  useEffect(() => {
    loadElevesFromServer();
  }, []);

  // Rafraîchir quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      loadElevesFromServer();
    }, [])
  );

  const loadElevesFromServer = async () => {
    try {
      setLoading(true);
      console.log('📊 Récap - Chargement depuis le serveur...');
      
      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: { 'X-API-KEY': 'KEYOFSQUAD01@' }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let arrRaw: any = await r.json();
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

      console.log('📊 Récap - Chargé:', arr.length, 'élèves depuis le serveur');
      setData(arr);
      setLastSyncTime(new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Sauvegarder une copie locale pour lecture ultérieure (fallback)
      (async () => {
        try {
          const fileUri = `${FileSystem.documentDirectory}${TARGET_JSON_NAME}`;
          await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(arr));
          console.log('📁 eleves.json sauvegardé (load):', fileUri);
        } catch (fsErr) {
          console.error('❌ Erreur écriture eleves.json (load):', fsErr);
        }
      })();
    } catch (error: any) {
      console.error('💥 Erreur chargement élèves:', error);
      setData([]);
      setLastError(error?.message || 'Erreur');
      Alert.alert('Erreur', `Impossible de charger les élèves depuis le serveur: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
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
            <Pressable onPress={exportToCSV} accessibilityLabel="Exporter CSV" style={{ padding: 6 }}>
              <Ionicons name="download-outline" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={() => router.push('/')} accessibilityLabel="Accueil" style={{ padding: 6 }}>
              <Ionicons name="home" size={22} color="#000" />
            </Pressable>
          </View>
        )}
      />

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
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={async () => {
              try {
                const fileUri = `${FileSystem.documentDirectory}${TARGET_JSON_NAME}`;
                const info = await FileSystem.getInfoAsync(fileUri);
                if (!info.exists) {
                  Alert.alert('Fichier introuvable', 'eleves.json non trouvé dans le stockage local. Chargez les données depuis le serveur d\'abord.');
                  return;
                }
                const content = await FileSystem.readAsStringAsync(fileUri);
                const arr = JSON.parse(content) as Eleve[];
                const q = (fileQuery || '').toLowerCase().trim();
                if (!q) { setFileResults(arr.slice(0, 30)); return; }
                const tokens = q.split(/\s+/).filter(Boolean);
                const results = arr.filter(e => {
                  const full = `${clean(e.prenom)} ${clean(e.nom)}`.toLowerCase();
                  const email = (clean(e.email) || '').toLowerCase();
                  // match name tokens
                  const nameOk = tokens.every(t => full.includes(t));
                  const emailOk = tokens.every(t => email.includes(t));
                  return nameOk || emailOk;
                });
                setFileResults(results);
              } catch (err:any) {
                console.error('Erreur recherche fichier:', err);
                Alert.alert('Erreur', err?.message || 'Impossible de lire eleves.json');
              }
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
                    router.push({ pathname: '/fiche/[id]', params: { id: String(item.id) } });
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

  {loading ? (
    <View style={{ margin: 12 }}>
      <ActivityIndicator color="#b40a0a" />
    </View>
  ) : null}

      {/* liste */}
      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12 }}
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
          <TouchableOpacity style={s.rowCard} onPress={() => {
            console.log('ID transmis à la fiche:', item.id);
            router.push({ pathname: '/(tabs)/fiche/[id]', params: { id: String(item.id) } });
          }}>
            <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
              {item.photo ? (
                <Image source={{ uri: item.photo.startsWith('data:image') ? item.photo : `data:image/jpeg;base64,${item.photo}` }} style={s.photo} />
              ) : (
                <View style={[s.photo, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}> 
                  <Ionicons name="person" size={24} color="#777" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.prenom} {item.nom}</Text>
                <Text style={s.muted}>📋 {item.discipline || 'Non spécifié'}</Text>
                {item.licence && (
                  <Text style={s.mutedSmall}>🏷️ N° {item.licence}</Text>
                )}
                {item.age && (
                  <Text style={s.mutedSmall}>🎂 {item.age} ans</Text>
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                  <Text style={s.mutedSmall}>📞 U: {item.telUrgence || 'Non renseigné'}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Text style={s.mutedSmall}>📱 E: {item.telEleve || 'Non renseigné'}</Text>
                </View>
                {!!item.email && (
                  <Text style={[s.mutedSmall, { color: '#4ade80', marginTop: 2 }]}>✉️ {item.email}</Text>
                )}
              </View>
            </View>
            <View style={s.actions}>
              {/* Boutons QR et Copier lien retirés */}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* modal QR */}
      {qrId && (
        {/* Modal QR retiré */}
      )}
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
