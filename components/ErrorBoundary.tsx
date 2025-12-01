import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

type State = { hasError: boolean, error?: any };

export default class ErrorBoundary extends React.Component<{children: any}, State> {
  constructor(props:any){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(error:any){ return { hasError:true, error }; }
  componentDidCatch(error:any, info:any){ console.error('ErrorBoundary caught', error, info); }
  render(){
    if(this.state.hasError){
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.msg}>{String(this.state.error || 'Erreur inconnue')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => { this.setState({ hasError:false, error:undefined }); }}>
            <Text style={styles.btnTx}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:'#000' },
  title:{ color:'#fff', fontSize:18, fontWeight:'700', marginBottom:12 },
  msg:{ color:'#ddd', marginBottom:16 },
  btn:{ backgroundColor:'#b40a0aff', paddingVertical:10, paddingHorizontal:14, borderRadius:8 },
  btnTx:{ color:'#fff', fontWeight:'600' }
});
