// app/_layout.tsx
import { Slot } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ErrorBoundary>
        <Slot />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
