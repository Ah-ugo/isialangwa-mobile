import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getPersonById } from '../db/database';
import { format } from 'date-fns';

export default function PersonDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { personId } = route.params || {};
  const [person, setPerson] = useState(null);

  useEffect(() => {
    if (personId) {
      getPersonById(personId).then((data) => setPerson(data));
    }
  }, [personId]);

  if (!person) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    if (person.phone) {
      Linking.openURL(`tel:${person.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (person.phone) {
      const cleanPhone = person.phone.replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
      Linking.openURL(`https://wa.me/${intlPhone}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Person Details</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {person.image ? (
            <Image source={{ uri: person.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {person.full_name ? person.full_name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{person.full_name}</Text>
          <Text style={styles.phone}>{person.phone}</Text>

          <View style={styles.badgeRow}>
            {person.synced === 0 ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Server Sync</Text>
              </View>
            ) : (
              <View style={styles.syncedBadge}>
                <Text style={styles.syncedBadgeText}>Synced to Server</Text>
              </View>
            )}
            {person.preferred_contact && (
              <View style={styles.prefBadge}>
                <Text style={styles.prefBadgeText}>Prefers {person.preferred_contact}</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnCall} onPress={handleCall} activeOpacity={0.85}>
              <Text style={styles.actionBtnText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnWhatsApp}
              onPress={handleWhatsApp}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Electoral Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ward</Text>
            <Text style={styles.infoValue}>{person.ward_name || '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Polling Unit</Text>
            <Text style={styles.infoValue}>{person.polling_unit_name || '—'}</Text>
          </View>

          {person.voter_card_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Voter Card (VIN)</Text>
              <Text style={[styles.infoValue, styles.monospace]}>{person.voter_card_number}</Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{person.address || '—'}</Text>
          </View>

          {person.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{person.notes}</Text>
            </View>
          )}
        </View>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            Registered:{' '}
            {person.created_at
              ? format(new Date(person.created_at), 'PPP p')
              : 'Unknown'}
          </Text>
          <Text style={styles.metaText}>Local ID: {person.id}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backBtnText: { color: '#1a3a6b', fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  container: { padding: 16, paddingBottom: 32 },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a3a6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { color: '#ffffff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  phone: { fontSize: 15, color: '#475569', fontWeight: '500', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  syncedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedBadgeText: { color: '#15803d', fontSize: 12, fontWeight: '700' },
  prefBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prefBadgeText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtnCall: {
    flex: 1,
    backgroundColor: '#1a3a6b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', maxWidth: '60%' },
  monospace: { fontFamily: 'monospace' },
  metaContainer: { alignItems: 'center', marginTop: 8 },
  metaText: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
});
