import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import HeaderBar from '../../components/header-bar';
import { API_CONFIG, BELT_COLORS } from '../../constants/config';
import { BeltTechnique, EvaluationData } from '../../constants/types';

const BELTS_BY_DISCIPLINE: { [key: string]: string[] } = {
  MMA: ['Jaune', 'Orange', 'Verte', 'Bleue', 'Violette', 'Marron', 'Noire I'],
  'Krav-Maga': ['Jaune', 'Orange', 'Verte', 'Bleue', 'Violette', 'Marron', 'Noire I'],
  Kids: ['Jaune I', 'Jaune II', 'Jaune III', 'Orange I', 'Orange II', 'Orange III'],
  Warriors: ['Jaune I', 'Jaune II', 'Jaune III', 'Orange I', 'Orange II', 'Orange III', 'Verte'],
};

const getBeltLabel = (belt: string): string => {
  const emoji = belt.includes('Jaune') ? '🟨' : 
                belt.includes('Orange') ? '🟧' : 
                belt.includes('Verte') ? '🟩' : 
                belt.includes('Bleue') ? '🟦' : 
                belt.includes('Violette') ? '🟪' : 
                belt.includes('Marron') ? '🟫' : 
                belt.includes('Noire') ? '⬛' : '⬜';
  return emoji + '  ' + belt;
};

export default function Evaluations() {
  const router = useRouter();
  const [discipline, setDiscipline] = useState<string>('MMA');
  const [selectedBelt, setSelectedBelt] = useState(BELTS_BY_DISCIPLINE['MMA'][0]);
  const [beltModalVisible, setBeltModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [techniques, setTechniques] = useState<string[]>([]);

  const beltsToShow = BELTS_BY_DISCIPLINE[discipline] || BELTS_BY_DISCIPLINE['MMA'];

  useEffect(() => {
    const newBelts = BELTS_BY_DISCIPLINE[discipline] || BELTS_BY_DISCIPLINE['MMA'];
    setSelectedBelt(newBelts[0]);
  }, [discipline]);

  useEffect(() => {
    const fetchTechniques = async () => {
      setLoading(true);
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
      const url = `${API_CONFIG.EVALUATIONS_URL}/${fileName}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          setTechniques([]);
        } else {
          const data = await response.json();
          let list: string[] = [];
          if (Array.isArray(data.techniques)) list = data.techniques;
          else if (Array.isArray(data.evaluations)) list = data.evaluations;
          else if (Array.isArray(data.liste)) list = data.liste;
          setTechniques(list);
        }
      } catch (e) {
        setTechniques([]);
      }
      setLoading(false);
    };

    fetchTechniques();
  }, [discipline, selectedBelt]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <HeaderBar
        title="Évaluations"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="#fff"
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { setSelectedBelt(beltsToShow[0]); setTechniques([]); }} style={{ marginRight: 8 }}>
              <Ionicons name="refresh-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={{ marginRight: 8 }}>
              <Ionicons name="download-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="home" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={{ backgroundColor: '#fff', width: '100%', height: 24 }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Discipline buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, width: '100%', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setDiscipline('MMA')} style={{ backgroundColor: discipline === 'MMA' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>MMA</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDiscipline('Krav-Maga')} style={{ backgroundColor: discipline === 'Krav-Maga' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Krav-Maga</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDiscipline('Kids')} style={{ backgroundColor: discipline === 'Kids' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kids</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDiscipline('Warriors')} style={{ backgroundColor: discipline === 'Warriors' ? '#ef4444' : '#222', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Warriors</Text>
          </TouchableOpacity>
        </View>

        {/* Belt Picker */}
        <View style={styles.pickerWrap}>
          <Text style={styles.pickerLabel}>Ceinture :</Text>
          {selectedBelt ? (
            <TouchableOpacity style={[styles.pickerBox, { backgroundColor: '#18181b', borderColor: '#b40a0a', borderWidth: 1, borderRadius: 8, padding: 12 }]} onPress={() => setBeltModalVisible(true)}>
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {getBeltLabel(selectedBelt)}
              </Text>
            </TouchableOpacity>
          ) : null}
          <Modal visible={beltModalVisible}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 16, minWidth: 260 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Sélectionne la ceinture</Text>
                {beltsToShow.map((belt: string) => (
                  <TouchableOpacity
                    key={belt}
                    style={{ paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 }}
                    onPress={() => { setSelectedBelt(belt); setBeltModalVisible(false); }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{getBeltLabel(belt)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setBeltModalVisible(false)}>
                  <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Techniques Display */}
        {loading ? (
          <ActivityIndicator size="large" color="#ffe066" />
        ) : (
          <>
            {techniques.length > 0 && (
              <View style={styles.evalBlockImproved}>
                {techniques.map((item: string, idx: number) => (
                  <Text key={idx} style={styles.bulletItem}>{'• '}{item}</Text>
                ))}
              </View>
            )}
            {techniques.length === 0 && !loading && (
              <Text style={{ color: '#888', fontSize: 15, marginTop: 8 }}>Aucune technique pour cette ceinture.</Text>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
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
  evalBlockImproved: {
    marginTop: 18,
    alignSelf: 'stretch',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bulletItem: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'left',
  },
});
