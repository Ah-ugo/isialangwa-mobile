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
import { Camera, CloseCircle, ArrowDown2, TickCircle } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getWards,
  getPollingUnits,
  insertPerson,
  checkPhoneDuplicate,
} from '../db/database';
import { useSync } from '../context/SyncContext';
import { T } from '../theme/colors';

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
  const [consentGranted, setConsentGranted] = useState(true);

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
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Save local device URI — NO Cloudinary upload while offline
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
      Alert.alert('Validation Error', 'Please enter a valid phone number, e.g. 0803 123 4567');
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
      Alert.alert('Consent Required', 'You must verify person consent before saving this record');
      return;
    }

    try {
      setSubmitting(true);

      // Check duplicate against local SQLite database
      const dup = await checkPhoneDuplicate(cleanPhone);
      if (dup) {
        Alert.alert(
          'Duplicate Phone Warning',
          `This phone number already exists for "${dup.full_name}". Please verify the number.`
        );
        setSubmitting(false);
        return;
      }

      const localId = `person_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const personRecord = {
        id: localId,
        full_name: fullName.trim(),
        phone: cleanPhone,
        ward_id: ward.id,
        polling_unit_id: pollingUnit.id,
        address: address.trim() || null,
        notes: notes.trim() || null,
        preferred_contact: preferredContact,
        image: imageUri || null, // Stored strictly locally without calling Cloudinary
        voter_card_number: voterCardNumber.trim() || null,
        contactable: 1,
      };

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

      // 1. Save to SQLite + 2. Queue for upload
      await insertPerson(personRecord, serverPayload);
      await refreshPendingCount();

      // 3. Attempt sync if online
      if (isOnline) {
        syncNow();
      }

      Alert.alert(
        'Registration Saved',
        isOnline
          ? 'Constituent saved and synced to the directory.'
          : 'Constituent saved locally. Photo and details are stored offline and will sync when online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save record: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <CloseCircle size={24} color={T.muted} />
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
        {/* Photo Picker — Offline First (no Cloudinary when offline) */}
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={26} color={T.primary} variant="Bold" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.photoSubtext}>Photos are saved locally and synced when online</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chukwuemeka Okafor"
            placeholderTextColor={T.muted}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0803 123 4567"
            placeholderTextColor={T.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Preferred Contact Channel</Text>
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

        {/* Electoral Ward & Polling Unit */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Electoral Location</Text>

          <Text style={styles.label}>Ward *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setWardModalVisible(true)}
          >
            <Text style={[styles.pickerBtnText, !ward && styles.placeholderText]}>
              {ward ? `${ward.name} ${ward.code ? `(${ward.code})` : ''}` : 'Select Ward...'}
            </Text>
            <ArrowDown2 size={16} color={T.muted} />
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
            <ArrowDown2 size={16} color={T.muted} />
          </TouchableOpacity>

          <Text style={styles.label}>Voter Identification Number (VIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 90F5B0123456789"
            placeholderTextColor={T.muted}
            value={voterCardNumber}
            onChangeText={setVoterCardNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Location & Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Location & Notes</Text>

          <Text style={styles.label}>Residential Address / Village</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Umueze Village, Isiala Ngwa South"
            placeholderTextColor={T.muted}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional notes about constituent"
            placeholderTextColor={T.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Consent Card */}
        <View style={styles.consentCard}>
          <View style={styles.consentRow}>
            <Switch
              value={consentGranted}
              onValueChange={setConsentGranted}
              trackColor={{ false: T.border, true: T.primary }}
              thumbColor="#ffffff"
            />
            <Text style={styles.consentText}>
              I confirm the constituent gave consent for their details to be collected and recorded for
              directory communication.
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
  safe: { flex: 1, backgroundColor: T.bg },
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
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: T.text },
  saveBtn: {
    backgroundColor: T.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  container: { padding: 16, paddingBottom: 40 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photoPicker: {
    width: 86,
    height: 86,
    borderRadius: 16,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoText: { fontSize: 11, color: T.primary, marginTop: 4, fontWeight: '700' },
  photoSubtext: { fontSize: 11, color: T.muted, marginTop: 6 },
  formSection: {
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
  sectionHeading: { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 6 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text,
    marginBottom: 14,
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  radioButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: { borderColor: T.primary, backgroundColor: T.primaryLight },
  radioText: { fontSize: 13, color: T.muted, fontWeight: '600' },
  radioTextActive: { color: T.primary, fontWeight: '700' },
  pickerBtn: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerBtnDisabled: { opacity: 0.5 },
  pickerBtnText: { fontSize: 14, color: T.text },
  placeholderText: { color: T.muted },
  consentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: T.primary,
    borderWidth: 1,
    borderColor: T.border,
  },
  consentRow: { flexDirection: 'row', alignItems: 'center' },
  consentText: {
    fontSize: 13,
    color: T.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
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
