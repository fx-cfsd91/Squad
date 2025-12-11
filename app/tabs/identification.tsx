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
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
        const res = await fetch(API_CONFIG.ELEVES_FETCH_URL, {
          cache: 'no-store',
          headers: { 'X-API-KEY': 'KEYOFSQUAD01@' }
        });
        if (!res.ok) throw new Error('Erreur chargement liste élèves');
        const data = await res.json();
        setEleves(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError('Impossible de charger la liste des élèves');
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
    if (!found) {
      Alert.alert('Erreur', 'Nom ou prénom non reconnu.');
      return;
    }
    
    // Trouver l'élève correspondant
    const eleve = eleves.find(e =>
      normalizeString(e.nom) === normalizeString(nom) &&
      normalizeString(e.prenom) === normalizeString(prenom)
    );
    
    // Sauvegarder l'état d'identification et les données de l'élève
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(eleve));
    if (!found) {
      Alert.alert('Erreur', 'Nom ou prénom non reconnu.');
      return;
    }
    // Trouver l'élève correspondant
    const eleveFound = eleves.find(e =>
      normalize(e.nom) === normalize(nom) &&
      normalize(e.prenom) === normalize(prenom)
    );
    if (!eleveFound || !eleveFound.password || eleveFound.password !== password) {
      Alert.alert('Erreur', 'Mot de passe incorrect.');
      return;
    }
    // Sauvegarder l'état d'identification et les données de l'élève
    await AsyncStorage.setItem('cfsd91_identifie', '1');
    await AsyncStorage.setItem('cfsd91_eleve_data', JSON.stringify(eleveFound));
    router.push('/');
    return (
      <View style={styles.container}>
        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Identification</Text>
      <TextInput
        style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
        placeholder="Nom"
        placeholderTextColor="#888"
        value={nom}
        onChangeText={setNom}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
        placeholder="Prénom"
        placeholderTextColor="#888"
        value={prenom}
        onChangeText={setPrenom}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, { color: '#fff', backgroundColor: '#18181b', borderColor: '#b40a0a' }]}
        placeholder="Mot de passe"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {nom && prenom && found ? (
        <Text style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: 8 }}>✔ Élève reconnu</Text>
      ) : null}
      {nom && prenom && !found ? (
        <Text style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: 8 }}>Nom ou prénom non reconnu</Text>
      ) : null}
      <View style={styles.rowBtns}>
        <TouchableOpacity style={styles.button} onPress={handleIdentify}>
          <Text style={styles.buttonText}>S'identifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.backBtnInline]} onPress={() => router.back()}> 
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
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
