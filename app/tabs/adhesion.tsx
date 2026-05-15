// CameraType n'est pas une valeur, utiliser Camera.Constants.Type.front
// app/tabs/adhesion.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar, { HEADER_HEIGHT } from '../../components/header-bar';
import { API_CONFIG, API_HEADERS } from '../../constants/config';
// import { CameraConstants } from 'expo-camera';

const STORAGE_KEY = 'eleves_cfsd91';
const REMOTE_JSON_URL = API_CONFIG.ELEVES_FETCH_URL;
const UPLOAD_URL = 'https://cfsd91.com/appli/php/eleves.php';
const UPLOAD_FALLBACK_URL = API_CONFIG.ELEVES_FETCH_URL;
const TARGET_JSON_NAME = 'eleves.json';

type Eleve = {
  id:string; nom:string; prenom:string; naissance:string;
  jour:string; discipline:string; combattant?:boolean; etudiant?:boolean; renouvellement?:boolean;
  autorisationDepartSeul?:boolean;
  telUrgence?:string; telEleve?:string; email?:string; adresse?:string;
  poids?: number | null; licence?:string; ceinture?:string; photo?:string;
  createdAt:string;
  password: string;
};

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(c)=>{
    const r = (Math.random()*16)|0; const v = c==='x'? r : (r&0x3)|0x8; return v.toString(16);
  });

const normPhone = (p='') => (p+'').replace(/\D+/g,'').replace(/^0033/,'0').replace(/^33/,'0');
const isValidFRPhone = (p='') => /^0[1-9]\d{8}$/.test(normPhone(p));

async function loadLocal():Promise<Eleve[]>{
  try{ const t = await AsyncStorage.getItem(STORAGE_KEY); return JSON.parse(t||'[]'); }catch{ return []; }
}
async function saveLocal(list:Eleve[]){ await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// Couleurs inverses pour forcer le CSS global sur web
const INPUT_BG_COLOR = '#ffffff';
const INPUT_TEXT_COLOR = '#000000';

export default function Adhesion() {
          // Validation du mot de passe fort
          const [password, setPassword] = useState('');
          const isStrongPassword = (pwd:string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd);
        // Normalise une chaîne (supprime les accents)
        const normalizeString = (str:string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const ceintures = [
        'Blanche','Jaune', 'Jaune I', 'Jaune II', 'Jaune III',
        'Orange','Orange I', 'Orange II', 'Orange III',
        'Verte', 'Bleue', 'Violette', 'Marron',
        'Noire I', 'Noire II', 'Noire III', 'Noire IV', 'Noire V', 'Noire VI'
      ];
    // Suppression de la logique selfie/caméra
  // champs
  const [nom,setNom]=useState(''); const [prenom,setPrenom]=useState('');
  const [naissance,setNaissance]=useState(''); const [jour,setJour]=useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [discipline,setDiscipline]=useState(''); const [telUrgence,setTelUrgence]=useState('');
  const [telEleve,setTelEleve]=useState(''); const [email,setEmail]=useState('');
  const [adresse,setAdresse]=useState(''); const [licence,setLicence]=useState('');
  const [ceinture,setCeinture]=useState(''); const [photo,setPhoto]=useState<string>('');
  const [poids, setPoids] = useState<string>('');
  
  // Checkbox states
  const [isCompetiteur, setIsCompetiteur] = useState(false);
  const [isEtudiant, setIsEtudiant] = useState(false);
  const [isRenouvellement, setIsRenouvellement] = useState(false);
  const [isAutorisationDepartSeul, setIsAutorisationDepartSeul] = useState(false);
  const [isReglementLu, setIsReglementLu] = useState(false);
  
  const [loading,setLoading]=useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  
  // Jours et disciplines utilisés par le formulaire
    // Compresser une image (max 500KB)
    const compressImage = async (uri: string): Promise<string> => {
      try {
        console.log('🖼️ Compression de la photo...');
        
        // Étape 1: Redimensionner et compresser
        const manipResult = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800, height: 800 } }], { 
          compress: 0.7, 
          format: ImageManipulator.SaveFormat.JPEG 
        });
        
        console.log('✅ Photo compressée:', manipResult.uri);
        
        // Étape 2: Convertir en base64
        const base64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: 'base64' });
        const sizeKB = (base64.length * 0.75) / 1024; // Approximation de la taille en KB
        
        console.log(`📊 Taille finale: ${sizeKB.toFixed(0)} KB`);
        
        if (sizeKB > 500) {
          Alert.alert('Attention', `La photo pèse ${sizeKB.toFixed(0)} KB. Essayez une photo plus petite.`);
        }
        
        return base64;
      } catch (error) {
        console.error('Erreur compression:', error);
        throw error;
      }
    };

    // Sélectionner une photo depuis la galerie
    const pickPhoto = async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission', "Autorise l'accès aux photos pour ajouter une photo.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.6,
          base64: Platform.OS === 'web',
        });
        const uri = (res as any).assets ? (res as any).assets[0]?.uri : (res as any).uri;
        
        // Compresser l'image avant utilisation
        if (uri) {
          const compressedBase64 = await compressImage(uri);
          setPhoto(compressedBase64);
        }
      } catch (e) {
        console.error('pickPhoto error', e);
        Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
      }
    };
  const jours = ['Mercredi', 'Vendredi', 'Mercredi et Vendredi', 'Dimanche'];
  const disciplines = ['Karaté Mix', 'Krav-Maga'];
  
  // Sélectionner une photo depuis la galerie
  // Fonction photo supprimée
  
  // Charger les données depuis le serveur IONOS uniquement
  React.useEffect(() => {
    const loadFromServer = async () => {
      try {
        setLoading(true);

        // Charger uniquement depuis le serveur IONOS avec clé API
        const response = await fetch(REMOTE_JSON_URL, {
          headers: { 'X-API-KEY': 'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e' }
        });
        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`);
        }

        const data = await response.json();
        const elevesData = Array.isArray(data) ? data : [];

        setEleves(elevesData);
      } catch (error: any) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
        Alert.alert('Erreur de chargement', 'Impossible de récupérer les données du serveur. Vérifie ta connexion internet.');
      } finally {
        setLoading(false);
      }
    };

    loadFromServer();
  }, []);
  
  const onSubmit = async()=>{
    if (submitting) return;
    if (!isReglementLu) {
      Alert.alert('Règlement requis', 'Vous devez accepter le règlement intérieur du CFSD91 avant d\'envoyer.');
      return;
    }
    if(!nom.trim()||!prenom.trim()||!naissance||!jour||!discipline||!telUrgence.trim()){
      Alert.alert('Champs obligatoires','Renseigne Nom, Prénom, Date, Jour, Discipline, Tél. d\'urgence.'); return;
    }
    if(!isStrongPassword(password)){
      Alert.alert('Mot de passe','Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'); return;
    }
    if(!isValidFRPhone(telUrgence)) return Alert.alert('Erreur',"Téléphone d'urgence invalide (FR).");
    if(telEleve && !isValidFRPhone(telEleve)) return Alert.alert('Erreur','Téléphone élève invalide (FR).');
    if(telEleve && normPhone(telUrgence)===normPhone(telEleve))
      return Alert.alert('Erreur',"Le téléphone élève doit être différent de l'urgence");

    // Conversion date naissance JJ-MM-AAAA -> ISO AAAA-MM-JJ
    let naissanceISO = naissance;
    if (/^\d{2}-\d{2}-\d{4}$/.test(naissance)) {
      const [jj, mm, aaaa] = naissance.split('-');
      naissanceISO = `${aaaa}-${mm.padStart(2,'0')}-${jj.padStart(2,'0')}`;
    }

    const d:Eleve = {
      id: uuid(), nom: nom.trim(), prenom: normalizeString(prenom.trim()), naissance: naissanceISO, jour, discipline,
      combattant: isCompetiteur, etudiant: isEtudiant, renouvellement: isRenouvellement, autorisationDepartSeul: !isAutorisationDepartSeul, telUrgence: telUrgence.trim(), telEleve: telEleve.trim(),
      email: email.trim(), adresse: adresse.trim(), poids: poids ? Number(poids) : null, licence: licence.trim(),
      ceinture, photo: photo.substring(0, 5000000), // Limiter la taille de la photo à 5MB
      createdAt: new Date().toISOString(),
      password
    };

    setLoading(true);
    setSubmitting(true);
    try {
      // Envoi POST au serveur avec timeout et fallback d'URL
      console.log('DEBUG: Envoi données:', JSON.stringify(d));

      const postWithTimeout = async (url: string) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
          return await fetch(url, {
            method: 'POST',
            headers: API_HEADERS,
            body: JSON.stringify({ data: [d] }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      };

      let response: Response | null = null;
      let lastError: string | null = null;
      for (const url of [UPLOAD_URL, UPLOAD_FALLBACK_URL]) {
        try {
          const current = await postWithTimeout(url);
          if (current.ok) {
            response = current;
            break;
          }
          lastError = `Erreur serveur: ${current.status}`;
        } catch (err: any) {
          lastError = err?.name === 'AbortError' ? 'Délai dépassé (15s)' : (err?.message || 'Erreur réseau');
        }
      }

      if (!response) {
        throw new Error(lastError || 'Impossible de joindre le serveur');
      }

      console.log('DEBUG: Response status:', response.status);
      const res = await response.json();
      console.log('DEBUG: Réponse serveur:', JSON.stringify(res));
      if (res.success || res.ok) {
        Alert.alert('✅ Élève ajouté', 'L\'inscription a été envoyée au serveur.');
        // reset
        setNom(''); setPrenom(''); setNaissance(''); setJour(''); setDiscipline('');
        setTelUrgence(''); setTelEleve(''); setEmail(''); setAdresse(''); setLicence(''); setCeinture('');
        setPhoto('');
        setIsCompetiteur(false);
        setIsEtudiant(false);
        setIsRenouvellement(false);
        setIsAutorisationDepartSeul(false);
        setPassword('');
        router.back();
      } else {
        // Affiche le contenu brut pour diagnostic
        Alert.alert('Erreur',
          res.error ? res.error :
          res.message ? res.message :
          'Réponse serveur: ' + JSON.stringify(res)
        );
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d\'envoyer au serveur');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Modal - Information mot de passe */}
      {showPasswordInfo && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginHorizontal: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Règles du mot de passe</Text>
              <Pressable onPress={() => setShowPasswordInfo(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            
            <ScrollView style={{ maxHeight: '90%' }}>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                Votre mot de passe doit respecter les critères suivants :
              </Text>
              
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>Minimum 8 caractères</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>Au moins 1 majuscule (A-Z)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>Au moins 1 minuscule (a-z)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>Au moins 1 chiffre (0-9)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>Au moins 1 caractère spécial (!@#$%^&...)</Text>
                </View>
              </View>
              
              <Text style={{ fontSize: 12, color: '#999', marginTop: 12, fontStyle: 'italic' }}>
                Exemple : Password123! ✓
              </Text>
            </ScrollView>
            
            <Pressable 
              onPress={() => setShowPasswordInfo(false)} 
              style={{ backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Compris</Text>
            </Pressable>
          </View>
        </View>
      )}
      
      {/* Section selfie/caméra supprimée - état stable */}
      <HeaderBar
        title="Adhésion"
        backgroundColor="#fff"
        titleColor="#000"
        iconBgColor="transparent"
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => router.push('/')} accessibilityLabel="Accueil" style={{ padding: 6 }}>
              <Ionicons name="home" size={20} color="#000" />
            </Pressable>
          </View>
        )}
      />

      {/* Boutons rouges sous le bandeau blanc */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, marginBottom: 8, gap: 12 }}>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, marginBottom: 8, gap: 6, paddingHorizontal: 12 }}>
        <TouchableOpacity
          onPress={async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission', "Autorise l'accès à la caméra pour prendre une photo.");
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: Platform.OS === 'web',
            });
            const uri = (res as any).assets ? (res as any).assets[0]?.uri : (res as any).uri;
            if (Platform.OS === 'web') {
              const base64 = (res as any).assets ? (res as any).assets[0]?.base64 : (res as any).base64;
              if (base64) setPhoto(base64);
            } else if (uri) {
              const base64 = await FileSystemLegacy.readAsStringAsync(uri, { encoding: 'base64' });
              setPhoto(base64);
            }
          }}
          accessibilityLabel="Prendre une photo"
          style={{ flex: 1, backgroundColor: '#b40a0a', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>Prendre une photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission', "Autorise l'accès à la galerie pour sélectionner une photo.");
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.6,
              base64: Platform.OS === 'web',
            });
            const uri = (res as any).assets ? (res as any).assets[0]?.uri : (res as any).uri;
            if (Platform.OS === 'web') {
              const base64 = (res as any).assets ? (res as any).assets[0]?.base64 : (res as any).base64;
              if (base64) setPhoto(base64);
            } else if (uri) {
              const base64 = await FileSystemLegacy.readAsStringAsync(uri, { encoding: 'base64' });
              setPhoto(base64);
            }
          }}
          accessibilityLabel="Choisir une photo de la galerie"
          style={{ flex: 1, backgroundColor: '#b40a0a', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>Choisir une photo</Text>
        </TouchableOpacity>
      </View>

      {/* Un seul bloc de formulaire */}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={HEADER_HEIGHT + 12}>
        <ScrollView style={{ flex:1, backgroundColor:'#000', paddingTop: HEADER_HEIGHT }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding:16, paddingBottom: 80 }}>
          <Stack.Screen options={{ title:'Adhésion' }} />

          <View style={s.card}>
            {/* Champs Nom et Prénom */}
            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Nom <Text style={{color:'#ef4444'}}>*</Text></Text>
                <TextInput style={s.inp} value={nom} onChangeText={setNom} placeholder="Nom" placeholderTextColor="#777" />
              </View>
              <View style={s.col}>
                <Text style={s.lbl}>Prénom <Text style={{color:'#ef4444'}}>*</Text></Text>
                <TextInput style={s.inp} value={prenom} onChangeText={setPrenom} placeholder="Prénom" placeholderTextColor="#777" />
              </View>
            </View>
            {/* Mot de passe sous Nom/Prénom */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={s.lbl}>Mot de passe <Text style={{color:'#ef4444'}}>*</Text></Text>
              <Pressable onPress={() => setShowPasswordInfo(true)} style={{ padding: 8 }}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
              </Pressable>
            </View>
            <TextInput
              style={s.inp}
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe fort"
              placeholderTextColor="#777"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            {/* ...existing code... */}
            {/* Cases à cocher supprimées */}

            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Naissance (JJ/MM/AAAA) <Text style={{color:'#ef4444'}}>*</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[s.inp, { flex: 1 }]}
                    value={naissance}
                    editable={true}
                    onChangeText={setNaissance}
                    placeholder="14-05-2012"
                    placeholderTextColor="#777"
                  />
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ padding: 8 }}>
                    <Ionicons name="calendar-outline" size={22} color="#b40a0a" />
                  </TouchableOpacity>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateObj || new Date(2000, 0, 1)}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(event: any, selectedDate?: Date) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setDateObj(selectedDate);
                        const jj = String(selectedDate.getDate()).padStart(2, '0');
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const aaaa = selectedDate.getFullYear();
                        setNaissance(`${jj}-${mm}-${aaaa}`);
                      }
                    }}
                  />
                )}
              </View>
              <View style={s.col}>
                <Text style={s.lbl}>Jour <Text style={{color:'#ef4444'}}>*</Text></Text>
                <View style={s.picker}>
                  <Picker selectedValue={jour} onValueChange={setJour} dropdownIconColor="#000" style={{ color:'#000' }}>
                    <Picker.Item label="— choisir —" value="" />
                    {jours.map(j=><Picker.Item key={j} label={j} value={j} />)}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Discipline <Text style={{color:'#ef4444'}}>*</Text></Text>
                <View style={s.picker}>
                  <Picker selectedValue={discipline} onValueChange={setDiscipline} dropdownIconColor="#000" style={{ color:'#000' }}>
                    <Picker.Item label="— choisir —" value="" />
                    {disciplines.map(d=><Picker.Item key={d} label={d} value={d} />)}
                  </Picker>
                </View>
              </View>
              <View style={s.col}>
                <Text style={s.lbl}>Tél. d'urgence <Text style={{color:'#ef4444'}}>*</Text></Text>
                <TextInput style={s.inp} value={telUrgence} onChangeText={setTelUrgence} placeholder="06 12 34 56 78" placeholderTextColor="#777" inputMode="tel" />
              </View>
            </View>

            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Tél. élève</Text>
                <TextInput style={s.inp} value={telEleve} onChangeText={setTelEleve} placeholder="06 98 76 54 32" placeholderTextColor="#777" inputMode="tel" />
              </View>
              <View style={s.col}>
                <Text style={s.lbl}>Email</Text>
                <TextInput style={s.inp} value={email} onChangeText={setEmail} placeholder="prenom.nom@mail.com" placeholderTextColor="#777" inputMode="email" autoCapitalize="none" />
              </View>
            </View>

            <Text style={s.lbl}>Adresse postale (facultatif)</Text>
            <TextInput style={[s.inp,{minHeight:72, textAlignVertical:'top'}]} multiline placeholder={'Numéro et rue\nCode postal Ville'} placeholderTextColor="#777" value={adresse} onChangeText={setAdresse} />

            <Text style={s.lbl}>Licence (facultatif)</Text>
            <TextInput style={s.inp} value={licence} onChangeText={setLicence} placeholder="Licence" placeholderTextColor="#777" />

            <Text style={s.lbl}>Poids (facultatif, kg)</Text>
            <TextInput
              style={s.inp}
              value={poids}
              onChangeText={setPoids}
              placeholder="Poids en kg"
              placeholderTextColor="#777"
              keyboardType="numeric"
            />

            <Text style={s.lbl}>Ceinture</Text>
            <View style={s.picker}>
              <Picker selectedValue={ceinture} onValueChange={setCeinture} dropdownIconColor="#000" style={{ color:'#000' }}>
                <Picker.Item label="— choisir —" value="" />
                {ceintures.map(c => <Picker.Item key={c} label={c} value={c} />)}
              </Picker>
            </View>

            <Text style={{color:'#777', fontSize:12}}>// ...existing code...</Text>

            {/* Checkboxes */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 20, marginBottom: 24 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsCompetiteur(v => !v)}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b40a0aff', backgroundColor: isCompetiteur ? '#b40a0aff' : '#18181b', marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                  {isCompetiteur && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ color: '#fff', fontSize: 13 }}>Compétition</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsEtudiant(v => !v)}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b40a0aff', backgroundColor: isEtudiant ? '#b40a0aff' : '#18181b', marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                  {isEtudiant && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ color: '#fff', fontSize: 13 }}>Étudiant</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setIsRenouvellement(v => !v)}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b40a0aff', backgroundColor: isRenouvellement ? '#b40a0aff' : '#18181b', marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                  {isRenouvellement && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ color: '#fff', fontSize: 13 }}>Renouvellement</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} onPress={() => setIsAutorisationDepartSeul(v => !v)}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b40a0aff', backgroundColor: isAutorisationDepartSeul ? '#b40a0aff' : '#18181b', marginTop: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  {isAutorisationDepartSeul && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ color: '#fff', fontSize: 13, flexShrink: 1, flexWrap: 'wrap' }}>Je n'autorise pas mon enfant à partir seul{'\n'}(ne concerne que les élèves du cours KIDS ou WARRIORS).</Text>
              </TouchableOpacity>
            </View>

            {/* Règlement intérieur - REQUIRED */}
            <View style={{ marginTop: 24, marginBottom: 24, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#b40a0a' }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} onPress={() => setIsReglementLu(v => !v)}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b40a0aff', backgroundColor: isReglementLu ? '#b40a0aff' : '#18181b', marginTop: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  {isReglementLu && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Règlement intérieur <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <Pressable onPress={() => Linking.openURL('https://cfsd91.com/reglement-interieur-du-cfsd91/')}>
                    <Text style={{ color: '#3b82f6', fontSize: 12, textDecorationLine: 'underline' }}>https://cfsd91.com/reglement-interieur-du-cfsd91/</Text>
                  </Pressable>
                  <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 6 }}>Je certifie avoir lu et accepté le règlement intérieur du CFSD91.</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Photo preview and delete */}
            {photo ? (
              <View style={{ flexDirection:'row', gap:10, alignItems:'center', marginTop: 16, marginBottom: 24 }}>
                <Image source={{ uri: photo.startsWith('data:image') ? photo : `data:image/jpeg;base64,${photo}` }} style={{ width:100, height:100, borderRadius:10, borderWidth:1, borderColor:'#64748b' }} />
                <TouchableOpacity style={[s.btn,{backgroundColor:'#334155'}]} onPress={()=>setPhoto('')}><Text style={s.btnTx}>🗑️ Supprimer</Text></TouchableOpacity>
              </View>
            ) : null}

            {loading && <ActivityIndicator style={{ marginTop: 16, marginBottom: 24 }} />}

            <TouchableOpacity
              onPress={onSubmit}
              disabled={submitting}
              accessibilityLabel="Envoyer inscription"
              style={{ backgroundColor: submitting ? '#7f1d1d' : '#b40a0a', paddingVertical: 14, borderRadius: 10, marginTop: 8, marginBottom: 8, alignItems: 'center', opacity: submitting ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{submitting ? 'Envoi en cours...' : '✉️  Envoyer mon inscription'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
  
const s = StyleSheet.create({
  card:{ backgroundColor:'#141414', borderColor:'#475569', borderWidth:1, borderRadius:12, padding:16, marginBottom:12 },
  h1:{ color:'#fff', fontSize:18, fontWeight:'700', marginBottom:6 },
  muted:{ color:'#cbd5e1' },
  row:{ flexDirection:'row', gap:10, justifyContent:'center' },
  row2:{ flexDirection:'row', gap:10 },
  col:{ flex:1 },
  lbl:{ color:'#e5e7eb', fontSize:12, marginTop:10, marginBottom:4 },
  inp:{
    borderWidth:1,
    borderColor:'#64748b',
    borderRadius:10,
    paddingHorizontal:12,
    paddingVertical:10,
    color: INPUT_TEXT_COLOR,
    backgroundColor: INPUT_BG_COLOR,
    height:44,
  },
  picker:{ borderWidth:1, borderColor:'#64748b', borderRadius:10, overflow:'hidden', backgroundColor: INPUT_BG_COLOR, height:56, justifyContent:'center' },
  btn:{ backgroundColor:'#b40a0aff', paddingVertical:12, paddingHorizontal:12, borderRadius:10 },
  btnTx:{ color:'#fff', fontWeight:'600', fontSize: 14 },
});

