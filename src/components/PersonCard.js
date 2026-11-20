import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Call, Message, TickCircle, Clock } from 'iconsax-react-native';
import { T } from '../theme/colors';

export default function PersonCard({ person, onPress }) {
  const isPending = person.synced === 0;

  const handleCall = () => {
    if (person.phone) Linking.openURL(`tel:${person.phone}`);
  };

  const handleWhatsApp = () => {
    if (person.phone) {
      const clean = person.phone.replace(/[^0-9]/g, '');
      const intl = clean.startsWith('0') ? '234' + clean.slice(1) : clean;
      Linking.openURL(`https://wa.me/${intl}`);
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.topRow}>
        {person.image && person.image.startsWith('http') ? (
          <Image source={{ uri: person.image }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(person.full_name)}</Text>
          </View>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {person.full_name}
            </Text>
            {isPending ? (
              <View style={styles.pendingBadge}>
                <Clock size={11} color={T.warning} variant="Bold" style={{ marginRight: 3 }} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            ) : (
              <View style={styles.syncedBadge}>
                <TickCircle size={11} color={T.success} variant="Bold" style={{ marginRight: 3 }} />
                <Text style={styles.syncedBadgeText}>Synced</Text>
              </View>
            )}
          </View>

          <Text style={styles.phone}>{person.phone}</Text>

          <View style={styles.chipRow}>
            {person.ward_name && (
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {person.ward_name}
                </Text>
              </View>
            )}
            {person.polling_unit_name && (
              <View style={[styles.chip, styles.chipLight]}>
                <Text style={[styles.chipText, styles.chipTextLight]} numberOfLines={1}>
                  {person.polling_unit_name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Action shortcuts */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
          <Call size={14} color={T.primary} variant="Bold" style={{ marginRight: 6 }} />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Message size={14} color="#ffffff" variant="Bold" style={{ marginRight: 6 }} />
          <Text style={styles.waBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  avatarText: {
    color: T.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    flex: 1,
    marginRight: 6,
  },
  phone: {
    fontSize: 13,
    color: T.muted,
    marginBottom: 6,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: T.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.border,
    maxWidth: '50%',
  },
  chipLight: {
    backgroundColor: '#ffffff',
  },
  chipText: {
    fontSize: 11,
    color: T.text,
    fontWeight: '500',
  },
  chipTextLight: {
    color: T.muted,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.warning,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  syncedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.bg,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.primaryLight,
    paddingVertical: 7,
    borderRadius: 8,
  },
  callBtnText: {
    color: T.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.whatsapp,
    paddingVertical: 7,
    borderRadius: 8,
  },
  waBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
