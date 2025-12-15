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
    View,
} from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { API_CONFIG, EVENT_TYPE_COLORS } from '../../constants/config';
import { Event } from '../../constants/types';
import { createEvent, fetchEvents, updateEvent, deleteEvent } from '../../lib/api';
import { formatDate, generateUUID } from '../../lib/utils';

const EVENT_TYPES: { [key: string]: { label: string; color: string } } = {
  competition: { label: 'Compétition', color: '#ef4444' },
  stage: { label: 'Stage', color: '#f59e0b' },
  autre: { label: 'Autre', color: '#3b82f6' },
};

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Formulaire
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'competition' | 'stage' | 'autre'>('competition');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setSelectedType('competition');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setSelectedType(event.type);
    setDate(event.date);
    setStartTime(event.startTime || '');
    setEndTime(event.endTime || '');
    setLocation(event.location || '');
    setDescription(event.description || '');
    setModalVisible(true);
  };

  const saveEvent = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    if (!date) {
      Alert.alert('Erreur', 'La date est requise');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Erreur', 'Format de date invalide. Utilisez AAAA-MM-JJ');
      return;
    }

    try {
      const eventData = {
        title: title.trim(),
        type: selectedType as any,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
        description: description || undefined,
        visible: true,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        Alert.alert('Succès', 'Événement modifié');
      } else {
        await createEvent(eventData);
        Alert.alert('Succès', 'Événement ajouté');
      }
      
      setModalVisible(false);
      await loadEvents();
    } catch (error) {
      console.error('Erreur sauvegarde événement:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
    }
  };

  const toggleEventVisible = async (event: Event) => {
    try {
      await updateEvent(event.id, { visible: !event.visible });
      await loadEvents();
    } catch (error) {
      console.error('Erreur toggle événement:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de connexion au serveur');
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    console.log('🗑️  handleDeleteEvent called with event:', event);
    setEventToDelete(event);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      console.log('🗑️  Starting delete process for event ID:', eventToDelete.id);
      await deleteEvent(eventToDelete.id);
      console.log('✅ Delete successful, reloading events...');
      await loadEvents();
      console.log('✅ Events reloaded');
      setDeleteModalVisible(false);
      setEventToDelete(null);
      Alert.alert('Succès', 'Événement supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
      console.error('Error message:', errorMessage);
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Formater une date pour l'affichage
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  // Grouper les événements par mois
  const groupEventsByMonth = () => {
    const grouped: { [key: string]: Event[] } = {};
    
    events
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(event => {
        const date = new Date(event.date);
        const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(event);
      });
    
    return grouped;
  };

  const groupedEvents = groupEventsByMonth();

  return (
    <View style={s.container}>
      {/* Header */}
      <HeaderBar
        title="Gestion des Événements"
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
        ) : events.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#64748b" />
            <Text style={s.emptyText}>Aucun événement configuré</Text>
            <Text style={s.emptyHint}>Appuyez sur + pour ajouter un événement</Text>
          </View>
        ) : (
          Object.entries(groupedEvents).map(([month, monthEvents]) => (
            <View key={month} style={s.monthSection}>
              <Text style={s.monthTitle}>{month}</Text>
              {monthEvents.map((event) => (
                <View
                  key={event.id}
                  style={[
                    s.eventCard,
                    !event.visible && s.eventCardInactive,
                    { borderLeftColor: EVENT_TYPES[event.type].color, borderLeftWidth: 4 }
                  ]}
                >
                  <View style={s.eventHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={s.eventTitleRow}>
                        <Text
                          style={[
                            s.eventTitle,
                            !event.visible && s.inactiveText,
                            { color: EVENT_TYPES[event.type].color }
                          ]}
                        >
                          {event.title}
                        </Text>
                        <View style={[s.typeBadge, { backgroundColor: EVENT_TYPES[event.type].color + '20' }]}>
                          <Text style={[s.typeBadgeText, { color: EVENT_TYPES[event.type].color }]}>
                            {EVENT_TYPES[event.type].label}
                          </Text>
                        </View>
                      </View>
                      <View style={s.eventInfo}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={[s.eventInfoText, !event.visible && s.inactiveText]}>
                          {formatDate(event.date)}
                        </Text>
                      </View>
                      {(event.startTime || event.endTime) && (
                        <View style={s.eventInfo}>
                          <Ionicons name="time-outline" size={14} color="#64748b" />
                          <Text style={[s.eventInfoText, !event.visible && s.inactiveText]}>
                            {event.startTime} {event.endTime && `- ${event.endTime}`}
                          </Text>
                        </View>
                      )}
                      {event.location && (
                        <View style={s.eventInfo}>
                          <Ionicons name="location-outline" size={14} color="#64748b" />
                          <Text style={[s.eventInfoText, !event.visible && s.inactiveText]}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Switch
                      value={event.visible}
                      onValueChange={() => toggleEventVisible(event)}
                      trackColor={{ false: '#64748b', true: '#22c55e' }}
                    />
                  </View>

                  {event.description && (
                    <Text style={[s.eventDescription, !event.visible && s.inactiveText]}>
                      {event.description}
                    </Text>
                  )}

                  <View style={s.eventActions}>
                    <Pressable
                      onPress={() => openEditModal(event)}
                      style={s.actionBtn}
                    >
                      <Ionicons name="create-outline" size={20} color="#3b82f6" />
                      <Text style={s.actionBtnText}>Modifier</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteEvent(event)}
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
          ))
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
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView style={s.modalContent}>
              {/* Titre */}
              <Text style={s.label}>Titre de l'événement</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Compétition régionale, Stage d'été..."
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
              />

              {/* Type */}
              <Text style={s.label}>Type d'événement</Text>
              <View style={s.typeSelector}>
                {Object.entries(EVENT_TYPES).map(([key, config]) => (
                  <Pressable
                    key={key}
                    style={[
                      s.typeOption,
                      selectedType === key && { 
                        backgroundColor: config.color, 
                        borderColor: config.color 
                      },
                    ]}
                    onPress={() => setSelectedType(key as any)}
                  >
                    <Text
                      style={[
                        s.typeOptionText,
                        selectedType === key && s.typeOptionTextSelected,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Date */}
              <Text style={s.label}>Date (AAAA-MM-JJ)</Text>
              <TextInput
                style={s.input}
                placeholder="2025-12-25"
                placeholderTextColor="#6b7280"
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
              />

              {/* Horaires */}
              <Text style={s.label}>Heure de début (HH:MM, optionnel)</Text>
              <TextInput
                style={s.input}
                placeholder="09:00"
                placeholderTextColor="#6b7280"
                value={startTime}
                onChangeText={setStartTime}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={s.label}>Heure de fin (HH:MM, optionnel)</Text>
              <TextInput
                style={s.input}
                placeholder="17:00"
                placeholderTextColor="#6b7280"
                value={endTime}
                onChangeText={setEndTime}
                keyboardType="numbers-and-punctuation"
              />

              {/* Lieu */}
              <Text style={s.label}>Lieu (optionnel)</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Dojo, Gymnase municipal..."
                placeholderTextColor="#6b7280"
                value={location}
                onChangeText={setLocation}
              />

              {/* Description */}
              <Text style={s.label}>Description (optionnel)</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Informations complémentaires..."
                placeholderTextColor="#6b7280"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[s.modalBtn, s.modalBtnCancel]}
              >
                <Text style={s.modalBtnTextCancel}>Annuler</Text>
              </Pressable>
              <Pressable onPress={saveEvent} style={[s.modalBtn, s.modalBtnSave]}>
                <Text style={s.modalBtnTextSave}>
                  {editingEvent ? 'Modifier' : 'Ajouter'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable 
          style={s.deleteModalBackdrop}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={s.deleteModalContent}
          >
            <Ionicons name="trash-outline" size={40} color="#ef4444" />
            <Text style={s.deleteModalTitle}>Confirmer la suppression</Text>
            <Text style={s.deleteModalText}>
              Êtes-vous sûr de vouloir supprimer l'événement "{eventToDelete?.title}" ?
            </Text>
            <View style={s.deleteModalActions}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[s.deleteModalBtn, s.deleteModalBtnCancel]}
              >
                <Text style={s.deleteModalBtnTextCancel}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={[s.deleteModalBtn, s.deleteModalBtnDelete]}
              >
                <Text style={s.deleteModalBtnText}>Supprimer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
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
  monthSection: { marginBottom: 24 },
  monthTitle: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  eventCard: {
    backgroundColor: '#0d1116',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginBottom: 12,
  },
  eventCardInactive: { opacity: 0.5 },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventInfoText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  inactiveText: { textDecorationLine: 'line-through', color: '#64748b' },
  eventDescription: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
  eventActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
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
  modalContent: { 
    padding: 20,
    paddingBottom: 0,
  },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 8 },
  typeOption: {
    flex: 1,
    backgroundColor: '#0d1116',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  typeOptionText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  typeOptionTextSelected: { color: '#fff' },
  modalActions: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
    backgroundColor: '#1a1f2e',
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#374151' },
  modalBtnSave: { backgroundColor: '#22c55e' },
  modalBtnTextCancel: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  modalBtnTextSave: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Delete modal styles
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    pointerEvents: 'auto',
  },
  deleteModalContent: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: '80%',
  },
  deleteModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalBtnCancel: {
    backgroundColor: '#374151',
  },
  deleteModalBtnDelete: {
    backgroundColor: '#ef4444',
  },
  deleteModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalBtnTextCancel: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
