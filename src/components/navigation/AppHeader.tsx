import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { DrawerParamList } from '../../types/navigation';
import Card from '../common/Card';
import ModalSheet from '../modals/ModalSheet';
import { useNotifications } from '../../context/NotificationContext';

export interface AppHeaderProps {
  title?: string;
  showTitle?: boolean;
  showNotifications?: boolean;
  unreadCount?: number;
  onPressNotifications?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showTitle = false,
  showNotifications = true,
  unreadCount,
  onPressNotifications,
}) => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const { unreadCount: globalUnread, markAllAsRead } = useNotifications();
  const [notifVisible, setNotifVisible] = useState(false);

  const effectiveUnread = unreadCount !== undefined ? unreadCount : globalUnread;

  const handleOpenNotifications = () => {
    markAllAsRead(); // Syncs unread status globally across all screens
    if (onPressNotifications) {
      onPressNotifications();
    } else {
      setNotifVisible(true);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.left}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.iconBtn}
            accessibilityLabel="Open Navigation Drawer"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>
          {showTitle && !!title && (
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.right}>
          {/* Notification Bell */}
          {showNotifications && (
            <TouchableOpacity
              onPress={handleOpenNotifications}
              style={styles.notifBtn}
              accessibilityLabel="Notifications"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications-outline" size={21} color="#334155" />
              {effectiveUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{effectiveUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Student Avatar Circle ("AN") */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'ProfileTab' })}
            style={styles.profileBtn}
            accessibilityLabel="Student Profile"
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AN</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Universal Notifications Modal (Works seamlessly across ALL screens) */}
      <ModalSheet
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        title="Notifications"
      >
        <Card style={styles.notifCardPrimary}>
          <Text style={styles.notifTitlePrimary}>New Announcement</Text>
          <Text style={styles.notifDescPrimary}>
            Library Extended Hours published by Mr. Daniel Hartono.
          </Text>
          <Text style={styles.notifDatePrimary}>Jul 18, 2026</Text>
        </Card>

        <Card style={styles.notifCardStandard}>
          <Text style={styles.notifTitleStandard}>
            Term 1 Academic Year 2026/2027 Started
          </Text>
          <Text style={styles.notifDescStandard}>
            Check your course schedules and daily habits.
          </Text>
          <Text style={styles.notifDateStandard}>Jul 14, 2026</Text>
        </Card>

        <TouchableOpacity
          style={styles.viewAllAnnouncementsBtn}
          onPress={() => {
            setNotifVisible(false);
            (navigation as any).navigate('MainTabs', { screen: 'AnnouncementsTab' });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllAnnouncementsText}>View All Announcements</Text>
          <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
        </TouchableOpacity>
      </ModalSheet>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    flex: 1,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.accentRed,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bgSurface,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  notifBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 2,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* --- NOTIFICATIONS MODAL STYLES --- */
  notifCardPrimary: {
    backgroundColor: COLORS.accentBlueLight,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.sm,
  },
  notifTitlePrimary: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  notifDescPrimary: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#2563EB',
    marginTop: 3,
    lineHeight: 18,
  },
  notifDatePrimary: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 6,
    fontWeight: '500',
  },
  notifCardStandard: {
    marginBottom: SPACING.md,
  },
  notifTitleStandard: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  notifDescStandard: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },
  notifDateStandard: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    fontWeight: '500',
  },
  viewAllAnnouncementsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  viewAllAnnouncementsText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default AppHeader;
