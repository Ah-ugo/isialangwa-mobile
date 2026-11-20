import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  getWards,
  getPollingUnits,
  insertPerson,
  insertPendingUpload,
  checkPhoneDuplicate,
} from '../db/database';
import { useSync } from '../context/SyncContext';

export default function PersonFormScreen() {
  const navigation = useNavigation();
  const { refreshPendingCount, isOnline, syncNow } = useSync();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState(null);
  const [pollingUnit, setPollingUnit] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredContact, setPreferredContact] = useState('call');
  const [voterCardNumber, setVoterCardNumber] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [consentGranted, setConsentGranted] = useState(false);

  const [wards, setWards] = useState([]);
  const [pollingUnits, setPollingUnits] = useState([]);
  const [wardModalVisible, setWardModalVisible] = useState(false);
  const [puModalVisible, setPuModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getWards().then((data) => setWards(data));
  }, []);

  const handleSelectWard = async (w) => {
    setWard(w);
    setPollingUnit(null);
    setWardModalVisible(false);
    if (w) {
      const pus = await getPollingUnits(w.id);
      setPollingUnits(pus);
    } else {
      setPollingUnits([]);
    }
  };

  const handleSelectPU = (pu) => {
    setPollingUnit(pu);
    setPuModalVisible(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Notice', 'Could not open image library: ' + err.message);
    }
  };

  const normalizePhone = (num) => {
    let clean = num.replace(/[^0-9+]/g, '');
    if (clean.startsWith('+234')) clean = '0' + clean.slice(4);
    if (clean.startsWith('234')) clean = '0' + clean.slice(3);
    return clean;
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required');
      return;
    }
    const cleanPhone = normalizePhone(phone.trim());
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }
    if (!ward) {
      Alert.alert('Validation Error', 'Please select a ward');
      return;
    }
    if (!pollingUnit) {
      Alert.alert('Validation Error', 'Please select a polling unit');
      return;
    }
    if (!consentGranted) {
      Alert.alert('Consent Required', 'You must verify person consent before registration');
      return;
    }

    try {
      setSubmitting(true);

      // Check duplicate locally
      const isDuplicate = await checkPhoneDuplicate(cleanPhone);
      if (isDuplicate) {
        Alert.alert(
          'Duplicate Warning',
          'A person with this phone number already exists in your local records.'
        );
        setSubmitting(false);
        return;
      }

      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const personRecord = {
        id: localId,
        full_name: fullName.trim(),
        phone: cleanPhone,
        ward_id: ward.id,
        polling_unit_id: pollingUnit.id,
        address: address.trim() || null,
        notes: notes.trim() || null,
        preferred_contact: preferredContact,
        image: imageUri || null,
        voter_card_number: voterCardNumber.trim() || null,
        contactable: 1,
      };

      // 1. Insert into local SQLite
      await insertPerson(personRecord);

      // 2. Queue for server sync
      const serverPayload = {
        fullName: fullName.trim(),
        phone: cleanPhone,
        wardId: ward.id,
        pollingUnitId: pollingUnit.id,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        preferredContact,
        voterCardNumber: voterCardNumber.trim() || undefined,
        consent: {
          granted: true,
          lawfulBasis: 'consent',
          purpose: 'Community directory and engagement',
        },
      };

      await insertPendingUpload(localId, serverPayload);
      await refreshPendingCount();

      // 3. Attempt immediate sync in background if online
      if (isOnline) {
        syncNow();
      }

      Alert.alert(
        'Registration Saved',
        isOnline
          ? 'Record saved and syncing to server.'
          : 'Record saved locally. It will automatically sync when online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save person: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Person</Text>
        <TouchableOpacity
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Photo Picker */}
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chukwuemeka Okafor"
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0803 123 4567"
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Preferred Contact</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, preferredContact === 'call' && styles.radioButtonActive]}
              onPress={() => setPreferredContact('call')}
            >
              <Text
                style={[styles.radioText, preferredContact === 'call' && styles.radioTextActive]}
              >
                Phone Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                preferredContact === 'whatsapp' && styles.radioButtonActive,
              ]}
              onPress={() => setPreferredContact('whatsapp')}
            >
              <Text
                style={[styles.radioText, preferredContact === 'whatsapp' && styles.radioTextActive]}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Electoral Area */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Ward & Polling Unit</Text>

          <Text style={styles.label}>Ward *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setWardModalVisible(true)}
          >
            <Text style={[styles.pickerBtnText, !ward && styles.placeholderText]}>
              {ward ? `${ward.name} ${ward.code ? `(${ward.code})` : ''}` : 'Select Ward...'}
            </Text>
            <Text style={styles.pickerArrow}>▾</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Polling Unit *</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, !ward && styles.pickerBtnDisabled]}
            onPress={() => ward && setPuModalVisible(true)}
            disabled={!ward}
          >
            <Text style={[styles.pickerBtnText, !pollingUnit && styles.placeholderText]}>
              {pollingUnit
                ? `${pollingUnit.name} ${pollingUnit.code ? `(${pollingUnit.code})` : ''}`
                : ward
                ? 'Select Polling Unit...'
                : 'Select Ward First'}
            </Text>
            <Text style={styles.pickerArrow}>▾</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Voter Identification Number (VIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 90F5B0123456789"
            placeholderTextColor="#94a3b8"
            value={voterCardNumber}
            onChangeText={setVoterCardNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Address & Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Additional Details</Text>

          <Text style={styles.label}>Address / Village</Text>
          <TextInput
            style={styles.input}
            placeholder="Residential address"
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any notable details or remarks"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Consent Section */}
        <View style={styles.consentCard}>
          <View style={styles.consentRow}>
            <Switch
              value={consentGranted}
              onValueChange={setConsentGranted}
              trackColor={{ false: '#cbd5e1', true: '#1a3a6b' }}
              thumbColor="#ffffff"
            />
            <Text style={styles.consentText}>
              I confirm the person gave consent for their details to be collected and processed for
              directory outreach.
            </Text>
          </View>
        </View>
      </ScrollView>

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
              {wards.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.modalOption, ward?.id === w.id && styles.modalOptionSelected]}
                  onPress={() => handleSelectWard(w)}
                >
                  <Text
                    style={[styles.modalOptionText, ward?.id === w.id && styles.modalOptionTextSelected]}
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
              {pollingUnits.map((pu) => (
                <TouchableOpacity
                  key={pu.id}
                  style={[styles.modalOption, pollingUnit?.id === pu.id && styles.modalOptionSelected]}
                  onPress={() => handleSelectPU(pu)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      pollingUnit?.id === pu.id && styles.modalOptionTextSelected,
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#64748b', fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  saveBtn: {
    backgroundColor: '#1a3a6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  container: { padding: 16, paddingBottom: 40 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photoPicker: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoIcon: { fontSize: 28 },
  photoText: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  formSection: {
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
  sectionHeading: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14,
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  radioButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: { borderColor: '#1a3a6b', backgroundColor: '#eff6ff' },
  radioText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  radioTextActive: { color: '#1a3a6b', fontWeight: '700' },
  pickerBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerBtnDisabled: { opacity: 0.5 },
  pickerBtnText: { fontSize: 14, color: '#0f172a' },
  placeholderText: { color: '#94a3b8' },
  pickerArrow: { fontSize: 16, color: '#64748b' },
  consentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1a3a6b',
  },
  consentRow: { flexDirection: 'row', alignItems: 'center' },
  consentText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
  modalOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  modalOptionSelected: { backgroundColor: '#eff6ff' },
  modalOptionText: { fontSize: 15, color: '#334155' },
  modalOptionTextSelected: { color: '#1a3a6b', fontWeight: '700' },
});
