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
import { searchPeople, getWards, getPollingUnits } from '../db/database';
import PersonCard from '../components/PersonCard';
import SyncBanner from '../components/SyncBanner';

export default function PeopleScreen() {
  const navigation = useNavigation();
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
        <Text style={styles.title}>Directory</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PersonForm')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Register</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, phone, voter card..."
          placeholderTextColor="#94a3b8"
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
            {selectedWard ? selectedWard.name : 'All Wards'} ▾
          </Text>
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
            {selectedPU ? selectedPU.name : 'All Polling Units'} ▾
          </Text>
        </TouchableOpacity>

        {(selectedWard || selectedPU || searchQuery) && (
          <TouchableOpacity style={styles.resetFilterBtn} onPress={clearFilters}>
            <Text style={styles.resetFilterText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>No records found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedWard
                  ? 'Try clearing filters or search queries'
                  : 'Start registering members using the + Register button'}
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

      {/* Polling Unit Selection Modal */}
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  addBtn: {
    backgroundColor: '#1a3a6b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  clearSearchText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  filterChipActive: {
    borderColor: '#1a3a6b',
    backgroundColor: '#eff6ff',
  },
  filterChipDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#1a3a6b' },
  resetFilterBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  resetFilterText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 260 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
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
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalCloseText: { fontSize: 15, fontWeight: '700', color: '#1a3a6b' },
  modalList: { padding: 12 },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionSelected: { backgroundColor: '#eff6ff' },
  modalOptionText: { fontSize: 15, color: '#334155' },
  modalOptionTextSelected: { color: '#1a3a6b', fontWeight: '700' },
});
