import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Add, CloseCircle, ArrowDown2 } from 'iconsax-react-native';
import { getWards, insertPollingUnit } from '../db/database';
import { useSync } from '../context/SyncContext';
import { T } from '../theme/colors';

export default function PollingUnitFormModal({ visible, defaultWardId, onClose, onSaved }) {
  const { isOnline, syncNow, refreshPendingCount } = useSync();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [wardId, setWardId] = useState(defaultWardId || '');
  const [wards, setWards] = useState([]);
  const [wardDropdownVisible, setWardDropdownVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      getWards().then((data) => {
        setWards(data);
        if (defaultWardId) {
          setWardId(defaultWardId);
        } else if (data.length > 0 && !wardId) {
          setWardId(data[0].id);
        }
      });
    }
  }, [visible, defaultWardId]);

  const selectedWard = wards.find((w) => w.id === wardId);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the polling unit name');
      return;
    }
    if (!wardId) {
      Alert.alert('Required Field', 'Please select a parent ward');
      return;
    }

    try {
      setSaving(true);
      await insertPollingUnit({
        name: name.trim(),
        code: code.trim() || undefined,
        wardId,
        description: description.trim() || undefined,
      });

      await refreshPendingCount();
      if (isOnline) {
        syncNow();
      }

      setName('');
      setCode('');
      setDescription('');
      onSaved?.();
      onClose();
      Alert.alert('Polling Unit Created', 'Polling unit saved locally and will sync to the server.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save polling unit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Polling Unit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseCircle size={22} color={T.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Parent Ward *</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setWardDropdownVisible(!wardDropdownVisible)}
          >
            <Text style={styles.selectBtnText} numberOfLines={1}>
              {selectedWard ? `${selectedWard.name} (${selectedWard.code || 'Ward'})` : 'Select Ward'}
            </Text>
            <ArrowDown2 size={16} color={T.muted} />
          </TouchableOpacity>

          {wardDropdownVisible && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                {wards.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.dropdownItem, w.id === wardId && styles.dropdownItemActive]}
                    onPress={() => {
                      setWardId(w.id);
                      setWardDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[styles.dropdownText, w.id === wardId && styles.dropdownTextActive]}
                      numberOfLines={1}
                    >
                      {w.name} {w.code ? `(${w.code})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Polling Unit Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Umuagharata Village Hall"
            placeholderTextColor={T.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Code (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 001"
            placeholderTextColor={T.muted}
            value={code}
            onChangeText={setCode}
          />

          <Text style={styles.label}>Location Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Landmarks, junction, or specific building"
            placeholderTextColor={T.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Add size={16} color="#ffffff" variant="Bold" style={{ marginRight: 6 }} />
                  <Text style={styles.saveText}>Save Unit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: T.text,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: T.text,
    marginBottom: 6,
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: T.bg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectBtnText: {
    fontSize: 14,
    color: T.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  dropdownItemActive: {
    backgroundColor: T.primaryLight,
  },
  dropdownText: {
    fontSize: 13,
    color: T.text,
  },
  dropdownTextActive: {
    color: T.primary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text,
    backgroundColor: T.bg,
    marginBottom: 12,
  },
  textArea: {
    height: 56,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelText: {
    color: T.text,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
