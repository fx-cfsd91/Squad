import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';

const BELTS = [
  'Jaune I',
  'Jaune II',
  'Jaune III',
  'Orange I',
  'Orange II',
  'Orange III',
  'Verte',
  'Bleue',
  'Marron',
  'Noire I',
  'Noire II',
  'Noire III',
  'Noire IV',
  'Noire V',
  'Noire VI',
];

export default function Evaluations() {
  const router = useRouter();
  const [selectedBelt, setSelectedBelt] = useState(BELTS[0]);
  const [beltModalVisible, setBeltModalVisible] = useState(false);
  const [discipline, setDiscipline] = useState<string>('MMA');
  const [techniquesData, setTechniquesData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Charge le JSON à chaque changement de discipline ou ceinture
  useEffect(() => {
    const fetchTechniques = async () => {
      setRefreshing(true);
      setTechniquesData(null);
      let filePrefix = '';
      let fileBelt = '';
      switch (discipline) {
        case 'Kids':
          filePrefix = 'KIDS';
          fileBelt = selectedBelt.replace(/ /g, '');
          break;
        case 'Krav-Maga':
          filePrefix = 'KRAV';
          if (selectedBelt === 'Jaune') {
            fileBelt = 'Yellow';
          } else {
            fileBelt = selectedBelt.replace(/ /g, '');
          }
          break;
        case 'MMA':
          filePrefix = 'MMA';
          fileBelt = selectedBelt.replace(/ /g, '');
          break;
        case 'Warriors':
          filePrefix = 'WAR';
          fileBelt = selectedBelt.replace(/ /g, '');
          break;
        default:
          filePrefix = typeof discipline === 'string' ? discipline.toUpperCase() : '';
          fileBelt = selectedBelt.replace(/ /g, '');
      }
      const fileName = `${filePrefix}${fileBelt}.json`;
      const url = `https://cfsd91.com/appli/${fileName}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          setTechniquesData({ _debugError: `HTTP ${response.status}`, _debugUrl: url });
        } else {
          const data = await response.json();
          setTechniquesData({ ...data, _debugUrl: url });
        }
      } catch (e) {
        setTechniquesData({ _debugError: String(e), _debugUrl: url });
      }
      setRefreshing(false);
    };
    fetchTechniques();
  }, [discipline, selectedBelt]);

  // Vérifier l'identification à chaque fois que la page devient active
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const identifie = await AsyncStorage.getItem('cfsd91_identifie');
        if (identifie !== '1') {
          Alert.alert(
            'Accès restreint',
            'Vous devez vous identifier en tant qu\'élève pour accéder aux évaluations.',
            [
              { text: 'S\'identifier', onPress: () => router.push('/identification') },
              { text: 'Retour', onPress: () => router.back() }
            ]
          );
        }
      })();
    }, [router])
  );

  let beltsToShow: string[] = [];
  if (discipline === 'Kids') beltsToShow = BELTS.slice(0,6);
  else if (discipline === 'Warriors') beltsToShow = BELTS.slice(0,8).filter(belt => belt !== 'Bleue');
  else if (discipline === 'MMA' || discipline === 'Krav-Maga') beltsToShow = ['Jaune', 'Orange', 'Verte', 'Bleue', 'Violette', 'Marron'];

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar
        title="Évaluations"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="transparent"
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.push('/')} accessibilityLabel="Accueil" style={{ padding: 6 }}>
              <Ionicons name="home" size={20} color="#000" />
            </Pressable>
          </View>
        )}
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#000', paddingTop: HEADER_HEIGHT }} contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Discipline buttons on two lines, no label */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            <TouchableOpacity onPress={() => setDiscipline('MMA')} style={{ backgroundColor: discipline === 'MMA' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginRight: 4, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>MMA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDiscipline('Krav-Maga')} style={{ backgroundColor: discipline === 'Krav-Maga' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginRight: 4, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Krav-Maga</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDiscipline('Kids')} style={{ backgroundColor: discipline === 'Kids' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginRight: 4, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kids</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDiscipline('Warriors')} style={{ backgroundColor: discipline === 'Warriors' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Warriors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Bandeau titre supprimé */}
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Ceinture :</Text>
          {selectedBelt ? (
            <TouchableOpacity style={[styles.pickerBox, {backgroundColor: '#18181b', borderColor: '#b40a0a', borderWidth: 1, borderRadius: 8, padding: 12}]} onPress={() => setBeltModalVisible(true)}>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {(() => {
                  switch (selectedBelt) {
                    case 'Jaune': return '🟨  Jaune';
                    case 'Orange': return '🟧  Orange';
                    case 'Verte': return '🟩  Verte';
                    case 'Bleue': return '🟦  Bleue';
                    case 'Marron': return '🟫  Marron';
                    case 'Noire I':
                    case 'Noire II':
                    case 'Noire III':
                    case 'Noire IV':
                    case 'Noire V':
                    case 'Noire VI':
                      return '⬛  ' + selectedBelt;
                    default: return selectedBelt;
                  }
                })()}
              </Text>
            </TouchableOpacity>
          ) : null}
        <Modal
          visible={beltModalVisible}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 16, minWidth: 260 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Sélectionne la ceinture</Text>
              {beltsToShow.map(belt => {
                let label = belt;
                let color = '#222';
                switch (belt) {
                  case 'Jaune':
                  case 'Jaune I':
                  case 'Jaune II':
                  case 'Jaune III':
                    label = '🟨  ' + belt;
                    color = '#ffe066';
                    break;
                  case 'Orange':
                  case 'Orange I':
                  case 'Orange II':
                  case 'Orange III':
                    label = '🟧  ' + belt;
                    color = '#ff9900';
                    break;
                  case 'Verte':
                    label = '🟩  Verte';
                    color = '#4ade80';
                    break;
                  case 'Bleue':
                    label = '🟦  Bleue';
                    color = '#3b82f6';
                    break;
                  case 'Violette':
                    label = '🟪  Violette';
                    color = '#a78bfa';
                    break;
                  case 'Marron':
                    label = '🟫  Marron';
                    color = '#a0522d';
                    break;
                  case 'Noire I':
                  case 'Noire II':
                  case 'Noire III':
                  case 'Noire IV':
                  case 'Noire V':
                  case 'Noire VI':
                    label = '⬛  ' + belt;
                    color = '#18181b';
                    break;
                  default: break;
                }
                return (
                  <TouchableOpacity
                    key={belt}
                    style={{ paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 }}
                    onPress={() => { setSelectedBelt(belt); setBeltModalVisible(false); }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setBeltModalVisible(false)}>
                <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      {/* Affichage dynamique des techniques du JSON chargé */}
      {techniquesData && (
        <View style={styles.evalBlockImproved}>
          {(() => {
            let list = [];
            if (Array.isArray(techniquesData.techniques)) list = techniquesData.techniques;
            else if (Array.isArray(techniquesData.evaluations)) list = techniquesData.evaluations;
            else if (Array.isArray(techniquesData.liste)) list = techniquesData.liste;
            if (techniquesData._debugError || list.length === 0) {
              return <Text style={{ color: '#888', fontSize: 15, marginTop: 8 }}>Aucune technique pour cette ceinture.</Text>;
            }
            return list.map((item: any, idx: number) => (
              <Text key={idx} style={styles.bulletItem}>{'• '}{item}</Text>
            ));
          })()}
        </View>
      )}
      {/* Ajoute ici le contenu de la page d'évaluations */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    color: '#b40a0a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  pickerWrap: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  pickerLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '700',
  },
  pickerBox: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#1e293b',
    width: '100%',
    height: 50,
  },
  placeholder: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#18181b',
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  backBtn: {
    position: 'absolute',
    top: 30,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
    zIndex: 10,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  evalBlockImproved: {
    marginTop: 18,
    alignSelf: 'stretch',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  bulletList: {
    marginLeft: 12,
  },
  bulletItem: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'left',
  },
  evalSectionTitle: {
    color: '#b40a0a',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  evalText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 18,
    fontWeight: '600',
    textAlign: 'left',
    alignSelf: 'flex-start'
  }
});
