// app/tabs/courses.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { API_CONFIG } from '../../constants/config';
import { Course } from '../../constants/types';
import { fetchCourses, createCourse, updateCourse, deleteCourse, manageCourseDate } from '../../lib/api';
import { generateUUID } from '../../lib/utils';

const DAY_NAMES: { [key: number]: string } = {
  0: 'Dimanche',
  3: 'Mercredi',
  5: 'Vendredi',
};

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Formulaire
  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(3);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [details, setDetails] = useState('');
  
  // Modal d'annulation de date
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedCourseForCancel, setSelectedCourseForCancel] = useState<Course | null>(null);
  const [cancelDate, setCancelDate] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(data || []);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setTitle('');
    setSelectedDay(3);
    setStartTime('');
    setEndTime('');
    setDetails('');
    setModalVisible(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setSelectedDay(course.day);
    setStartTime(course.startTime);
    setEndTime(course.endTime);
    setDetails(course.details);
    setModalVisible(true);
  };

  const saveCourse = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre du cours est requis');
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert('Erreur', 'Les horaires sont requis');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Erreur', 'Format horaire invalide. Utilisez HH:MM');
      return;
    }

    try {
      const courseData = {
        title: title.trim(),
        day: selectedDay,
        startTime,
        endTime,
        details,
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        Alert.alert('Succès', 'Cours modifié');
      } else {
        await createCourse({ ...courseData, active: true, canceledDates: [] });
        Alert.alert('Succès', 'Cours ajouté');
      }
      
      setModalVisible(false);
      await loadCourses();
    } catch (error) {
      console.error('Erreur sauvegarde cours:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
    }
  };

  const toggleCourseActive = async (course: Course) => {
    try {
      await updateCourse(course.id, { active: !course.active });
      await loadCourses();
    } catch (error) {
      console.error('Erreur toggle cours:', error);
      Alert.alert('Erreur', 'Impossible de modifier le cours');
    }
  };

  // Calculer les prochaines occurrences d'un cours
  const getNextOccurrences = (course: Course, count: number = 4): string[] => {
    const today = new Date();
    const occurrences: string[] = [];
    let checkDate = new Date(today);
    
    // Chercher jusqu'à 90 jours dans le futur
    for (let i = 0; i < 90 && occurrences.length < count; i++) {
      if (checkDate.getDay() === course.day) {
        const dateStr = checkDate.toISOString().split('T')[0];
        occurrences.push(dateStr);
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return occurrences;
  };

  const openCancelModal = (course: Course) => {
    setSelectedCourseForCancel(course);
    const nextDate = getNextOccurrences(course, 1)[0];
    setCancelDate(nextDate || '');
    setCancelModalVisible(true);
  };

  const cancelCourseDate = async () => {
    if (!selectedCourseForCancel || !cancelDate) return;
    
    try {
      await manageCourseDate(selectedCourseForCancel.id, cancelDate, 'cancel');
      Alert.alert('Succès', 'Date annulée avec succès');
      setCancelModalVisible(false);
      await loadCourses();
    } catch (error) {
      console.error('Erreur annulation:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
    }
  };

  const uncancelCourseDate = async (course: Course, date: string) => {
    try {
      await manageCourseDate(course.id, date, 'uncancel');
      Alert.alert('Succès', 'Date réactivée avec succès');
      await loadCourses();
    } catch (error) {
      console.error('Erreur réactivation:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer le cours du ${DAY_NAMES[course.day]} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(course.id);
              await loadCourses();
              Alert.alert('Succès', 'Cours supprimé');
            } catch (error) {
              console.error('Erreur suppression cours:', error);
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
            }
          },
        },
      ]
    );
  };

  // Formater une date pour l'affichage
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <HeaderBar
        title="Gestion des Cours"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="#fff"
        left={(
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </Pressable>
        )}
        right={(
          <Pressable onPress={openAddModal}>
            <Ionicons name="add" size={20} color="#000" />
          </Pressable>
        )}
      />
      <View style={{ paddingTop: HEADER_HEIGHT }} />

      <ScrollView style={s.content}>
        {loading ? (
          <Text style={s.loadingText}>Chargement...</Text>
        ) : courses.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#64748b" />
            <Text style={s.emptyText}>Aucun cours configuré</Text>
            <Text style={s.emptyHint}>Appuyez sur + pour ajouter un cours</Text>
          </View>
        ) : (
          [0, 3, 5].map((day) => {
            const dayCourses = courses.filter((c) => c.day === day);
            if (dayCourses.length === 0) return null;

            return (
              <View key={day} style={s.daySection}>
                <Text style={s.dayTitle}>{DAY_NAMES[day]}</Text>
                {dayCourses
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((course) => (
                    <View
                      key={course.id}
                      style={[
                        s.courseCard,
                        !course.active && s.courseCardInactive,
                      ]}
                    >
                      <View style={s.courseHeader}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.courseTitle,
                              !course.active && s.inactiveText,
                            ]}
                          >
                            {course.title}
                          </Text>
                          <View style={s.courseTime}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={course.active ? '#22c55e' : '#64748b'}
                            />
                            <Text
                              style={[
                                s.courseTimeText,
                                !course.active && s.inactiveText,
                              ]}
                            >
                              {course.startTime} → {course.endTime}
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={course.active}
                          onValueChange={() => toggleCourseActive(course)}
                          trackColor={{ false: '#64748b', true: '#22c55e' }}
                        />
                      </View>

                      {course.details && (
                        <Text
                          style={[
                            s.courseDetails,
                            !course.active && s.inactiveText,
                          ]}
                        >
                          {course.details}
                        </Text>
                      )}

                      {/* Affichage des dates annulées */}
                      {course.canceledDates && course.canceledDates.length > 0 && (
                        <View style={s.canceledDatesSection}>
                          <Text style={s.canceledDatesLabel}>Dates annulées :</Text>
                          <View style={s.canceledDatesList}>
                            {course.canceledDates.slice(0, 3).map((date) => (
                              <Pressable
                                key={date}
                                style={s.canceledDateChip}
                                onPress={() => uncancelCourseDate(course, date)}
                              >
                                <Text style={s.canceledDateText}>{formatDate(date)}</Text>
                                <Ionicons name="close-circle" size={16} color="#ef4444" />
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}

                      <View style={s.courseActions}>
                        <Pressable
                          onPress={() => openCancelModal(course)}
                          style={s.actionBtn}
                        >
                          <Ionicons name="close-circle-outline" size={20} color="#f59e0b" />
                          <Text style={[s.actionBtnText, { color: '#f59e0b' }]}>
                            Annuler une date
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => openEditModal(course)}
                          style={s.actionBtn}
                        >
                          <Ionicons name="create-outline" size={20} color="#3b82f6" />
                          <Text style={s.actionBtnText}>Modifier</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteCourse(course)}
                          style={s.actionBtn}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                          <Text style={[s.actionBtnText, { color: '#ef4444' }]}>
                            Supprimer
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal d'ajout/édition */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingCourse ? 'Modifier le cours' : 'Nouveau cours'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView style={s.modalContent}>
              {/* Intitulé du cours */}
              <Text style={s.label}>Intitulé du cours</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Cours technique, Compétition..."
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
              />

              {/* Sélection du jour */}
              <Text style={s.label}>Jour</Text>
              <View style={s.daySelector}>
                <Pressable
                  style={[
                    s.dayOption,
                    selectedDay === 0 && s.dayOptionSelected,
                  ]}
                  onPress={() => setSelectedDay(0)}
                >
                  <Text
                    style={[
                      s.dayOptionText,
                      selectedDay === 0 && s.dayOptionTextSelected,
                    ]}
                  >
                    Dimanche
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    s.dayOption,
                    selectedDay === 3 && s.dayOptionSelected,
                  ]}
                  onPress={() => setSelectedDay(3)}
                >
                  <Text
                    style={[
                      s.dayOptionText,
                      selectedDay === 3 && s.dayOptionTextSelected,
                    ]}
                  >
                    Mercredi
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    s.dayOption,
                    selectedDay === 5 && s.dayOptionSelected,
                  ]}
                  onPress={() => setSelectedDay(5)}
                >
                  <Text
                    style={[
                      s.dayOptionText,
                      selectedDay === 5 && s.dayOptionTextSelected,
                    ]}
                  >
                    Vendredi
                  </Text>
                </Pressable>
              </View>

              {/* Horaires */}
              <Text style={s.label}>Heure de début (HH:MM)</Text>
              <TextInput
                style={s.input}
                placeholder="09:00"
                placeholderTextColor="#6b7280"
                value={startTime}
                onChangeText={setStartTime}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={s.label}>Heure de fin (HH:MM)</Text>
              <TextInput
                style={s.input}
                placeholder="10:30"
                placeholderTextColor="#6b7280"
                value={endTime}
                onChangeText={setEndTime}
                keyboardType="numbers-and-punctuation"
              />

              {/* Détails */}
              <Text style={s.label}>Détails (optionnel)</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Notes, instructions particulières..."
                placeholderTextColor="#6b7280"
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
              />

              <View style={s.modalActions}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={[s.modalBtn, s.modalBtnCancel]}
                >
                  <Text style={s.modalBtnTextCancel}>Annuler</Text>
                </Pressable>
                <Pressable onPress={saveCourse} style={[s.modalBtn, s.modalBtnSave]}>
                  <Text style={s.modalBtnTextSave}>
                    {editingCourse ? 'Modifier' : 'Ajouter'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal d'annulation de date */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Annuler une date</Text>
              <Pressable onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <View style={s.modalContent}>
              {selectedCourseForCancel && (
                <>
                  <Text style={s.cancelModalCourseTitle}>
                    {selectedCourseForCancel.title}
                  </Text>
                  <Text style={s.cancelModalCourseInfo}>
                    {DAY_NAMES[selectedCourseForCancel.day]} • {selectedCourseForCancel.startTime} - {selectedCourseForCancel.endTime}
                  </Text>

                  <Text style={s.label}>Prochaines dates</Text>
                  <View style={s.nextDatesList}>
                    {getNextOccurrences(selectedCourseForCancel, 4).map((date) => {
                      const isAlreadyCanceled = selectedCourseForCancel.canceledDates?.includes(date);
                      return (
                        <Pressable
                          key={date}
                          style={[
                            s.nextDateOption,
                            cancelDate === date && s.nextDateOptionSelected,
                            isAlreadyCanceled && s.nextDateOptionDisabled,
                          ]}
                          onPress={() => !isAlreadyCanceled && setCancelDate(date)}
                          disabled={isAlreadyCanceled}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.nextDateText,
                                cancelDate === date && s.nextDateTextSelected,
                                isAlreadyCanceled && s.nextDateTextDisabled,
                              ]}
                            >
                              {formatDate(date)}
                            </Text>
                            <Text style={s.nextDateFullText}>{date}</Text>
                          </View>
                          {isAlreadyCanceled && (
                            <Text style={s.canceledBadge}>Déjà annulée</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={s.modalActions}>
                    <Pressable
                      onPress={() => setCancelModalVisible(false)}
                      style={[s.modalBtn, s.modalBtnCancel]}
                    >
                      <Text style={s.modalBtnTextCancel}>Fermer</Text>
                    </Pressable>
                    <Pressable
                      onPress={cancelCourseDate}
                      style={[s.modalBtn, s.modalBtnDelete]}
                      disabled={!cancelDate}
                    >
                      <Text style={s.modalBtnTextDelete}>Annuler cette date</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1f2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  addBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, padding: 16 },
  loadingText: { color: '#9ca3af', textAlign: 'center', marginTop: 32, fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#9ca3af', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyHint: { color: '#64748b', fontSize: 14, marginTop: 8 },
  daySection: { marginBottom: 24 },
  dayTitle: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  courseCard: {
    backgroundColor: '#0d1116',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginBottom: 12,
  },
  courseCardInactive: { opacity: 0.5, borderColor: '#374151' },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  courseTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  courseTime: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseTimeText: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  inactiveText: { textDecorationLine: 'line-through', color: '#9ca3af' },
  courseDetails: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
  canceledDatesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1f2937' },
  canceledDatesLabel: { color: '#f59e0b', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  canceledDatesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  canceledDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  canceledDateText: { color: '#fca5a5', fontSize: 12 },
  courseActions: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1a1f2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  label: { color: '#e5e7eb', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#0d1116',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  daySelector: { flexDirection: 'row', gap: 8 },
  dayOption: {
    flex: 1,
    backgroundColor: '#0d1116',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dayOptionSelected: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dayOptionText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  dayOptionTextSelected: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#374151' },
  modalBtnSave: { backgroundColor: '#22c55e' },
  modalBtnDelete: { backgroundColor: '#ef4444' },
  modalBtnTextCancel: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  modalBtnTextSave: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalBtnTextDelete: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelModalCourseTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cancelModalCourseInfo: { color: '#9ca3af', fontSize: 14, marginBottom: 16 },
  nextDatesList: { gap: 8 },
  nextDateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1116',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  nextDateOptionSelected: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  nextDateOptionDisabled: { opacity: 0.5 },
  nextDateText: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  nextDateTextSelected: { color: '#fff' },
  nextDateTextDisabled: { color: '#64748b' },
  nextDateFullText: { color: '#64748b', fontSize: 12, marginTop: 2 },
  canceledBadge: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
