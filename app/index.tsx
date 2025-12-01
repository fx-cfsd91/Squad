import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Wait a tick to ensure Root Layout is mounted before navigating.
    const t = setTimeout(() => {
      // Replace root with ouverture so back button does not return here
      router.replace('/ouverture');
    }, 80);
    return () => clearTimeout(t);
  }, [router]);

  // Empty placeholder while redirecting
  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}
