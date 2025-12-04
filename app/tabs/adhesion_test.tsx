// app/tabs/adhesion_test.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdhesionTest() {
  const [isAdminConnected, setIsAdminConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Vérifier le statut admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await AsyncStorage.getItem('isAdminConnected');
      setIsAdminConnected(adminStatus === 'true');
    };

    checkAdminStatus();
    const interval = setInterval(checkAdminStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleResetData = async () => {
    console.log('🔄 Test Reset Data');
    Alert.alert(
      'Test Reset',
      'Voulez-vous vraiment tester le reset ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            setLoading(true);
            setStatus('Test reset...');
            
            // Attendre 2 secondes pour simuler
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setStatus('✅ Test terminé');
            setLoading(false);
            
            Alert.alert('Reset Test', 'Le test de reset a fonctionné !');
          }
        }
      ]
    );
  };

  const handleClearAllData = async () => {
    console.log('🗑️ Test Clear All');
    Alert.alert(
      'Test Clear All',
      'Voulez-vous vraiment tester le clear all ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setStatus('Test clear all...');
            
            // Attendre 2 secondes pour simuler
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setStatus('✅ Test terminé');
            setLoading(false);
            
            Alert.alert('Clear All Test', 'Le test de clear all a fonctionné !');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test des boutons Admin</Text>
      
      {status ? <Text style={styles.status}>{status}</Text> : null}
      
      <Text style={styles.adminStatus}>
        Admin connecté: {isAdminConnected ? '✅ OUI' : '❌ NON'}
      </Text>

      {isAdminConnected && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: loading ? '#94a3b8' : '#dc2626' }]}
            onPress={handleResetData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🔄 Test Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: loading ? '#94a3b8' : '#991b1b' }]}
            onPress={handleClearAllData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🗑️ Test Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isAdminConnected && (
        <Text style={styles.message}>
          Connectez-vous en tant qu'admin pour voir les boutons
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  adminStatus: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});