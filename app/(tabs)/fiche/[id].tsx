import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import HeaderBar from '../../../components/header-bar';

const REMOTE_JSON_URL = 'https://cfsd91.com/eleves.php';

type Eleve = {
	id: string;
	nom: string;
	prenom: string;
	discipline?: string;
	licence?: string;
	age?: number;
	telUrgence?: string;
	telEleve?: string;
	email?: string;
	photo?: string;
	jour?: string;
	ceinture?: string;
	adresse?: string;
	naissance?: string;
	poids?: number;
	combattant?: boolean;
	etudiant?: boolean;
	renouvellement?: boolean;
};

const s = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: '#000' },
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
	photo: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
	name: { color: '#b40a0a', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
	muted: { color: '#fff', fontSize: 16, marginBottom: 4 },
	mutedSmall: { color: '#aaa', fontSize: 14, marginBottom: 2 },
	homeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#06b6d4', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
	homeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default function FicheEleve() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [eleve, setEleve] = useState<Eleve | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchEleves = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await fetch(REMOTE_JSON_URL, {
					cache: 'no-store',
					headers: { 'X-API-KEY': 'KEYOFSQUAD01@' }
				});
				if (!res.ok) throw new Error('Erreur chargement liste élèves');
				const data = await res.json();
				const arr: Eleve[] = Array.isArray(data) ? data : (data?.data || data?.eleves || data?.results || []);
				const found = arr.find(e => String(e.id) === String(id));
				if (!found) throw new Error('Élève introuvable');
				setEleve(found);
			} catch (e: any) {
				setError(e?.message || 'Erreur chargement fiche');
				setEleve(null);
			} finally {
				setLoading(false);
			}
		};
		fetchEleves();
	}, [id]);

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
					<TouchableOpacity onPress={() => router.push('/')} style={{ padding: 6 }}>
						<Ionicons name="home" size={22} color="#000" />
					</TouchableOpacity>
				}
			/>
			<ScrollView style={s.scroll} contentContainerStyle={{ padding: 24 }}>
				{eleve.photo ? (
					<Image source={{ uri: eleve.photo.startsWith('data:image') ? eleve.photo : `data:image/jpeg;base64,${eleve.photo}` }} style={s.photo} />
				) : (
					<View style={[s.photo, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}> 
						<Ionicons name="person" size={60} color="#777" />
					</View>
				)}
				<Text style={[s.name, { color: '#b40a0a', fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }]}>{eleve.prenom?.toUpperCase()} {eleve.nom?.toUpperCase()}</Text>
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
						<Text style={s.mutedSmall}>U: {eleve.telUrgence || '—'}</Text>
					</View>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
						<Ionicons name="phone-portrait" size={18} color="#aaa" style={{ marginRight: 8 }} />
						<Text style={s.mutedSmall}>E: {eleve.telEleve || '—'}</Text>
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
				</View>
			</ScrollView>
		</View>
	);
}
