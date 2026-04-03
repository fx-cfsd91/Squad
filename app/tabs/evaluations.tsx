import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderBar from '../../components/header-bar';
import { API_CONFIG } from '../../constants/config';

const BELTS_BY_DISCIPLINE: { [key: string]: string[] } = {
  MMA: ['Jaune', 'Orange', 'Verte', 'Bleue', 'Violette', 'Marron', 'Noire I'],
  'Krav-Maga': ['Jaune', 'Orange', 'Verte', 'Bleue', 'Violette', 'Marron', 'Noire I'],
  Kids: ['Jaune I', 'Jaune II', 'Jaune III', 'Orange I', 'Orange II', 'Orange III'],
  Warriors: ['Jaune I', 'Jaune II', 'Jaune III', 'Orange I', 'Orange II', 'Orange III', 'Verte'],
};

const DISCIPLINES = ['MMA', 'Krav-Maga', 'Kids', 'Warriors'] as const;

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

const isSectionHeader = (line: string): boolean => {
  const text = line.trim();
  if (!text) return false;
  if (text.endsWith(':')) return true;
  return text.length <= 24 && /^[A-ZÀ-ÖØ-Ý0-9\s'’\-/]+$/.test(text);
};

const isScenarioTitle = (line: string): boolean => /^\d+\s*[:.]/.test(line.trim());

type SectionContent =
  | { kind: 'scenario'; title: string; items: string[] }
  | { kind: 'item'; text: string };

type EvaluationSection = {
  id: string;
  title: string;
  contents: SectionContent[];
};

const buildEvaluationSections = (techniques: string[]): EvaluationSection[] => {
  const sections: EvaluationSection[] = [];
  let currentSection: EvaluationSection | null = null;
  let currentScenario: { title: string; items: string[] } | null = null;

  const ensureSection = (title = 'Général') => {
    if (!currentSection) {
      currentSection = {
        id: `${title.toLowerCase().replace(/\s+/g, '-')}-${sections.length}`,
        title,
        contents: [],
      };
    }
  };

  const flushSection = () => {
    if (!currentSection) return;
    if (currentSection.contents.length > 0) {
      sections.push(currentSection);
    }
    currentSection = null;
  };

  const flushScenario = () => {
    if (!currentScenario) return;
    ensureSection();
    currentSection!.contents.push({ kind: 'scenario', title: currentScenario.title, items: currentScenario.items });
    currentScenario = null;
  };

  for (const raw of techniques) {
    const line = raw?.trim();
    if (!line) continue;

    if (isScenarioTitle(line)) {
      flushScenario();
      ensureSection();
      currentScenario = { title: line, items: [] };
      continue;
    }

    if (isSectionHeader(line)) {
      flushScenario();
      flushSection();
      const title = line.replace(/\s*:\s*$/, '');
      currentSection = {
        id: `${title.toLowerCase().replace(/\s+/g, '-')}-${sections.length}`,
        title,
        contents: [],
      };
      continue;
    }

    if (currentScenario) {
      currentScenario.items.push(line);
    } else {
      ensureSection();
      currentSection!.contents.push({ kind: 'item', text: line });
    }
  }

  flushScenario();
  flushSection();

  if (sections.length === 0) {
    const fallbackItems = techniques
      .map((t) => t?.trim())
      .filter(Boolean)
      .map((text) => ({ kind: 'item' as const, text: text! }));

    if (fallbackItems.length > 0) {
      sections.push({
        id: 'general-0',
        title: 'Général',
        contents: fallbackItems,
      });
    }
  }

  return sections;
};

export default function Evaluations() {
  const router = useRouter();
  const [discipline, setDiscipline] = useState<string>('MMA');
  const [selectedBelt, setSelectedBelt] = useState(BELTS_BY_DISCIPLINE['MMA'][0]);
  const [beltModalVisible, setBeltModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [techniques, setTechniques] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const activeRequestIdRef = useRef(0);

  const beltsToShow = BELTS_BY_DISCIPLINE[discipline] || BELTS_BY_DISCIPLINE['MMA'];
  const evaluationSections = useMemo(() => buildEvaluationSections(techniques), [techniques]);

  useEffect(() => {
    const newBelts = BELTS_BY_DISCIPLINE[discipline] || BELTS_BY_DISCIPLINE['MMA'];
    setSelectedBelt(newBelts[0]);
  }, [discipline]);

  useEffect(() => {
    setExpandedSections({});
  }, [discipline, selectedBelt]);

  useEffect(() => {
    const fetchTechniques = async () => {
      const requestId = ++activeRequestIdRef.current;
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
      const url = `${API_CONFIG.EVALUATIONS_URL}/${fileName}?v=${Date.now()}`;

      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (requestId !== activeRequestIdRef.current) return;

        if (!response.ok) {
          setTechniques([]);
        } else {
          const data = await response.json();
          if (requestId !== activeRequestIdRef.current) return;

          let list: string[] = [];
          if (Array.isArray(data.techniques)) list = data.techniques;
          else if (Array.isArray(data.evaluations)) list = data.evaluations;
          else if (Array.isArray(data.liste)) list = data.liste;
          setTechniques(list);
        }
      } catch (e) {
        if (requestId !== activeRequestIdRef.current) return;
        setTechniques([]);
      }

      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    };

    fetchTechniques();
  }, [discipline, selectedBelt]);

  return (
    <View style={styles.screen}>
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
      <View style={styles.headerSpacer} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Discipline buttons */}
        <View style={styles.disciplineRow}>
          {DISCIPLINES.map((item) => {
            const active = discipline === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setDiscipline(item)}
                style={[styles.disciplineBtn, active ? styles.disciplineBtnActive : null]}
              >
                <Text style={[styles.disciplineText, active ? styles.disciplineTextActive : null]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
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
                <Text style={styles.mainTitle}>Programme d'évaluation</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaChip}>{discipline}</Text>
                  <Text style={styles.metaChip}>{selectedBelt}</Text>
                </View>
                {evaluationSections.map((section, idx) => {
                  const expanded = expandedSections[section.id] ?? idx === 0;

                  return (
                    <View key={section.id} style={styles.sectionCard}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.sectionHeaderRow}
                        onPress={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !expanded }))}
                      >
                        <Text style={styles.sectionHeader}>{section.title}</Text>
                        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={18} color="#fde68a" />
                      </TouchableOpacity>

                      {expanded && section.contents.map((content, contentIdx) => {
                        if (content.kind === 'scenario') {
                          return (
                            <View key={`${section.id}-scenario-${contentIdx}`} style={styles.scenarioCard}>
                              <Text style={styles.scenarioTitle}>{content.title}</Text>
                              {content.items.map((line, lineIdx) => (
                                <View key={`${section.id}-scenario-${contentIdx}-item-${lineIdx}`} style={styles.techRow}>
                                  <Text style={styles.bulletDot}>•</Text>
                                  <Text style={styles.bulletItem}>{line}</Text>
                                </View>
                              ))}
                            </View>
                          );
                        }

                        return (
                          <View key={`${section.id}-item-${contentIdx}`} style={styles.techRow}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletItem}>{content.text}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
            {techniques.length === 0 && !loading && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aucune technique pour cette ceinture.</Text>
              </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerSpacer: {
    backgroundColor: '#fff',
    width: '100%',
    height: 16,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingTop: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  disciplineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 14,
  },
  disciplineBtn: {
    backgroundColor: '#111827',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  disciplineBtnActive: {
    backgroundColor: '#ef4444',
    borderColor: '#fecaca',
  },
  disciplineText: {
    color: '#d1d5db',
    fontWeight: '700',
    fontSize: 13,
  },
  disciplineTextActive: {
    color: '#fff',
  },
  pickerWrap: {
    width: '100%',
    marginBottom: 14,
    backgroundColor: '#18181b',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pickerBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#0b1220',
    overflow: 'hidden',
  },
  evalBlockImproved: {
    marginTop: 8,
    alignSelf: 'stretch',
    backgroundColor: '#090f1a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mainTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaChip: {
    color: '#e2e8f0',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#fde68a',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  sectionCard: {
    marginTop: 8,
    backgroundColor: '#0b1220',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioTitle: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  scenarioCard: {
    marginTop: 8,
    backgroundColor: '#0b1220',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 10,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  bulletDot: {
    color: '#60a5fa',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  bulletItem: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'left',
    flex: 1,
  },
  emptyCard: {
    marginTop: 8,
    alignSelf: 'stretch',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
