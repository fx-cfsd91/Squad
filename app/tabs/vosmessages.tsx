import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { API_CONFIG } from '../../constants/config';

type Notif = {
  id: string;
  message: string;
  date: string; // ex: "2025-10-04T18:15:00Z"
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', padding: 12 },
  title: { color: '#b40a0a', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  msgCard: {
    backgroundColor: '#111',
    borderColor: '#23232b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  msgText: { color: '#fff', fontSize: 15 },
  msgDate: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  refreshBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#23232b',
    borderWidth: 1,
    borderColor: '#333',
  },
  refreshTx: { color: '#fff', fontWeight: '600' },
});

export default function VosMessages() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Notif[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_CONFIG.PUSH_HISTORY_URL, { cache: 'no-store', headers: { 'X-API-KEY': 'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const arr = await res.json();
        if (Array.isArray(arr)) {
          setData(arr);
        }
      } catch (e: any) {
        Alert.alert('Erreur', e.message ?? 'Impossible de charger les messages.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  if (loading) {
    return (
      <View style={s.screen}>
        <ActivityIndicator color="#b40a0a" />
        <Text style={{ color: '#cbd5e1', marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: HEADER_HEIGHT }]}>
      <HeaderBar
        title="Vos messages"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="#fff"
        right={(
          <Pressable onPress={() => {
            if (typeof window !== 'undefined' && window.location) {
              window.location.href = '/';
            }
          }}>
            <Ionicons name="home" size={20} color="#000" />
          </Pressable>
        )}
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => (
          <View style={s.msgCard}>
            <Text style={s.msgText}>{item.message}</Text>
            <Text style={s.msgDate}>{new Date(item.date).toLocaleString('fr-FR')}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40 }}>
            Aucun message reçu.
          </Text>
        }
      />
      <TouchableOpacity
        style={s.refreshBtn}
        onPress={() => {
          setLoading(true);
          setData([]); // recharge
        }}
      >
        <Text style={s.refreshTx}>🔄 Recharger</Text>
      </TouchableOpacity>
    </View>
  );
}
