import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system';
import HeaderBar from '../../../components/header-bar';
import { API_CONFIG } from '../../../constants/config';
import { Eleve } from '../../../constants/types';
import { fetchEleves } from '../../../lib/api';

const s = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: '#000' },
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
	photo: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
	name: { color: '#b40a0a', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
	muted: { color: '#fff', fontSize: 16, marginBottom: 4 },
	mutedSmall: { color: '#aaa', fontSize: 14, marginBottom: 2 },
	input: { backgroundColor: '#111', color: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
	editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#b40a0a', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 16 },
	saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 12, marginRight: 8 },
	cancelButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#666', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 12 },
	buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6 },
	photoButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 8 },
});

export default function FicheEleve() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [eleve, setEleve] = useState<Eleve | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<any>({});
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const loadEleve = async () => {
			setLoading(true);
			setError('');
			try {
				const eleves = await fetchEleves();
				const found = eleves.find(e => String(e.id) === String(id));
				if (!found) throw new Error('Élève introuvable');
				setEleve(found);
				setEditData({
					photo: found.photo || '',
					telUrgence: found.telUrgence || '',
					telEleve: found.telEleve || '',
					email: found.email || '',
					adresse: found.adresse || '',
					licence: found.licence || '',
				});
			} catch (e: any) {
				setError(e?.message || 'Erreur chargement fiche');
				setEleve(null);
			} finally {
				setLoading(false);
			}
		};
		loadEleve();
	}, [id]);

	const handleChangePhoto = async () => {
		try {
			const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!perm.granted) {
				Alert.alert('Permission', "Autorise l'accès aux photos.");
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
				if (base64) setEditData({ ...editData, photo: base64 });
			} else if (uri) {
				const base64 = await FileSystemLegacy.readAsStringAsync(uri, { encoding: 'base64' });
				setEditData({ ...editData, photo: base64 });
			}
		} catch (e) {
			console.error('Error picking photo:', e);
			Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
		}
	};

	const handleSave = async () => {
		if (!eleve || !eleve.id) return;
		
		setIsSaving(true);
		try {
			const updateData = {
				id: eleve.id,
				photo: editData.photo.substring(0, 5000000),
				telUrgence: editData.telUrgence,
				telEleve: editData.telEleve,
				email: editData.email,
				adresse: editData.adresse,
				licence: editData.licence,
			};

			const response = await fetch('https://cfsd91.com/eleves.php', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-API-KEY': 'Mac131080',
				},
				body: JSON.stringify(updateData),
			});

			if (!response.ok) {
				throw new Error(`Erreur serveur: ${response.status}`);
			}

			const updated = { ...eleve, ...editData };
			setEleve(updated);

			const currentEleveData = await AsyncStorage.getItem('cfsd91_eleve_data');
			if (currentEleveData) {
				const current = JSON.parse(currentEleveData);
				if (String(current.id) === String(eleve.id)) {
					await AsyncStorage.setItem('cfsd91_eleve_data', JSON.stringify(updated));
				}
			}

			setIsEditing(false);
			router.back();
		} catch (e: any) {
			console.error('Save error:', e);
			Alert.alert('Erreur', e?.message || 'Impossible de mettre à jour le profil.');
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<View style={s.center}>
				<ActivityIndicator color="#b40a0a" />
				<Text style={{ color: '#fff', marginTop: 16 }}>Chargement…</Text>
			</View>
		);
	}
	if (error || !eleve) {
		return (
			<View style={s.center}>
				<Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{error || 'Élève introuvable'}</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: '#000', paddingTop: 56 }}>
			<HeaderBar
				title={`${eleve.prenom} ${eleve.nom}`}
				backgroundColor="#fff"
				titleColor="#000"
				iconBgColor="transparent"
				right={
					<TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
						<Ionicons name="arrow-back" size={22} color="#000" />
					</TouchableOpacity>
				}
			/>
			<ScrollView style={s.scroll} contentContainerStyle={{ padding: 24 }}>
				{editData.photo || eleve.photo ? (
					<Image source={{ uri: editData.photo.startsWith('data:image') ? editData.photo : `data:image/jpeg;base64,${editData.photo}` }} style={s.photo} />
				) : (
					<View style={[s.photo, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}> 
						<Ionicons name="person" size={60} color="#777" />
					</View>
				)}
				<Text style={[s.name, { color: '#b40a0a', fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }]}>{eleve.prenom?.toUpperCase()} {eleve.nom?.toUpperCase()}</Text>

				{isEditing ? (
					<View style={{ marginTop: 16 }}>
						<TouchableOpacity style={s.photoButton} onPress={handleChangePhoto}>
							<Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Changer la photo</Text>
						</TouchableOpacity>

						<Text style={{ color: '#fff', fontWeight: '600', marginTop: 16, marginBottom: 4 }}>Tél. d'urgence</Text>
						<TextInput
							style={s.input}
							value={editData.telUrgence}
							onChangeText={(text) => setEditData({ ...editData, telUrgence: text })}
							placeholder="06 12 34 56 78"
							placeholderTextColor="#666"
							inputMode="tel"
						/>

						<Text style={{ color: '#fff', fontWeight: '600', marginBottom: 4 }}>Tél. élève</Text>
						<TextInput
							style={s.input}
							value={editData.telEleve}
							onChangeText={(text) => setEditData({ ...editData, telEleve: text })}
							placeholder="06 12 34 56 78"
							placeholderTextColor="#666"
							inputMode="tel"
						/>

						<Text style={{ color: '#fff', fontWeight: '600', marginBottom: 4 }}>Email</Text>
						<TextInput
							style={s.input}
							value={editData.email}
							onChangeText={(text) => setEditData({ ...editData, email: text })}
							placeholder="email@example.com"
							placeholderTextColor="#666"
							inputMode="email"
						/>

						<Text style={{ color: '#fff', fontWeight: '600', marginBottom: 4 }}>Adresse</Text>
						<TextInput
							style={[s.input, { minHeight: 60 }]}
							value={editData.adresse}
							onChangeText={(text) => setEditData({ ...editData, adresse: text })}
							placeholder="Rue, Code Postal, Ville"
							placeholderTextColor="#666"
							multiline
						/>

						<Text style={{ color: '#fff', fontWeight: '600', marginBottom: 4 }}>Numéro de licence</Text>
						<TextInput
							style={s.input}
							value={editData.licence}
							onChangeText={(text) => setEditData({ ...editData, licence: text })}
							placeholder="Numéro de licence"
							placeholderTextColor="#666"
						/>

						<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
							<TouchableOpacity 
								style={s.saveButton} 
								onPress={handleSave}
								disabled={isSaving}
							>
								<Ionicons name="checkmark" size={18} color="#fff" />
								<Text style={s.buttonText}>{isSaving ? 'Sauvegarde...' : 'Enregistrer'}</Text>
							</TouchableOpacity>
							<TouchableOpacity 
								style={s.cancelButton} 
								onPress={() => setIsEditing(false)}
								disabled={isSaving}
							>
								<Ionicons name="close" size={18} color="#fff" />
								<Text style={s.buttonText}>Annuler</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : (
					<View>
						<View style={{ alignItems: 'center', marginBottom: 12 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
								<Ionicons name="document-text-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
								<Text style={[s.muted, { fontSize: 18 }]}>{eleve.discipline || 'Non spécifié'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="calendar" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Jour : {eleve.jour || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="id-card" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Licence : {eleve.licence || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="ribbon" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Ceinture : {eleve.ceinture || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="call" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Urgence: {eleve.telUrgence || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="phone-portrait" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Élève: {eleve.telEleve || '—'}</Text>
							</View>
							{!!eleve.email && (
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
									<Ionicons name="mail" size={18} color="#4ade80" style={{ marginRight: 8 }} />
									<Text style={[s.mutedSmall, { color: '#4ade80', fontSize: 16 }]}>{eleve.email}</Text>
								</View>
							)}
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="location" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Adresse : {eleve.adresse || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="calendar-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Naissance : {eleve.naissance || '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="barbell" size={18} color="#aaa" style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Poids : {eleve.poids != null ? eleve.poids : '—'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="checkmark-circle" size={18} color={eleve.combattant ? '#22c55e' : '#aaa'} style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Compétiteur : {eleve.combattant ? 'Oui' : 'Non'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="school" size={18} color={eleve.etudiant ? '#22c55e' : '#aaa'} style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Étudiant : {eleve.etudiant ? 'Oui' : 'Non'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="refresh" size={18} color={eleve.renouvellement ? '#22c55e' : '#aaa'} style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Renouvellement : {eleve.renouvellement ? 'Oui' : 'Non'}</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								<Ionicons name="log-out" size={18} color={eleve.autorisationDepartSeul ? '#22c55e' : '#aaa'} style={{ marginRight: 8 }} />
								<Text style={s.mutedSmall}>Autorisation de partir seul(e) : {eleve.autorisationDepartSeul ? 'Oui' : 'Non'}</Text>
							</View>
						</View>

						<TouchableOpacity style={s.editButton} onPress={() => setIsEditing(true)}>
							<Ionicons name="pencil" size={18} color="#fff" />
							<Text style={s.buttonText}>Modifier</Text>
						</TouchableOpacity>
					</View>
				)}
			</ScrollView>
		</View>
	);
}
