// app/tabs/index.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { API_CONFIG } from '../../constants/config';

dayjs.locale('fr');

const { height } = Dimensions.get('window');
// bande noire bas
const TILE_HEIGHT = 120;

// Calcule la hauteur optimale des tuiles selon le nombre affiché
const getTileHeight = (cardCount: number) => {
  if (cardCount <= 2) return 200; // Beaucoup plus grandes tuiles pour 1-2 cartes (mode élève)
  if (cardCount <= 3) return 150; // Tuiles moyennes pour 3 cartes
  if (cardCount <= 4) return 120; // Tuiles standards pour 4 cartes
  if (cardCount <= 6) return 90;  // Tuiles plus petites pour 5-6 cartes (mode admin)
  return 80; // Tuiles très petites pour 7+ cartes
};

/* ===== Vacances Zone C ===== */
const ZONE_C_HOLIDAYS: Array<[string, string]> = [
  ['2025-10-18', '2025-11-03'],
  ['2025-12-20', '2026-01-05'],
  ['2026-02-21', '2026-03-09'],
  ['2026-04-18', '2026-05-04'],
];

const isHoliday = (d: dayjs.Dayjs) =>
  ZONE_C_HOLIDAYS.some(([a, b]) => {
    const s = dayjs(a).startOf('day');
    const e = dayjs(b).endOf('day');
    return d.isAfter(s.subtract(1, 'ms')) && d.isBefore(e.add(1, 'ms'));
  });

const dayIndexMonday0 = (d: dayjs.Dayjs) => ((d.day() + 6) % 7);

/* ===== Admin config ===== */
const ADMIN_PIN = '3107';                         // <- PIN admin personnalisé
const KEY_ADMIN = 'cfsd91_admin_enabled';         // stockage local
const KEY_IDENTIFIE = 'cfsd91_identifie';

export default function Home() {
  const [admin, setAdmin] = useState<boolean>(false);     // état admin
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [identifie, setIdentifie] = useState<boolean>(false);
  const [eleveData, setEleveData] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [courseDetailsModalVisible, setCourseDetailsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [eventsData, setEventsData] = useState<any>({ events: [] });
  const [coursesData, setCoursesData] = useState<any>({ courses: [] });

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(KEY_ADMIN);
      setAdmin(v === '1');
      const id = await AsyncStorage.getItem(KEY_IDENTIFIE);
      setIdentifie(id === '1');
      
      // Charger le contenu de courses.json
      loadCoursesData();
      // Charger les événements
      loadEventsData();
    })();
  }, []);

  // Recharger l'état d'identification quand la page reprend le focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const id = await AsyncStorage.getItem(KEY_IDENTIFIE);
        const eleveId = await AsyncStorage.getItem('cfsd91_eleve_data');
        setIdentifie(id === '1');
        if (eleveId) {
          try {
            setEleveData(JSON.parse(eleveId));
            console.log('✅ Élève identifié:', JSON.parse(eleveId)?.prenom);
          } catch (e) {
            console.error('Erreur parsing élève:', e);
          }
        }
      })();
    }, [])
  );
  
  const loadCoursesData = async () => {
    try {
      const response = await fetch(API_CONFIG.COURSES_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': 'Mac131080',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Courses chargées:', data);
        // Handle both array and object response format
        const courses = Array.isArray(data) ? { courses: data } : data;
        setCoursesData(courses);
      } else {
        console.error('[DEBUG] Erreur courses:', response.status, response.statusText);
        setCoursesData({ courses: [] });
      }
    } catch (error) {
      console.error('[DEBUG] Erreur fetch courses:', error);
      setCoursesData({ courses: [] });
    }
  };

  const loadEventsData = async () => {
    try {
      const response = await fetch(API_CONFIG.EVENTS_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': 'Mac131080',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Events chargés:', data);
        // Handle both array and object response format
        const events = Array.isArray(data) ? { events: data } : data;
        setEventsData(events);
      } else {
        console.error('[DEBUG] Erreur events:', response.status, response.statusText);
        setEventsData({ events: [] });
      }
    } catch (error) {
      console.error('[DEBUG] Erreur fetch events:', error);
      setEventsData({ events: [] });
    }
  };

  // Rafraîchir l'état d'identification à chaque fois que la page devient active
  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Recharger l'état d'identification
        const id = await AsyncStorage.getItem(KEY_IDENTIFIE);
        setIdentifie(id === '1');
        if (id === '1') {
          const data = await AsyncStorage.getItem('cfsd91_eleve_data');
          setEleveData(data ? JSON.parse(data) : null);
        } else {
          setEleveData(null);
        }
        // Refresh auto des prochains cours et événements
        await loadCoursesData();
        await loadEventsData();
      })();
    }, [])
  );

  const allCards = useMemo(() => ([
  { key: 'adh',  title: 'ADHÉSION',   image: require('../../assets/images/adhesion-bg.png'), onPress: () => router.push('/tabs/adhesion'),       adminOnly: false },
  { key: 'eval', title: 'EVALUATIONS',  image: require('../../assets/images/evaluations-bg.png'), onPress: () => router.push('/tabs/evaluations'),   adminOnly: false, identifieOnly: true },
  { key: 'rec',  title: 'RÉCAPITULATIF',      image: require('../../assets/images/recapitulatif-bg.png'), onPress: () => router.push('/tabs/recapitulatif'), adminOnly: true  },
  { key: 'pres', title: 'PRESENCE',    image: require('../../assets/images/presence-bg.png'), onPress: () => router.push('/tabs/Presence'),       adminOnly: true },
  { key: 'cours', title: 'COURS',      image: require('../../assets/images/image_cours.png'), onPress: () => router.push('/tabs/courses'),        adminOnly: true },
  { key: 'events', title: 'ÉVÉNEMENTS',      image: require('../../assets/images/image_evts.png'), onPress: () => router.push('/tabs/events'),        adminOnly: true },
  { key: 'website', title: 'ARTICLES DU SITE',   image: require('../../assets/images/image_articles.png'), onPress: () => Linking.openURL('https://cfsd91.com/blog/'), adminOnly: false },
  ]), []);

  // Filtrer les cartes selon l'état admin et identifié
  const cards = useMemo(() => 
    allCards.filter(card => {
      // Si la carte nécessite d'être admin et qu'on n'est pas admin, cacher
      if (card.adminOnly && !admin) return false;
      // Si la carte nécessite d'être identifié et qu'on n'est ni identifié ni admin, cacher
      if (card.identifieOnly && !(identifie || admin)) return false;
      // Sinon, afficher la carte
      return true;
    })
  , [allCards, admin, identifie]);

  // Calculer la hauteur des tuiles selon le nombre de cartes
  const tileHeight = useMemo(() => getTileHeight(cards.length), [cards.length]);
  
  // Ajuster la taille du texte selon le nombre de cartes
  const titleFontSize = useMemo(() => {
    if (cards.length <= 2) return 26; // Texte beaucoup plus grand pour 1-2 cartes (mode élève)
    if (cards.length <= 3) return 20; // Texte moyen pour 3 cartes
    return 18; // Texte plus petit pour 4+ cartes
  }, [cards.length]);

  // Ajuster les marges selon le nombre de cartes
  const tileMargin = useMemo(() => {
    if (cards.length <= 2) return 20; // Beaucoup plus d'espacement pour 1-2 cartes (mode élève)
    if (cards.length <= 3) return 14; // Espacement moyen pour 3 cartes
    return 12; // Espacement standard pour 4+ cartes
  }, [cards.length]);

  // Déterminer le mode actuel pour l'affichage
  const currentMode = useMemo(() => {
    if (admin) return { text: 'Mode Administrateur', color: '#ef4444', icon: 'shield-checkmark' };
    if (identifie && eleveData) {
      return { 
        text: `Mode Élève - ${eleveData.prenom} ${eleveData.nom}`, 
        color: '#22c55e', 
        icon: 'person-circle' 
      };
    }
    if (identifie) return { text: 'Mode Élève', color: '#22c55e', icon: 'person-circle' };
    return { text: 'Mode Visiteur', color: '#64748b', icon: 'eye-outline' };
  }, [admin, identifie, eleveData]);

  const handleTilePress = (c: typeof cards[number]) => {
    // Les cartes sont maintenant filtrées, donc toutes les cartes visibles sont accessibles
    c.onPress();
  };

  const openCourseDetails = (course: any) => {
    setSelectedCourse(course);
    setCourseDetailsModalVisible(true);
  };

  const openEventDetails = (event: any) => {
    setSelectedEvent(event);
    setDetailsModalVisible(true);
  };

  // Calculer les 3 prochains cours
  const getNext3Courses = () => {
    if (!coursesData || !coursesData.courses) return [];
    
    const DAY_NAMES: { [key: number]: string } = {
      0: 'Dimanche',
      3: 'Mercredi',
      5: 'Vendredi',
    };
    
    const today = new Date();
    const upcomingCourses: any[] = [];
    
    // Chercher les prochaines occurrences pour chaque cours actif
    coursesData.courses.forEach((course: any) => {
      if (!course.active) return;
      
      let checkDate = new Date(today);
      let foundCount = 0;
      
      // Chercher jusqu'à 90 jours dans le futur
      for (let i = 0; i < 90 && foundCount < 3; i++) {
        if (checkDate.getDay() === course.day) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const isCanceled = course.canceledDates && course.canceledDates.includes(dateStr);
          
          upcomingCourses.push({
            ...course,
            nextDate: dateStr,
            nextDateTime: new Date(dateStr + 'T' + course.startTime),
            dateFormatted: new Date(dateStr).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            }),
            dayName: DAY_NAMES[course.day],
            isCanceled,
          });
          foundCount++;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    });
    
    // Trier par date et heure et prendre les 3 premiers
    return upcomingCourses
      .sort((a, b) => a.nextDateTime.getTime() - b.nextDateTime.getTime())
      .slice(0, 3);
  };

  // Calculer les 3 prochains événements
  const getNext3Events = () => {
    if (!eventsData || !eventsData.events) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventsData.events
      .filter((event: any) => event.visible && new Date(event.date) >= today)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
      .map((event: any) => ({
        ...event,
        dateFormatted: new Date(event.date).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        }),
        dayName: new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      }));
  };

  // Calculer les 3 prochaines compétitions uniquement
  const getNext3Competitions = () => {
    if (!eventsData || !eventsData.events) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventsData.events
      .filter((event: any) => event.visible && event.type === 'competition' && new Date(event.date) >= today)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
      .map((event: any) => ({
        ...event,
        dateFormatted: new Date(event.date).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        }),
        dayName: new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      }));
  };

  const submitPin = async () => {
    if (pin.trim() === ADMIN_PIN) {
      setAdmin(true);
      await AsyncStorage.setItem(KEY_ADMIN, '1');
      setPin('');
      setPinOpen(false);
    } else {
      setPin('');
      // petit feedback visuel
    }
  };

  const toggleAdmin = async () => {
    if (admin) {
      setAdmin(false);
      await AsyncStorage.setItem(KEY_ADMIN, '0');
    } else {
      setPinOpen(true);
    }
  };

  const logoutAll = async () => {
    // Déconnexion admin
    setAdmin(false);
    await AsyncStorage.setItem(KEY_ADMIN, '0');
    
    // Déconnexion élève
    setIdentifie(false);
    await AsyncStorage.setItem(KEY_IDENTIFIE, '0');
    
    // Feedback visuel optionnel
    // Alert.alert('Déconnexion', 'Vous êtes maintenant déconnecté(e)');
  };

  const { width, height } = Dimensions.get('window');
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        paddingBottom: Math.max(20, height * 0.03),
        paddingHorizontal: Math.max(12, width * 0.03),
        minHeight: height,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.screen, { minHeight: height }]}>  
        {/* --- Top bar --- */}
        <View style={s.topbar}>
          <View>
            <Text style={s.headerTitle}>Accueil</Text>
            <Text style={{color:'#999',fontSize:10,marginTop:2}}>Version V2.0 webapp</Text>
          </View>
          <View style={s.topRight}>
            <Pressable style={s.iconBtn} onPress={toggleAdmin}>
              <Ionicons name={admin ? 'shield-checkmark' : 'lock-closed-outline'} size={28} color={admin ? '#22c55e' : '#000'} />
            </Pressable>
            <Pressable style={[s.iconBtn, { marginLeft: 6 }]} onPress={() => router.push('/tabs/identification')}>
              <Ionicons 
                name={identifie ? 'person-circle' : 'person-circle-outline'} 
                size={28} 
                color={identifie ? '#22c55e' : '#000'} 
              />
              {identifie && <View style={s.identifiedBadge} />}
            </Pressable>
            {/* Info icon removed as requested */}
            {(admin || identifie) && (
              <Pressable style={[s.iconBtn, { marginLeft: 6 }]} onPress={logoutAll}>
                <Ionicons name="log-out-outline" size={28} color="#ff6b6b" />
              </Pressable>
            )}
          </View>
        </View>

        {/* --- Indicateur de mode avec profil --- */}
        <View style={s.modeIndicator}>
          <Ionicons name={currentMode.icon as any} size={16} color={currentMode.color} />
          <Text style={[s.modeText, { color: currentMode.color }]}>{currentMode.text}</Text>
          
          {identifie && eleveData && (
            <Pressable 
              style={s.profilePhotoInMode}
              onPress={() => {
                if (eleveData.id) {
                  router.push(`/tabs/fiche/${eleveData.id}`);
                }
              }}
            >
              {eleveData.photo && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${eleveData.photo}` }}
                  style={s.profilePhotoSmall}
                />
              )}
              {!eleveData.photo && (
                <View style={[s.profilePhotoSmall, { backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={20} color="#9ca3af" />
                </View>
              )}
            </Pressable>
          )}
        </View>

        {/* --- Prochains cours et événements (visible pour tous) --- */}
        <View style={s.nextCoursesContainer}>
          <View style={s.nextCoursesHeader}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={s.nextCoursesTitle}>Prochains cours et événements</Text>
            <Pressable onPress={() => { loadCoursesData(); loadEventsData(); }} style={{ padding: 2 }}>
              <Ionicons name="refresh" size={12} color="#64748b" />
            </Pressable>
          </View>
          <View style={s.coursesGrid}>
            <React.Fragment>
              {coursesData && coursesData.courses && getNext3Courses().map((course, index) => (
                <Pressable key={`course-${index}`} style={s.courseItemCompact} onPress={() => openCourseDetails(course)}>
                  <View style={s.courseCompactHeader}>
                    <Text style={s.courseDateCompact}>{course.dateFormatted}</Text>
                    <Text style={s.courseDayCompact}>{course.dayName}</Text>
                  </View>
                  <Text style={s.courseTitleCompact}>{course.title}</Text>
                  <View style={s.courseTimeRowCompact}>
                    <Ionicons name="time-outline" size={9} color="#64748b" />
                    <Text style={s.courseTimeCompact}>{course.startTime}</Text>
                  </View>
                  {course.isCanceled && (
                    <View style={s.canceledBadgeCompact}>
                      <Text style={s.canceledTextCompact}>Annulé</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              {eventsData && eventsData.events && getNext3Events().map((event: any, index: number) => {
              const EVENT_COLORS = {
                competition: '#ef4444',
                stage: '#f59e0b',
                autre: '#3b82f6',
              };
              const eventColor = EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || '#3b82f6';
              return (
                <Pressable 
                  key={`event-${index}`} 
                  style={[s.courseItemCompact, { borderLeftColor: eventColor, borderLeftWidth: 3 }]}
                  onPress={() => openEventDetails(event)}
                >
                  <View style={s.courseCompactHeader}>
                    <Text style={s.courseDateCompact}>{event.dateFormatted}</Text>
                    <Text style={[s.courseDayCompact, { textTransform: 'capitalize' }]}>{event.dayName}</Text>
                  </View>
                  <Text style={[s.courseTitleCompact, { color: eventColor, fontWeight: '700' }]}>
                    {event.title}
                  </Text>
                  {event.startTime && (
                    <View style={s.courseTimeRowCompact}>
                      <Ionicons name="time-outline" size={9} color="#64748b" />
                      <Text style={s.courseTimeCompact}>
                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                      </Text>
                    </View>
                  )}
                  {event.location && (
                    <View style={[s.courseTimeRowCompact, { marginTop: 2 }]}>
                      <Ionicons name="location-outline" size={9} color="#64748b" />
                      <Text style={[s.courseTimeCompact, { fontSize: 8 }]}>{event.location}</Text>
                    </View>
                  )}
                  <View style={[s.eventTypeBadge, { backgroundColor: eventColor + '20' }]}>
                    <Text style={[s.eventTypeText, { color: eventColor }]}>
                      {event.type === 'competition' ? 'Compétition' : event.type === 'stage' ? 'Stage' : 'Autre'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            </React.Fragment>
          </View>
        </View>

        {/* --- Tuiles --- */}
        <View style={s.cardsWrap}>
          {cards.map(c => {
            // Grouper COURS et ÉVÉNEMENTS sur la même ligne
            if (c.key === 'cours') {
              const eventsCard = cards.find(card => card.key === 'events');
              return (
                <View key="courses-events-row" style={s.tileRow}>
                  {/* Tuile COURS */}
                  <Pressable
                    onPress={() => handleTilePress(c)}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                    style={({ pressed }) => [
                      s.tileHalf,
                      { height: tileHeight }, 
                      pressed && s.tilePressed
                    ]}
                  >
                    <ImageBackground 
                      source={c.image} 
                      style={[s.tileImg, { minHeight: tileHeight }]} 
                      resizeMode="cover"
                      imageStyle={{ borderRadius: 14 }}
                    >
                      <View style={s.overlay} />
                      <View style={s.tileCenter}>
                        <Text style={[s.tileTitle, { fontSize: titleFontSize }]}>{c.title}</Text>
                      </View>
                    </ImageBackground>
                  </Pressable>

                  {/* Tuile ÉVÉNEMENTS (si elle existe) */}
                  {eventsCard && (
                    <Pressable
                      onPress={() => handleTilePress(eventsCard)}
                      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                      style={({ pressed }) => [
                        s.tileHalf,
                        { height: tileHeight }, 
                        pressed && s.tilePressed
                      ]}
                    >
                      <ImageBackground 
                        source={eventsCard.image} 
                        style={[s.tileImg, { minHeight: tileHeight }]} 
                        resizeMode="cover"
                        imageStyle={{ borderRadius: 14 }}
                      >
                        <View style={s.overlay} />
                        <View style={s.tileCenter}>
                          <Text style={[s.tileTitle, { fontSize: titleFontSize }]}>{eventsCard.title}</Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  )}
                </View>
              );
            }
            
            // Sauter la tuile ÉVÉNEMENTS car elle est déjà affichée avec COURS
            if (c.key === 'events') {
              return null;
            }
            
            // Affichage normal pour les autres tuiles
            return (
            <Pressable
              key={c.key}
              onPress={() => handleTilePress(c)}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={({ pressed }) => [
                s.tileWrap, 
                { height: tileHeight, marginHorizontal: tileMargin }, 
                pressed && s.tilePressed
              ]}
            >
              <ImageBackground 
                source={c.image} 
                style={[s.tileImg, { minHeight: tileHeight }]} 
                resizeMode="cover"
                imageStyle={{ borderRadius: 14 }}
              >
                <View style={s.overlay} />
                {/* Bandeau identifié pour les cartes identifieOnly (si visible, alors utilisateur identifié) */}
                {c.identifieOnly && identifie && (
                  <View style={s.eleveRibbonIdentifie}>
                    <Ionicons name="person" size={12} color="#fff" />
                    <Text style={s.eleveRibbonTxIdentifie}>Identifié</Text>
                  </View>
                )}
                <View style={s.tileCenter}>
                  <Text style={[s.tileTitle, { fontSize: titleFontSize }]}>{c.title}</Text>
                </View>
              </ImageBackground>
            </Pressable>
          );
          })}
        </View>
        {/* Modal PIN Admin */}
        <Modal visible={pinOpen} transparent animationType="fade" onRequestClose={() => setPinOpen(false)}>
          <View style={s.modalBackdrop}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Mode administrateur</Text>
              <Text style={s.modalHint}>Entre le code PIN</Text>
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="••••"
                placeholderTextColor="#6b7280"
                style={s.pinInput}
                keyboardType="number-pad"
                secureTextEntry
                autoFocus
                maxLength={8}
              />
              <View style={s.modalRow}>
                <Pressable style={[s.modalBtn, s.btnGhost]} onPress={() => { setPin(''); setPinOpen(false); }}>
                  <Text style={s.modalBtnTx}>Annuler</Text>
                </Pressable>
                <Pressable style={[s.modalBtn, s.btnPrimary]} onPress={submitPin}>
                  <Text style={[s.modalBtnTx, { color:'#fff' }]}>Valider</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Détails du Cours */}
        <Modal 
          visible={courseDetailsModalVisible} 
          transparent 
          animationType="slide" 
          onRequestClose={() => setCourseDetailsModalVisible(false)}
        >
          <View style={s.modalBackdrop}>
            <View style={s.courseDetailsCard}>
              <View style={s.courseDetailsHeader}>
                <Text style={s.courseDetailsTitle}>Détails du cours</Text>
                <Pressable onPress={() => setCourseDetailsModalVisible(false)} style={s.closeBtn}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </Pressable>
              </View>
              {selectedCourse && (
                <View style={s.courseDetailsContent}>
                  <View style={s.courseDetailsMainInfo}>
                    <Text style={s.courseDetailsTitleText}>{selectedCourse.title}</Text>
                    {selectedCourse.isCanceled && (
                      <View style={s.canceledBadgeLarge}>
                        <Text style={s.canceledTextLarge}>⚠️ Cours annulé</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={s.courseDetailsRow}>
                    <Ionicons name="calendar" size={20} color="#22c55e" />
                    <View style={s.courseDetailsRowText}>
                      <Text style={s.courseDetailsLabel}>Date</Text>
                      <Text style={s.courseDetailsValue}>
                        {selectedCourse.dayName} {selectedCourse.dateFormatted}
                      </Text>
                      <Text style={s.courseDetailsValueSmall}>{selectedCourse.nextDate}</Text>
                    </View>
                  </View>

                  <View style={s.courseDetailsRow}>
                    <Ionicons name="time" size={20} color="#3b82f6" />
                    <View style={s.courseDetailsRowText}>
                      <Text style={s.courseDetailsLabel}>Horaires</Text>
                      <Text style={s.courseDetailsValue}>
                        {selectedCourse.startTime} - {selectedCourse.endTime}
                      </Text>
                    </View>
                  </View>

                  {selectedCourse.details && (
                    <View style={s.courseDetailsRow}>
                      <Ionicons name="information-circle" size={20} color="#f59e0b" />
                      <View style={s.courseDetailsRowText}>
                        <Text style={s.courseDetailsLabel}>Informations</Text>
                        <Text style={s.courseDetailsValue}>{selectedCourse.details}</Text>
                      </View>
                    </View>
                  )}

                  <View style={s.courseDetailsDivider} />

                  <View style={s.courseDetailsRecurring}>
                    <Ionicons name="repeat" size={16} color="#64748b" />
                    <Text style={s.courseDetailsRecurringText}>
                      Cours récurrent tous les {selectedCourse.dayName.toLowerCase()}s
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal détails événement */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={s.modalBackdrop}>
            <View style={s.courseDetailsCard}>
              <View style={s.courseDetailsHeader}>
                <Text style={s.courseDetailsTitle}>Détails de l'événement</Text>
                <Pressable onPress={() => setDetailsModalVisible(false)} style={s.closeBtn}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </Pressable>
              </View>
              
              {selectedEvent && (
                <View style={s.courseDetailsContent}>
                  <View style={s.courseDetailsMainInfo}>
                    <Text style={s.courseDetailsTitleText}>{selectedEvent.title}</Text>
                    {selectedEvent.type && (
                      <View style={[s.eventTypeBadge, { 
                        backgroundColor: selectedEvent.type === 'competition' ? '#ef444420' : 
                                       selectedEvent.type === 'stage' ? '#f59e0b20' : '#3b82f620',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }]}>
                        <Text style={[s.eventTypeText, { 
                          fontSize: 12,
                          color: selectedEvent.type === 'competition' ? '#ef4444' : 
                                 selectedEvent.type === 'stage' ? '#f59e0b' : '#3b82f6'
                        }]}>
                          {selectedEvent.type === 'competition' ? 'Compétition' : 
                           selectedEvent.type === 'stage' ? 'Stage' : 'Autre'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={s.courseDetailsRow}>
                    <Ionicons name="calendar" size={20} color="#22c55e" />
                    <View style={s.courseDetailsRowText}>
                      <Text style={s.courseDetailsLabel}>Date</Text>
                      <Text style={s.courseDetailsValue}>
                        {selectedEvent.dayName} {selectedEvent.dateFormatted}
                      </Text>
                      <Text style={s.courseDetailsValueSmall}>{selectedEvent.date}</Text>
                    </View>
                  </View>

                  {(selectedEvent.startTime || selectedEvent.endTime) && (
                    <View style={s.courseDetailsRow}>
                      <Ionicons name="time" size={20} color="#3b82f6" />
                      <View style={s.courseDetailsRowText}>
                        <Text style={s.courseDetailsLabel}>Horaires</Text>
                        <Text style={s.courseDetailsValue}>
                          {selectedEvent.startTime && selectedEvent.endTime 
                            ? `${selectedEvent.startTime} - ${selectedEvent.endTime}`
                            : selectedEvent.startTime || selectedEvent.endTime}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedEvent.location && (
                    <View style={s.courseDetailsRow}>
                      <Ionicons name="location" size={20} color="#f59e0b" />
                      <View style={s.courseDetailsRowText}>
                        <Text style={s.courseDetailsLabel}>Lieu</Text>
                        <Text style={s.courseDetailsValue}>{selectedEvent.location}</Text>
                      </View>
                    </View>
                  )}

                  {selectedEvent.description && (
                    <View style={s.courseDetailsRow}>
                      <Ionicons name="information-circle" size={20} color="#8b5cf6" />
                      <View style={s.courseDetailsRowText}>
                        <Text style={s.courseDetailsLabel}>Description</Text>
                        <Text style={s.courseDetailsValue}>{selectedEvent.description}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

/* ===== Styles ===== */
const s = StyleSheet.create({
  screen: { backgroundColor: '#000', flex: 1, minWidth: 0 },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.select({ ios: 6, android: 6 }), paddingBottom: 6,
    paddingHorizontal: '3%', borderBottomColor: '#e5e7eb', borderBottomWidth: 1,
    backgroundColor: '#fff',
    minWidth: 0,
  },
  
  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  profilePhotoInMode: {
    marginLeft: 'auto',
  },
  profilePhotoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logo: { width: 120, height: 40 },
  logoPlaceholder: { width: 0, height: 40 },
  headerTitle: { color: '#000', fontSize: 20, fontWeight: '700', marginTop: 28 },
   topbarIconBg: { backgroundColor: '#fff', borderRadius: 8, padding: 4 },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, position: 'relative', marginTop: 46 },
  badge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#b40a0a' },
  identifiedBadge: { position: 'absolute', top: 3, right: 3, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1, borderColor: '#fff' },

  upcomingWrap: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 },
  upcomingTitle: { color: '#cbd5e1', fontWeight: '700', marginBottom: 6 },
  competitionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  scrollHint: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },
  chip: { width: 110, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#101418', borderWidth: 1, borderColor: '#1f2937', position: 'relative' },
  competitionChip: { borderColor: '#ff6b35', backgroundColor: '#1a0f0c', width: 140 },
  chipDate: { color: '#a7f3d0', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  chipTitle:{ color: '#e5e7eb', fontWeight: '700', marginTop: 2, fontSize: 12 },
  chipTime: { color: '#93c5fd', fontSize: 11, marginTop: 2 },
  chipEmpty:{ color: '#9ca3af' },
  chipClickable: {
    borderColor: '#22c55e',
    backgroundColor: '#0a1f13',
  },
  detailsIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  cardsWrap: { 
    marginBottom: 20,
    gap: 8,
  },
  tileRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginHorizontal: 12,
    gap: 8,
  },
  tileWrap: { height: TILE_HEIGHT, marginHorizontal: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' },
  tileHalf: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  tilePressed: { opacity: 0.9 },
  tileImg: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: '#111',
    width: '100%',
    height: '100%',
    minHeight: TILE_HEIGHT
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  tileCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  tileTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  // Optionnel : réduire la taille du texte si besoin
  // tileTitle: { ...tileTitle, fontSize: 16 },
  tileSub: { marginTop: 5, color: '#e5e7eb', fontSize: 12, fontWeight: '600' },

  lockRibbon: { position: 'absolute', top: 10, right: 10, paddingVertical: 4, paddingHorizontal: 6, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 5 },
  lockRibbonTx: { color: '#fff', fontSize: 10, fontWeight: '700' },
  eleveRibbon: { position: 'absolute', top: 10, right: 10, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 5 },
  eleveRibbonIdentifie: { position: 'absolute', top: 10, right: 10, paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#22c55e', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 5 },
  eleveRibbonNonIdentifie: { position: 'absolute', top: 10, right: 10, paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#ef4444', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 5 },
  eleveRibbonTxIdentifie: { color: '#fff', fontSize: 10, fontWeight: '700' },
  eleveRibbonTxNonIdentifie: { color: '#fff', fontSize: 10, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', maxWidth: 420, backgroundColor: '#0d1116', borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', padding: 14 },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalHint: { color: '#9ca3af', marginTop: 4, marginBottom: 10 },
  pinInput: { backgroundColor: '#0b0b0b', borderColor: '#333', borderWidth: 1, borderRadius: 10, color: '#fff', paddingHorizontal: 12, paddingVertical: 10, letterSpacing: 4, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnGhost: { borderWidth: 1, borderColor: '#334155' },
  btnPrimary: { backgroundColor: '#b40a0a' },
  modalBtnTx: { textAlign: 'center', fontWeight: '600' },

  // Styles pour le modal de détails
  detailsModal: {
    backgroundColor: '#0d1116',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 0,
    width: '90%',
    maxWidth: 400,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  detailsContent: {
    padding: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailsDate: {
    color: '#a7f3d0',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsTime: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsDescriptionContainer: {
    marginTop: 8,
  },
  detailsDescriptionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsDescription: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
  },
  chipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailsIndicatorSmall: {
    marginLeft: 4,
  },
  nextCoursesContainer: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 0,
  },
  nextCoursesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  nextCoursesTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  coursesScroll: {
    flexDirection: 'row',
    minHeight: 90,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  courseItemCompact: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    width: '32%',
    minWidth: '32%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  courseCompactHeader: {
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  courseDateCompact: {
    color: '#9ca3af',
    fontSize: Platform.OS === 'web' ? 15 : 13,
    fontWeight: 'bold',
  },
  courseDayCompact: {
    color: '#64748b',
    fontSize: Platform.OS === 'web' ? 9 : 7,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  courseTitleCompact: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 14,
  },
  courseTimeRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  courseTimeCompact: {
    color: '#9ca3af',
    fontSize: Platform.OS === 'web' ? 10 : 9,
  },
  canceledBadgeCompact: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  canceledTextCompact: {
    color: '#fca5a5',
    fontSize: Platform.OS === 'web' ? 8 : 7,
    fontWeight: '600',
  },
  coursesDebugContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  coursesDebugTitle: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  coursesDebugScroll: {
    maxHeight: 80,
  },
  coursesDebugText: {
    color: '#9ca3af',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  courseDetailsCard: {
    backgroundColor: '#1a1f2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
  },
  courseDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  courseDetailsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  courseDetailsContent: {
    padding: 20,
  },
  courseDetailsMainInfo: {
    marginBottom: 20,
  },
  courseDetailsTitleText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  canceledBadgeLarge: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  canceledTextLarge: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  courseDetailsRowText: {
    flex: 1,
  },
  courseDetailsLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  courseDetailsValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  courseDetailsValueSmall: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  courseDetailsDivider: {
    height: 1,
    backgroundColor: '#2d3748',
    marginVertical: 16,
  },
  courseDetailsRecurring: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0d1116',
    padding: 12,
    borderRadius: 8,
  },
  courseDetailsRecurringText: {
    color: '#9ca3af',
    fontSize: 13,
    fontStyle: 'italic',
  },
  eventTypeBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  eventTypeText: {
    fontSize: 7,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
