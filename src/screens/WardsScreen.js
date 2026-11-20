import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, Add, SearchNormal1, Location, People } from 'iconsax-react-native';
import { getWardsWithCounts } from '../db/database';
import { useSync } from '../context/SyncContext';
import SyncBanner from '../components/SyncBanner';
import WardFormModal from '../components/WardFormModal';
import { T } from '../theme/colors';

export default function WardsScreen({ navigation }) {
  const { isOnline, syncNow } = useSync();
  const [wards, setWards] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWardsWithCounts();
      setWards(data);
    } catch (err) {
      console.error('Error loading wards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredWards = wards.filter(
    (w) =>
      w.name.toLowerCase().includes(query.toLowerCase()) ||
      (w.code && w.code.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SyncBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wards</Text>
          <Text style={styles.headerSubtitle}>Isialangwa South LGA ({wards.length} Wards)</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Add size={16} color="#ffffff" variant="Bold" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Ward</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <SearchNormal1 size={18} color={T.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ward by name or code..."
          placeholderTextColor={T.muted}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Ward Cards List */}
      <FlatList
        data={filteredWards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              if (isOnline) await syncNow();
              await loadData();
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.wardIconBox}>
                <Map size={20} color={T.brandRed} variant="Bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wardName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.code ? <Text style={styles.wardCode}>Code: {item.code}</Text> : null}
              </View>
              {item.synced === 0 && (
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>Local</Text>
                </View>
              )}
            </View>

            {item.description ? (
              <Text style={styles.wardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Location size={14} color={T.primary} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={styles.statText}>
                  {item.polling_unit_count || 0} Polling Unit{(item.polling_unit_count || 0) !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={[styles.statChip, styles.statChipPeople]}>
                <People size={14} color={T.brandBlue} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={[styles.statText, { color: T.text }]}>
                  {item.people_count || 0} Registered
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <WardFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T.text },
  headerSubtitle: { fontSize: 12, color: T.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: T.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.text },
  clearText: { color: T.muted, fontSize: 14, paddingHorizontal: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  wardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  wardName: { fontSize: 15, fontWeight: '700', color: T.text },
  wardCode: { fontSize: 12, color: T.muted, marginTop: 1 },
  wardDescription: { fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 16 },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pendingPillText: { fontSize: 10, fontWeight: '700', color: T.warning },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statChipPeople: { backgroundColor: '#E0F2FE' },
  statText: { fontSize: 12, fontWeight: '600', color: T.primary },
});
