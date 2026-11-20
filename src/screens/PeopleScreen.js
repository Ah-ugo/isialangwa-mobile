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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SearchNormal1, UserAdd, ArrowDown2 } from 'iconsax-react-native';
import { searchPeople, getWards, getPollingUnits } from '../db/database';
import { useSync } from '../context/SyncContext';
import PersonCard from '../components/PersonCard';
import SyncBanner from '../components/SyncBanner';
import { T } from '../theme/colors';

export default function PeopleScreen() {
  const navigation = useNavigation();
  const { isOnline, syncNow } = useSync();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wards, setWards] = useState([]);
  const [pollingUnits, setPollingUnits] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedPU, setSelectedPU] = useState(null);
  const [wardModalVisible, setWardModalVisible] = useState(false);
  const [puModalVisible, setPuModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [peopleList, wardsList] = await Promise.all([
        searchPeople(searchQuery, selectedWard?.id, selectedPU?.id),
        getWards(),
      ]);
      setPeople(peopleList);
      setWards(wardsList);

      if (selectedWard) {
        const pus = await getPollingUnits(selectedWard.id);
        setPollingUnits(pus);
      } else {
        setPollingUnits([]);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedWard, selectedPU]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectWard = async (ward) => {
    setSelectedWard(ward);
    setSelectedPU(null);
    setWardModalVisible(false);
    if (ward) {
      const pus = await getPollingUnits(ward.id);
      setPollingUnits(pus);
    } else {
      setPollingUnits([]);
    }
  };

  const handleSelectPU = (pu) => {
    setSelectedPU(pu);
    setPuModalVisible(false);
  };

  const clearFilters = () => {
    setSelectedWard(null);
    setSelectedPU(null);
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SyncBanner />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Directory</Text>
          <Text style={styles.subtitle}>{people.length} Constituents Registered</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PersonForm')}
          activeOpacity={0.85}
        >
          <UserAdd size={16} color="#ffffff" variant="Bold" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchNormal1 size={18} color={T.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or voter card..."
          placeholderTextColor={T.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedWard && styles.filterChipActive]}
          onPress={() => setWardModalVisible(true)}
        >
          <Text style={[styles.filterChipText, selectedWard && styles.filterChipTextActive]} numberOfLines={1}>
            {selectedWard ? selectedWard.name : 'All Wards'}
          </Text>
          <ArrowDown2 size={12} color={selectedWard ? T.primary : T.muted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedPU && styles.filterChipActive,
            !selectedWard && styles.filterChipDisabled,
          ]}
          onPress={() => selectedWard && setPuModalVisible(true)}
          disabled={!selectedWard}
        >
          <Text style={[styles.filterChipText, selectedPU && styles.filterChipTextActive]} numberOfLines={1}>
            {selectedPU ? selectedPU.name : 'All Polling Units'}
          </Text>
          <ArrowDown2 size={12} color={selectedPU ? T.primary : T.muted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {(selectedWard || selectedPU || searchQuery) ? (
          <TouchableOpacity style={styles.resetFilterBtn} onPress={clearFilters}>
            <Text style={styles.resetFilterText}>Reset</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* People List */}
      <FlatList
        data={people}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PersonCard
            person={item}
            onPress={() => navigation.navigate('PersonDetail', { personId: item.id })}
          />
        )}
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
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No registered members found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedWard
                  ? 'Try clearing filters or search query'
                  : 'Start registering members using the Register button'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Ward Selection Modal */}
      <Modal visible={wardModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ward</Text>
              <TouchableOpacity onPress={() => setWardModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalOption, !selectedWard && styles.modalOptionSelected]}
                onPress={() => handleSelectWard(null)}
              >
                <Text style={[styles.modalOptionText, !selectedWard && styles.modalOptionTextSelected]}>
                  All Wards
                </Text>
              </TouchableOpacity>
              {wards.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.modalOption, selectedWard?.id === w.id && styles.modalOptionSelected]}
                  onPress={() => handleSelectWard(w)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedWard?.id === w.id && styles.modalOptionTextSelected,
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

      {/* PU Selection Modal */}
      <Modal visible={puModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Polling Unit</Text>
              <TouchableOpacity onPress={() => setPuModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalOption, !selectedPU && styles.modalOptionSelected]}
                onPress={() => handleSelectPU(null)}
              >
                <Text style={[styles.modalOptionText, !selectedPU && styles.modalOptionTextSelected]}>
                  All Polling Units
                </Text>
              </TouchableOpacity>
              {pollingUnits.map((pu) => (
                <TouchableOpacity
                  key={pu.id}
                  style={[styles.modalOption, selectedPU?.id === pu.id && styles.modalOptionSelected]}
                  onPress={() => handleSelectPU(pu)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedPU?.id === pu.id && styles.modalOptionTextSelected,
                    ]}
                  >
                    {pu.name} {pu.code ? `(${pu.code})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 22, fontWeight: '800', color: T.text },
  subtitle: { fontSize: 12, color: T.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: T.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.text },
  clearSearchBtn: { padding: 4 },
  clearSearchText: { color: T.muted, fontSize: 14, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { borderColor: T.primary, backgroundColor: T.primaryLight },
  filterChipDisabled: { backgroundColor: T.bg, opacity: 0.6 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: T.text },
  filterChipTextActive: { color: T.primary, fontWeight: '700' },
  resetFilterBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  resetFilterText: { color: T.danger, fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: T.muted, textAlign: 'center', maxWidth: 260 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(23,32,51,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: T.text },
  modalCloseText: { fontSize: 14, fontWeight: '700', color: T.primary },
  modalList: { padding: 12 },
  modalOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  modalOptionSelected: { backgroundColor: T.primaryLight },
  modalOptionText: { fontSize: 14, color: T.text },
  modalOptionTextSelected: { color: T.primary, fontWeight: '700' },
});
