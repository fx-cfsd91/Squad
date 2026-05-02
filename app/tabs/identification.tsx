import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { STORAGE_KEYS, API_CONFIG, API_HEADERS, PASSWORD_RULES } from '../../constants/config';
import { Eleve } from '../../constants/types';
import { normalizeString } from '../../lib/utils';

export default function Identification() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [password, setPassword] = useState('');
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetNom, setResetNom] = useState('');
  const [resetPrenom, setResetPrenom] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNom, setDeleteNom] = useState('');
  const [deletePrenom, setDeletePrenom] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteNom(''); setDeletePrenom(''); setDeletePassword(''); setDeleteConfirmed(false);
  };

  const handleDeleteAccount = async () => {
    if (!deleteNom.trim() || !deletePrenom.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom.');
      return;
    }
    if (!deletePassword) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe.');
      return;
    }
    if (!deleteConfirmed) {
      Alert.alert('Erreur', 'Vous devez cocher la case de confirmation.');
      return;
    }
    const match = eleves.find(
      e => normalizeString(e.nom).toLowerCase() === normalizeString(deleteNom).trim().toLowerCase() &&
           normalizeString(e.prenom).toLowerCase() === normalizeString(deletePrenom).trim().toLowerCase()
    );
    if (!match) {
      Alert.alert('Introuvable', 'Aucun élève ne correspond à ce nom et prénom.');
      return;
    }
    try {
      setDeleteLoading(true);
      const response = await fetch(API_CONFIG.ELEVES_FETCH_URL, {
        method: 'DELETE',
        headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: match.id, password: deletePassword }),
      });
      const data = await response.json();
      if (response.ok && (data.success || data.ok)) {
        await AsyncStorage.multiRemove([STORAGE_KEYS.USER, 'cfsd91_identifie', 'cfsd91_eleve_data']);
        closeDeleteModal();
        Alert.alert('✅ Données supprimées', 'Vos données ont été effacées définitivement.');
      } else {
        Alert.alert('Erreur', data.error || data.message || 'Impossible de supprimer les données. Vérifiez votre mot de passe.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Erreur réseau.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd);

  const handleResetPassword = async () => {
    if (!resetNom.trim() || !resetPrenom.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom.');
      return;
    }
    if (!isStrongPassword(resetNewPassword)) {
      Alert.alert('Mot de passe invalide', 'Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    const match = eleves.find(
      e => normalizeString(e.nom).toLowerCase() === normalizeString(resetNom).trim().toLowerCase() &&
           normalizeString(e.prenom).toLowerCase() === normalizeString(resetPrenom).trim().toLowerCase()
    );
    if (!match) {
      Alert.alert('Introuvable', 'Aucun élève ne correspond à ce nom et prénom.');
      return;
    }
    try {
      setResetLoading(true);
      const response = await fetch(API_CONFIG.ELEVES_FETCH_URL, {
        method: 'PUT',
        headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: match.id, password: resetNewPassword }),
      });
      const data = await response.json();
      if (response.ok && (data.success || data.ok)) {
        Alert.alert('✅ Succès', 'Votre mot de passe a été modifié.');
        setShowResetModal(false);
        setResetNom(''); setResetPrenom('');
        setResetNewPassword(''); setResetConfirmPassword('');
      } else {
        Alert.alert('Erreur', data.error || data.message || 'Impossible de modifier le mot de passe.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Erreur réseau.');
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        console.log('📥 Chargement des élèves...');
        const res = await fetch(API_CONFIG.ELEVES_FETCH_URL, {
          cache: 'no-store',
          headers: API_HEADERS
        });
        console.log('📡 Response status:', res.status);
        if (!res.ok) {
          throw new Error(`Erreur HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log('✅ Données reçues:', Array.isArray(data) ? `${data.length} élèves` : 'Format invalide');
        setEleves(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('❌ Erreur chargement élèves:', e);
        setError('Impossible de charger la liste des élèves: ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const found = eleves.some(e =>
    normalizeString(e.nom) === normalizeString(nom) &&
    normalizeString(e.prenom) === normalizeString(prenom)
  );

  const handleIdentify = async () => {
    try {
      console.log('🔑 Tentative d\'authentification...');
      console.log('Nom:', nom, 'Prénom:', prenom);
      
      setLoading(true);
      
      if (!nom || !prenom) {
        Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom');
        setLoading(false);
        return;
      }

      if (!password) {
        Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
        setLoading(false);
        return;
      }

      // Appeler l'endpoint de login
      console.log('📡 Envoi vers /login.php...');
      const response = await fetch('https://cfsd91.com/login.php', {
        method: 'POST',
        headers: {
          ...API_HEADERS,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom,
          prenom,
          password
        })
      });

      console.log('📊 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);

      if (!data.success) {
        Alert.alert('Erreur', data.message || 'Authentification échouée');
        setLoading(false);
        return;
      }

      console.log('✅ Authentification réussie!');
      const eleve = data.eleve;
      
      // Sauvegarder l'état d'identification et les données de l'élève
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(eleve));
      await AsyncStorage.setItem('cfsd91_identifie', '1');
      await AsyncStorage.setItem('cfsd91_eleve_data', JSON.stringify(eleve));
      
      Alert.alert('Succès', `Bienvenue ${eleve.prenom}!`);
      router.replace('/tabs');
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de l\'authentification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Identification</Text>
      
      {error && (
        <Text style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          ⚠️ {error}
        </Text>
      )}
      
      {loading ? (
        <ActivityIndicator size="large" color="#b40a0a" />
      ) : (
        <>
          <TextInput
            style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
            placeholder="Nom"
            placeholderTextColor="#888"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
            placeholder="Prénom"
            placeholderTextColor="#888"
            value={prenom}
            onChangeText={setPrenom}
            autoCapitalize="words"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
          {nom && prenom && found ? (
            <Text style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: 8 }}>✔ Élève reconnu</Text>
          ) : null}
          {nom && prenom && !found ? (
            <Text style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: 8 }}>Nom ou prénom non reconnu</Text>
          ) : null}
          <View style={styles.rowBtns}>
            <TouchableOpacity style={styles.button} onPress={handleIdentify} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'S\'identifier'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.backBtnInline]} onPress={() => router.back()} disabled={loading}> 
              <Text style={styles.buttonText}>Retour</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.resetLink} onPress={() => setShowResetModal(true)} disabled={loading}>
            <Text style={styles.resetLinkText}>Réinitialiser le mot de passe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetLink} onPress={() => setShowDeleteModal(true)} disabled={loading}>
            <Text style={[styles.resetLinkText, { color: '#ef4444' }]}>Supprimer mes données</Text>
          </TouchableOpacity>

          {/* Modal suppression compte */}
          <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={closeDeleteModal}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, { borderColor: '#ef4444' }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.modalTitle, { color: '#ef4444' }]}>⚠️ Supprimer mes données</Text>
                  <Text style={styles.modalSubtitle}>Cette action est <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>irréversible</Text>. Toutes vos données seront définitivement supprimées du serveur.</Text>

                  <Text style={styles.modalLabel}>Nom</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nom"
                    placeholderTextColor="#888"
                    value={deleteNom}
                    onChangeText={setDeleteNom}
                    autoCapitalize="words"
                  />
                  <Text style={styles.modalLabel}>Prénom</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Prénom"
                    placeholderTextColor="#888"
                    value={deletePrenom}
                    onChangeText={setDeletePrenom}
                    autoCapitalize="words"
                  />
                  <Text style={styles.modalLabel}>Mot de passe</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Mot de passe"
                    placeholderTextColor="#888"
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="current-password"
                  />

                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18, marginBottom: 4 }} onPress={() => setDeleteConfirmed(v => !v)}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ef4444', backgroundColor: deleteConfirmed ? '#ef4444' : '#09090b', marginTop: 1, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      {deleteConfirmed && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>✓</Text>}
                    </View>
                    <Text style={{ color: '#e5e7eb', fontSize: 13, flexShrink: 1 }}>Je comprends que cette suppression est définitive et irréversible.</Text>
                  </TouchableOpacity>

                  {deleteLoading ? (
                    <ActivityIndicator color="#ef4444" style={{ marginTop: 16 }} />
                  ) : (
                    <View style={styles.modalBtns}>
                      <TouchableOpacity style={[styles.button, { backgroundColor: '#ef4444' }]} onPress={handleDeleteAccount}>
                        <Text style={styles.buttonText}>Supprimer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, styles.backBtnInline]} onPress={closeDeleteModal}>
                        <Text style={styles.buttonText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Modal réinitialisation mot de passe */}
          <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={() => setShowResetModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
                  <Text style={styles.modalSubtitle}>Entrez votre nom et prénom pour vous identifier, puis choisissez un nouveau mot de passe.</Text>

                  <Text style={styles.modalLabel}>Nom</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nom"
                    placeholderTextColor="#888"
                    value={resetNom}
                    onChangeText={setResetNom}
                    autoCapitalize="words"
                  />
                  <Text style={styles.modalLabel}>Prénom</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Prénom"
                    placeholderTextColor="#888"
                    value={resetPrenom}
                    onChangeText={setResetPrenom}
                    autoCapitalize="words"
                  />
                  <Text style={styles.modalLabel}>Nouveau mot de passe</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor="#888"
                    value={resetNewPassword}
                    onChangeText={setResetNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <Text style={styles.modalLabel}>Confirmer le mot de passe</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="#888"
                    value={resetConfirmPassword}
                    onChangeText={setResetConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <Text style={styles.modalHint}>8 caractères min., une majuscule, une minuscule, un chiffre, un caractère spécial.</Text>

                  {resetLoading ? (
                    <ActivityIndicator color="#b40a0a" style={{ marginTop: 16 }} />
                  ) : (
                    <View style={styles.modalBtns}>
                      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                        <Text style={styles.buttonText}>Confirmer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, styles.backBtnInline]} onPress={() => { setShowResetModal(false); setResetNom(''); setResetPrenom(''); setResetNewPassword(''); setResetConfirmPassword(''); }}>
                        <Text style={styles.buttonText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#b40a0a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181b',
    color: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#b40a0a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  rowBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  backBtnInline: {
    backgroundColor: '#18181b',
    borderColor: '#64748b',
    borderWidth: 1,
  },
  foundIndicator: {
    color: '#22c55e',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
    alignSelf: 'center',
  },
  notFoundIndicator: {
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
    alignSelf: 'center',
  },
  resetLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  resetLinkText: {
    color: '#3b82f6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#b40a0a',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#09090b',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalHint: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    justifyContent: 'center',
  },
});
