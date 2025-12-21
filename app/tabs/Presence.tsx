import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as XLSX from 'xlsx';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { API_CONFIG, API_HEADERS, STORAGE_KEYS } from '../../constants/config';
import { Eleve, Presence as PresenceType } from '../../constants/types';
import { fetchEleves } from '../../lib/api';

const REMOTE_JSON_URL = API_CONFIG.ELEVES_FETCH_URL;

export default function Presence() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [eleves, setEleves] = useState<any[]>([]);
  const [oldPresences, setOldPresences] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fonction pour lire les fichiers de présence précédents
  const loadOldPresences = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRESENCE);
      if (!raw) return setOldPresences([]);
      let arr = [];
      try {
        arr = JSON.parse(raw);
        if (!Array.isArray(arr)) arr = [];
      } catch { arr = []; }
      setOldPresences(arr);
      setSelectedDate(null);
    } catch {
      setOldPresences([]);
      setSelectedDate(null);
    }
  };

  // Fonction pour enregistrer les présences dans un historique (tableau)
  const savePresences = async () => {
    try {
      const presentIds = Object.keys(present).filter((id: string) => present[id]);
      const presentEleves = eleves.filter((e: any) => presentIds.includes(e.id));
      const newPresence = { date: new Date().toISOString(), list: presentEleves };
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRESENCE);
      let history = [];
      if (raw) {
        try {
          history = JSON.parse(raw);
          if (!Array.isArray(history)) history = [];
        } catch { history = []; }
      }
      history.push(newPresence);
      console.log('💾 Présences prêtes pour export:', presentEleves.length);
      Alert.alert('✅ Présences prêtes', `${presentEleves.length} élève(s) présent(s). Utilisez l'export pour partager.`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’enregistrer les présences.');
    }
  };

  useEffect(() => {
    loadElevesFromServer();
  }, []);

  // Charger les élèves depuis le serveur
  const loadElevesFromServer = async () => {
    try {
      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: API_HEADERS
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const arr = await r.json();
      if (!Array.isArray(arr)) throw new Error('JSON inattendu');
      setEleves(arr);
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible de charger les élèves: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  // Export CSV
  const exportToCSV = async () => {
    try {
      console.log('📥 Clic sur export CSV détecté');
      
      // Filtrer les élèves présents
      const presentIds = Object.keys(present).filter((id: string) => present[id]);
      const presentEleves = eleves.filter((e: any) => presentIds.includes(e.id));
      console.log('📋 Élèves présents:', presentEleves.length);

      if (presentEleves.length === 0) {
        Alert.alert('Export CSV', 'Aucun élève présent à exporter');
        return;
      }

      // En-têtes CSV simplifiés
      const headers = ['Nom', 'Prénom', 'Discipline', 'Jour'];

      // Fonction pour échapper les valeurs CSV
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Construire les lignes CSV simplifiées
      const rows = presentEleves.map(eleve => [
        escapeCSV(eleve.nom),
        escapeCSV(eleve.prenom),
        escapeCSV(eleve.discipline),
        escapeCSV(eleve.jour)
      ].join(','));

      // Assembler le CSV
      const csvContent = [
        `Date de saisie,${new Date().toLocaleDateString()}`,
        '',
        headers.join(','),
        ...rows
      ].join('\n');

      console.log('📄 CSV prêt, taille:', csvContent.length);

      if (Platform.OS === 'web') {
        // Sur web : créer un dialog HTML
        const message = `${presentEleves.length} élève(s) présent(s)\n\nComment voulez-vous partager ?\n\n[1] Télécharger\n[2] Email\n[3] WhatsApp\n[4] Copier`;
        const choice = window.prompt(message, '1');

        console.log('User chose:', choice);

        if (choice === '1') {
          // Télécharger
          const element = document.createElement('a');
          element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
          element.setAttribute('download', `presence_${new Date().toISOString().split('T')[0]}.csv`);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          console.log('✅ Téléchargement web réussi');
          Alert.alert('✅ Téléchargé', `${presentEleves.length} élève(s) téléchargé(s).`);
        } else if (choice === '2') {
          // Email
          const subject = `Présences du ${new Date().toLocaleDateString()}`;
          const body = `Élèves présents :\n\n${csvContent}`;
          const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = mailto;
          console.log('✅ Email préparé');
        } else if (choice === '3') {
          // WhatsApp
          const whatsappText = `Présences du ${new Date().toLocaleDateString()}\n\n${csvContent}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
          window.open(whatsappUrl, '_blank');
          console.log('✅ WhatsApp ouvert');
        } else if (choice === '4') {
          // Copier
          navigator.clipboard.writeText(csvContent).then(() => {
            Alert.alert('✅ Copié', 'Le contenu CSV a été copié dans le presse-papiers');
            console.log('✅ Copié dans le presse-papiers');
          });
        } else {
          console.log('⚠️ Partage annulé');
        }
      } else {
        // Sur mobile : utiliser Sharing native (Mail, WhatsApp, etc.)
        const docDir = (FileSystem as any).documentDirectory;
        if (typeof docDir === 'undefined' || !docDir) {
          Alert.alert('Erreur', 'FileSystem non disponible');
          return;
        }
        
        const fileName = `presence_${new Date().toISOString().split('T')[0]}.csv`;
        const filePath = docDir + fileName;
        
        console.log('💾 Création du fichier:', fileName);
        await FileSystem.writeAsStringAsync(filePath, csvContent);
        
        console.log('📤 Ouverture des options de partage...');
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: `Partager ${presentEleves.length} élève(s) présent(s)`
        });
        console.log('✅ Partage mobile réussi');
      }

    } catch (error: any) {
      console.error('❌ Erreur export:', error);
      Alert.alert('Erreur', `Impossible d'exporter: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  // ---- Export Excel (XLSX)
  const exportToExcel = async () => {
    try {
      const presentEleves = filtered.filter(e => present[e.id]);
      console.log('DEBUG: exportToExcel appelée, présents =', presentEleves.length);
      
      if (presentEleves.length === 0) {
        Alert.alert('Erreur', 'Aucun élève présent à exporter');
        return;
      }

      // Préparer les données pour Excel (juste 3 colonnes)
      const excelData = presentEleves.map(eleve => ({
        'Prénom': eleve.prenom,
        'Nom': eleve.nom,
        'Jour': eleve.jour || ''
      }));

      console.log('DEBUG: excelData préparée, éléments:', excelData.length);

      // Créer un workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Présence');

      console.log('DEBUG: workbook créé');

      // Générer le fichier en base64
      const fileName = `presence_${new Date().toISOString().split('T')[0]}.xlsx`;
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log('DEBUG: fichier généré, fileName =', fileName);

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
        
        console.log('📊 Excel téléchargé:', presentEleves.length, 'élèves');
        Alert.alert('Export Excel', `${presentEleves.length} élève(s) exporté(s)`);
      } else {
        // Sur mobile : utiliser le FileSystem et Sharing
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const fileUri = cacheDir ? `${cacheDir}${fileName}` : fileName;
        
        console.log('DEBUG: tentative sauvegarde à', fileUri);
        
        try {
          await (FileSystem as any).writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });
        } catch (e) {
          console.warn('Fallback: écriture directe');
        }

        console.log('DEBUG: fichier sauvegardé');

        // Partager le fichier
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('DEBUG: Sharing disponible?', isAvailable);
        
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Exporter ${presentEleves.length} présence(s)`
          });
        } else {
          Alert.alert('Export Excel', `Fichier sauvegardé: ${fileName}`);
        }

        console.log('📊 Excel exporté:', presentEleves.length, 'élèves');
      }
    } catch (error: any) {
      console.error('💥 Erreur export Excel:', error);
      Alert.alert('Erreur', `Impossible d'exporter: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  const filtered = eleves.filter(e => {
    const q = search.trim().toLowerCase();
    return !q || [e.nom, e.prenom, e.discipline, e.jour].join(' ').toLowerCase().includes(q);
  }).sort((a, b) => {
    const nomA = (a.nom || '').toLowerCase();
    const nomB = (b.nom || '').toLowerCase();
    return nomA.localeCompare(nomB, 'fr');
  });

  const togglePresent = (id: string) => {
    setPresent(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetPresence = () => {
    Alert.alert(
      'Réinitialiser',
      'Êtes-vous sûr de vouloir désélectionner tous les élèves présents ?',
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: () => {
            console.log('Resetting presence from:', present);
            setPresent({});
            setRefreshKey(k => k + 1);
            console.log('Presence reset to empty');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 0 }}>
      <HeaderBar
        title="Présence"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="#fff"
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={resetPresence} style={{ marginRight: 8 }}>
              <Ionicons name="refresh-outline" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={exportToExcel} style={{ marginRight: 8 }}>
              <Ionicons name="document" size={22} color="#ef4444" />
            </Pressable>
            <Pressable onPress={exportToCSV} style={{ marginRight: 8 }}>
              <Ionicons name="download-outline" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={() => router.back()}> 
              <Ionicons name="home" size={22} color="#000" />
            </Pressable>
          </View>
        )}
      />
      <View style={[styles.toolbar, { paddingTop: HEADER_HEIGHT }]}>
        <TextInput
          style={styles.search}
          placeholder="Filtrer par nom, prénom, discipline, jour…"
          placeholderTextColor="#cbd5e1"
          value={search}
          onChangeText={setSearch}
        />
        <Text style={styles.count}>{`Présents: ${Object.values(present).filter(Boolean).length} / ${filtered.length}`}</Text>
        <Pressable onPress={resetPresence} style={{ padding: 8, backgroundColor: '#ef444466', borderRadius: 6, marginLeft: 8 }}>
          <Ionicons name="refresh-outline" size={18} color="#ef4444" />
        </Pressable>
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}><Text style={{ color: '#999' }}>Aucun élève trouvé.</Text></View>
      ) : (
        <FlatList
          key={refreshKey}
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={2}
          extraData={present}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tile, present[item.id] && styles.tilePresent]}
              onPress={() => togglePresent(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.phWrap}>
                <Image source={item.photo ? { uri: item.photo.startsWith('data:image') ? item.photo : `data:image/jpeg;base64,${item.photo}` } : require('../../assets/images/partial-react-logo.png')} style={styles.photo} />
              </View>
              <View style={styles.caption}>
                <Text style={styles.name}>{item.prenom} {item.nom}</Text>
                <Text style={styles.sub}>{item.discipline}{item.jour ? ` • ${item.jour}` : ''}</Text>
              </View>
              {present[item.id] && (
                <View style={styles.presentBadge}><Text style={styles.presentBadgeText}>Présent</Text></View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={() => (
            <View style={styles.presentTableWrap}>
              <Text style={styles.presentTableDate}>Date de saisie : {new Date().toLocaleDateString()}</Text>
              <Text style={styles.presentTableTitle}>Élèves présents :</Text>
              <View style={styles.presentTable}>
                {filtered.filter(e => present[e.id]).length === 0 ? (
                  <Text style={styles.presentTableEmpty}>Aucun élève présent.</Text>
                ) : (
                  filtered.filter(e => present[e.id]).map(e => (
                    <View key={e.id} style={styles.presentTableRow}>
                      <Text style={styles.presentTableCell}>{e.prenom} {e.nom}</Text>
                      <Text style={styles.presentTableCell}>{e.discipline}</Text>
                      <Text style={styles.presentTableCell}>{e.jour}</Text>
                    </View>
                  ))
                )}
              </View>
              {oldPresences.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>Historique local :</Text>
                  {/* Sélecteur de date */}
                  <View style={{ marginBottom: 8 }}>
                    {oldPresences.map((p, idx) => (
                      <TouchableOpacity key={idx} style={{ padding: 6, backgroundColor: selectedDate === p.date ? '#ef4444' : '#222', borderRadius: 6, marginBottom: 4 }} onPress={() => setSelectedDate(p.date)}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                          Date : {p.date && !isNaN(Date.parse(p.date ?? '')) ? new Date(p.date).toLocaleDateString() : 'Date invalide'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Affichage des présences pour la date sélectionnée */}
                  {selectedDate && (
                    <View style={{ marginBottom: 6 }}>
                      <Text style={{ color: '#cbd5e1', fontSize: 12 }}>
                        Présents le {selectedDate && !isNaN(Date.parse(selectedDate ?? '')) ? new Date(selectedDate ?? '').toLocaleDateString() : 'Date invalide'} :
                      </Text>
                      {(() => {
                        const found = oldPresences.find(p => p.date === selectedDate);
                        if (!found || !Array.isArray(found.list) || found.list.length === 0) {
                          return <Text style={{ color: '#fff', fontSize: 11 }}>Aucun élève présent.</Text>;
                        }
                        return found.list.map((e: any) => (
                          <Text key={e.id} style={{ color: '#fff', fontSize: 11 }}>{e.prenom} {e.nom} • {e.discipline} • {e.jour}</Text>
                        ));
                      })()}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: '#ef4444', borderRadius: 10, margin: 16, marginBottom: 0 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  headerSub: { color: '#cbd5e1', fontSize: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: 16 },
  search: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ffffff55', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  switchLabel: { color: '#cbd5e1', fontSize: 13 },
  count: { marginLeft: 'auto', color: '#cbd5e1', fontSize: 12 },
  grid: { gap: 12, padding: 12 },
  tile: { flex: 1, margin: 4, backgroundColor: '#0b0b0bcc', borderRadius: 10, borderWidth: 1, borderColor: '#ffffff55', overflow: 'hidden', position: 'relative', maxWidth: 130 },
  tilePresent: { borderColor: '#ef4444', borderWidth: 3 },
  phWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#000' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover', backgroundColor: '#222', borderRadius: 0 },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8 },
  name: { fontWeight: '700', color: '#fff', fontSize: 12 },
  sub: { fontSize: 9, color: '#e5e7eb' },
  presentBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ef4444', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  presentBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { color: '#fff', backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', borderWidth: 1, padding: 14, borderRadius: 10, textAlign: 'center', margin: 12 },
  list: { padding: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, padding: 10, marginBottom: 10 },
  listPhoto: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#222' },
  presentTableWrap: { marginTop: 24, backgroundColor: '#18181b', borderRadius: 10, padding: 12 },
  presentTableDate: { color: '#cbd5e1', fontSize: 12, marginBottom: 4 },
  presentTableTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  presentTable: {},
  presentTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 4 },
  presentTableCell: { flex: 1, color: '#fff', fontSize: 11 },
  presentTableEmpty: { color: '#fff', fontSize: 12, fontStyle: 'italic', padding: 8 },
  saveBtn: { backgroundColor: '#22c55e', marginTop: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnTx: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  homeBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  homeBtnTx: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
