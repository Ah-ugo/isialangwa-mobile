import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Add, CloseCircle } from 'iconsax-react-native';
import { insertWard } from '../db/database';
import { useSync } from '../context/SyncContext';
import { T } from '../theme/colors';

export default function WardFormModal({ visible, onClose, onSaved }) {
  const { isOnline, syncNow, refreshPendingCount } = useSync();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the ward name');
      return;
    }

    try {
      setSaving(true);
      await insertWard({
        name: name.trim(),
        code: code.trim() || undefined,
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
      Alert.alert('Ward Created', 'Ward has been saved locally and will sync to the server.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save ward');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Ward</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseCircle size={22} color={T.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Ward Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. WARD 1 – Amaise / Amaise Anaba"
            placeholderTextColor={T.muted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.label}>Ward Code (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. W01"
            placeholderTextColor={T.muted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief notes about this ward"
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
                  <Text style={styles.saveText}>Save Ward</Text>
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
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text,
    backgroundColor: T.bg,
    marginBottom: 14,
  },
  textArea: {
    height: 60,
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
