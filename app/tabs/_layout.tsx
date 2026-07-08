// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="adhesion" options={{ title: 'Adhésion' }} />
      <Tabs.Screen name="identification" options={{ title: 'Identification' }} />
      <Tabs.Screen name="recapitulatif" options={{ title: 'Récapitulatif' }} />
      <Tabs.Screen name="evaluations" options={{ title: 'Evaluations' }} />
      <Tabs.Screen name="courses" options={{ title: 'Cours' }} />
      <Tabs.Screen name="events" options={{ title: 'Événements' }} />
      <Tabs.Screen name="Presence" options={{ title: 'Présence' }} />
      <Tabs.Screen name="vosmessages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="fiche/[id]" options={{ title: 'Fiche' }} />
    </Tabs>
  );
}
