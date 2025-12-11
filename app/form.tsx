import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { EXTERNAL_URLS } from '../constants/config';

export default function FormScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ title: 'Formulaire CFSD91' }} />
      <WebView
        originWhitelist={['*']}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
            <ActivityIndicator color="#b40a0a" />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        source={{ uri: EXTERNAL_URLS.USER_FORM }}
      />
    </View>
  );
}
