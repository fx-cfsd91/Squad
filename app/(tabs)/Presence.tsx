import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';

const REMOTE_JSON_URL = 'https://cfsd91.com/eleves.php';
const STORAGE_KEY = 'eleves_cfsd91';
const PRESENCE_KEY = 'presences_cfsd91';
const PRESENCE_UPLOAD_URL = 'https://cfsd91.com/presences_save.php';

export default function Presence() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [eleves, setEleves] = useState<any[]>([]);
  const [oldPresences, setOldPresences] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fonction pour lire les fichiers de présence précédents
  const loadOldPresences = async () => {
    try {
      const raw = await AsyncStorage.getItem(PRESENCE_KEY);
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
      const raw = await AsyncStorage.getItem(PRESENCE_KEY);
      let history = [];
      if (raw) {
        try {
          history = JSON.parse(raw);
          if (!Array.isArray(history)) history = [];
        } catch { history = []; }
      }
      history.push(newPresence);
      await AsyncStorage.setItem(PRESENCE_KEY, JSON.stringify(history));
      Alert.alert('Présences enregistrées', `${presentEleves.length} élève(s) présent(s) sauvegardé(s).`);
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
      console.log('🎯 Presence - Chargement depuis le serveur...');
      const r = await fetch(REMOTE_JSON_URL, {
        cache: 'no-store',
        headers: { 'X-API-KEY': 'KEYOFSQUAD01@' }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const arr = await r.json();
      if (!Array.isArray(arr)) throw new Error('JSON inattendu');
      console.log('🎯 Presence - Chargé:', arr.length, 'élèves');
      setEleves(arr);
    } catch (error: any) {
      console.error('💥 Erreur chargement élèves:', error);
      Alert.alert('Erreur', `Impossible de charger les élèves: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  // Export CSV
  const exportToCSV = async () => {
    try {
      if (eleves.length === 0) {
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
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Construire les lignes CSV
      const rows = eleves.map(eleve => [
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

      // Sauvegarder le fichier dans le cache
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

      console.log('📊 CSV exporté:', eleves.length, 'élèves');
    } catch (error: any) {
      console.error('💥 Erreur export CSV:', error);
      Alert.alert('Erreur', `Impossible d'exporter le CSV: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  const filtered = eleves.filter(e => {
    const q = search.trim().toLowerCase();
    return !q || [e.nom, e.prenom, e.discipline, e.jour].join(' ').toLowerCase().includes(q);
  });

  const togglePresent = (id: string) => {
    setPresent(prev => ({ ...prev, [id]: !prev[id] }));
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
            <Pressable onPress={exportToCSV} style={{ marginRight: 8 }}>
              <Ionicons name="download-outline" size={22} color="#000" />
            </Pressable>
            <Pressable onPress={() => router.push('/')}> 
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
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}><Text style={{ color: '#999' }}>Aucun élève trouvé.</Text></View>
      ) : (
        <>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            numColumns={2}
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
          />
          {/* Tableau des élèves présents */}
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
        </>
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
