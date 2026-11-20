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
import {
  Call,
  Message,
  ArrowLeft,
  Map,
  Location,
  Card,
  Clock,
  TickCircle,
} from 'iconsax-react-native';
import { getPersonById } from '../db/database';
import { format } from 'date-fns';
import { T } from '../theme/colors';

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
          <Text style={styles.loadingText}>Loading constituent profile...</Text>
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

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={T.text} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Constituent Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {person.image && person.image.startsWith('http') ? (
            <Image source={{ uri: person.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{getInitials(person.full_name)}</Text>
            </View>
          )}

          <Text style={styles.name}>{person.full_name}</Text>
          <Text style={styles.phone}>{person.phone}</Text>

          <View style={styles.badgeRow}>
            {person.synced === 0 ? (
              <View style={styles.pendingBadge}>
                <Clock size={12} color={T.warning} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={styles.pendingBadgeText}>Offline / Pending Sync</Text>
              </View>
            ) : (
              <View style={styles.syncedBadge}>
                <TickCircle size={12} color={T.primary} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={styles.syncedBadgeText}>Synced to Server</Text>
              </View>
            )}

            {person.preferred_contact ? (
              <View style={styles.prefBadge}>
                <Text style={styles.prefBadgeText}>Prefers {person.preferred_contact}</Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnCall} onPress={handleCall} activeOpacity={0.85}>
              <Call size={16} color="#ffffff" variant="Bold" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Phone Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnWhatsApp}
              onPress={handleWhatsApp}
              activeOpacity={0.85}
            >
              <Message size={16} color="#ffffff" variant="Bold" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Electoral Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Electoral Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.labelCol}>
              <Map size={16} color={T.brandRed} variant="Bold" style={{ marginRight: 6 }} />
              <Text style={styles.infoLabel}>Ward</Text>
            </View>
            <Text style={styles.infoValue}>{person.ward_name || '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.labelCol}>
              <Location size={16} color={T.brandBlue} variant="Bold" style={{ marginRight: 6 }} />
              <Text style={styles.infoLabel}>Polling Unit</Text>
            </View>
            <Text style={styles.infoValue}>{person.polling_unit_name || '—'}</Text>
          </View>

          {person.voter_card_number ? (
            <View style={styles.infoRow}>
              <View style={styles.labelCol}>
                <Card size={16} color={T.primary} variant="Bold" style={{ marginRight: 6 }} />
                <Text style={styles.infoLabel}>Voter Card (VIN)</Text>
              </View>
              <Text style={[styles.infoValue, styles.monospace]}>{person.voter_card_number}</Text>
            </View>
          ) : null}
        </View>

        {/* Location & Notes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location & Notes</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address / Village</Text>
            <Text style={styles.infoValue}>{person.address || '—'}</Text>
          </View>

          {person.notes ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{person.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Registration Meta */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            Registered:{' '}
            {person.created_at ? format(new Date(person.created_at), 'PPP p') : 'Recently'}
          </Text>
          <Text style={styles.metaText}>Record ID: {person.id}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: T.muted, fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: '#ffffff',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  backBtnText: { color: T.text, fontSize: 14, fontWeight: '700', marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  container: { padding: 16, paddingBottom: 32 },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: { width: 76, height: 76, borderRadius: 18, marginBottom: 12 },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { color: T.primary, fontSize: 28, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: T.text, marginBottom: 3 },
  phone: { fontSize: 14, color: T.muted, fontWeight: '500', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: { color: T.warning, fontSize: 12, fontWeight: '700' },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedBadgeText: { color: T.primary, fontSize: 12, fontWeight: '700' },
  prefBadge: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prefBadgeText: { color: T.text, fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  actionBtnCall: {
    flex: 1,
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWhatsApp: {
    flex: 1,
    backgroundColor: T.whatsapp,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  labelCol: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: T.muted, fontWeight: '500' },
  infoValue: { fontSize: 13, color: T.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  monospace: { fontFamily: 'monospace' },
  metaContainer: { alignItems: 'center', marginTop: 12 },
  metaText: { fontSize: 11, color: T.muted, marginBottom: 3 },
});
