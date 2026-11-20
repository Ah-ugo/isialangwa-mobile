import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Location, Add, SearchNormal1, People, ArrowDown2 } from 'iconsax-react-native';
import { getPollingUnits, getWards } from '../db/database';
import { useSync } from '../context/SyncContext';
import SyncBanner from '../components/SyncBanner';
import PollingUnitFormModal from '../components/PollingUnitFormModal';
import { T } from '../theme/colors';

export default function PollingUnitsScreen() {
  const { isOnline, syncNow } = useSync();
  const [units, setUnits] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [wardFilterModalVisible, setWardFilterModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uList, wList] = await Promise.all([
        getPollingUnits(selectedWard?.id, query),
        getWards(),
      ]);
      setUnits(uList);
      setWards(wList);
    } catch (err) {
      console.error('Error loading polling units:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWard, query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SyncBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Polling Units</Text>
          <Text style={styles.headerSubtitle}>
            {units.length} Unit{units.length !== 1 ? 's' : ''}{' '}
            {selectedWard ? `in ${selectedWard.code || selectedWard.name}` : 'across all wards'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Add size={16} color="#ffffff" variant="Bold" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Unit</Text>
        </TouchableOpacity>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <SearchNormal1 size={16} color={T.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by unit name or code..."
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

        <TouchableOpacity
          style={[styles.wardFilterBtn, selectedWard && styles.wardFilterBtnActive]}
          onPress={() => setWardFilterModalVisible(true)}
        >
          <Text
            style={[styles.wardFilterBtnText, selectedWard && styles.wardFilterBtnTextActive]}
            numberOfLines={1}
          >
            {selectedWard ? selectedWard.name : 'All Wards'}
          </Text>
          <ArrowDown2 size={14} color={selectedWard ? T.primary : T.muted} />
        </TouchableOpacity>
      </View>

      {/* Units List */}
      <FlatList
        data={units}
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
              <View style={styles.iconBox}>
                <Location size={18} color={T.brandBlue} variant="Bold" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.unitName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.badgeRow}>
                  {item.code ? <Text style={styles.codeText}>Code: {item.code}</Text> : null}
                  {item.ward_name ? (
                    <Text style={styles.wardTag} numberOfLines={1}>
                      • {item.ward_name}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.countBadge}>
                <People size={13} color={T.primary} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={styles.countText}>{item.people_count || 0}</Text>
              </View>
            </View>

            {item.description ? (
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Ward Filter Modal */}
      <Modal visible={wardFilterModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Ward</Text>
              <TouchableOpacity onPress={() => setWardFilterModalVisible(false)}>
                <Text style={styles.modalDone}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <TouchableOpacity
                style={[styles.modalItem, !selectedWard && styles.modalItemActive]}
                onPress={() => {
                  setSelectedWard(null);
                  setWardFilterModalVisible(false);
                }}
              >
                <Text style={[styles.modalItemText, !selectedWard && styles.modalItemTextActive]}>
                  All Wards (Show All)
                </Text>
              </TouchableOpacity>

              {wards.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.modalItem, selectedWard?.id === w.id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedWard(w);
                    setWardFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedWard?.id === w.id && styles.modalItemTextActive,
                    ]}
                  >
                    {w.name} {w.code ? `(${w.code})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PollingUnitFormModal
        visible={modalVisible}
        defaultWardId={selectedWard?.id}
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
  filterSection: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.text },
  clearText: { color: T.muted, fontSize: 14, paddingHorizontal: 4 },
  wardFilterBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  wardFilterBtnActive: { borderColor: T.primary, backgroundColor: T.primaryLight },
  wardFilterBtnText: { fontSize: 13, color: T.text, fontWeight: '500', flex: 1, marginRight: 8 },
  wardFilterBtnTextActive: { color: T.primary, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  unitName: { fontSize: 14, fontWeight: '700', color: T.text },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  codeText: { fontSize: 11, color: T.muted, fontWeight: '600' },
  wardTag: { fontSize: 11, color: T.muted, marginLeft: 4, flexShrink: 1 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: { fontSize: 12, fontWeight: '700', color: T.primary },
  descriptionText: { fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(23,32,51,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: T.text },
  modalDone: { fontSize: 14, fontWeight: '700', color: T.primary },
  modalItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  modalItemActive: { backgroundColor: T.primaryLight },
  modalItemText: { fontSize: 14, color: T.text },
  modalItemTextActive: { color: T.primary, fontWeight: '700' },
});
