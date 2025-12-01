import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Platform, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function Ouverture() {
  // Static require: Metro will attempt to resolve this at bundle time.
  // Make sure the file exists at `assets/images/squat_logo.png` before reloading Metro.
  let logo: any = null;
  try {
    logo = require('../assets/images/squad_logo.png');
  } catch (e) {
    logo = null;
  }

  const router = useRouter();

  // Animated values for entrance (fade+scale) and exit
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    // entrance animation
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
    ]).start();

    // schedule exit: start fade-out shortly before navigation
    const exitDelay = 4500; // ms before starting fade-out
    const totalDelay = 5000; // ms before navigation

    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.02, duration: 350, useNativeDriver: true })
      ]).start();
    }, exitDelay);

    const navTimer = setTimeout(() => {
      router.replace('/(tabs)');
    }, totalDelay);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [opacity, scale, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Présentation' }} />
      {logo ? (
        <Animated.Image
          source={logo}
          style={[styles.logo, { opacity, transform: [{ scale }] }]}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Logo manquant</Text>
          <Text style={styles.placeholderText}>
            Placez l'image fournie par l'équipe dans :
          </Text>
          <Text style={styles.placeholderPath}>assets/images/squad_logo.png</Text>
        </View>
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
    padding: 20,
  },
  logo: {
    width: '80%',
    maxWidth: 600,
    height: 160,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  placeholderPath: {
    color: '#fff',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
