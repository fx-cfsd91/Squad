import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { STORAGE_KEYS, API_CONFIG } from '../../constants/config';
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        console.log('📥 Chargement des élèves...');
        const res = await fetch(API_CONFIG.ELEVES_FETCH_URL, {
          cache: 'no-store',
          headers: { 'X-API-KEY': 'Mac131080' }
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
          'Content-Type': 'application/json',
          'X-API-KEY': 'Mac131080'
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
});
