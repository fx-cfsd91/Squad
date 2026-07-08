import { Asset } from 'expo-asset';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const planDeJeuAsset = Asset.fromModule(require('../../assets/html/plan-de-jeu-cfsd91-light.html'));

export default function PlanDeJeuScreen() {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await planDeJeuAsset.downloadAsync();
        if (isMounted) {
          setUri(planDeJeuAsset.localUri ?? planDeJeuAsset.uri ?? null);
        }
      } catch {
        if (isMounted) {
          setUri(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={s.root}>
      <Stack.Screen options={{ title: 'Plan de jeu' }} />
      {uri ? (
        <WebView
          source={{ uri }}
          originWhitelist={['*']}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          renderLoading={() => (
            <View style={s.loading}>
              <ActivityIndicator color="#e5484d" />
              <Text style={s.loadingText}>Chargement du plan de jeu...</Text>
            </View>
          )}
        />
      ) : (
        <View style={s.loading}>
          <ActivityIndicator color="#e5484d" />
          <Text style={s.loadingText}>Préparation du plan de jeu...</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080D14',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#080D14',
  },
  loadingText: {
    color: '#EAF0F7',
    fontSize: 14,
    fontWeight: '600',
  },
});