import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PersonCard({ person, onPress }) {
  const isPending = person.synced === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {person.full_name}
        </Text>
        {isPending ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending Sync</Text>
          </View>
        ) : (
          <View style={styles.syncedBadge}>
            <Text style={styles.syncedBadgeText}>Synced</Text>
          </View>
        )}
      </View>

      <Text style={styles.phone}>📞 {person.phone || 'No phone number'}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Ward:</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {person.ward_name || '—'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>PU:</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {person.polling_unit_name || '—'}
          </Text>
        </View>
      </View>

      {person.voter_card_number ? (
        <Text style={styles.voterCard} numberOfLines={1}>
          VIN: {person.voter_card_number}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingBadgeText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  syncedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  syncedBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    flexShrink: 1,
  },
  voterCard: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    fontFamily: 'monospace',
  },
});
