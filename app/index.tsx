import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Wait a tick to ensure Root Layout is mounted before navigating.
    const t = setTimeout(async () => {
      // Vérifier si l'utilisateur est connecté
      const isIdentified = await AsyncStorage.getItem('cfsd91_identifie');
      
      if (isIdentified === '1') {
        // Si connecté, aller directement à /tabs
        router.replace('/tabs');
      } else {
        // Sinon, afficher l'écran d'ouverture
        router.replace('/ouverture');
      }
    }, 80);
    return () => clearTimeout(t);
  }, [router]);

  // Empty placeholder while redirecting
  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}
