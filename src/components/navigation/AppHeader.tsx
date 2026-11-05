import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { DrawerParamList } from '../../types/navigation';
import Card from '../common/Card';
import ModalSheet from '../modals/ModalSheet';
import { useNotifications } from '../../context/NotificationContext';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';

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
  const { studentProfile } = useStudentData();
  const { logout } = useAuth();

  const [notifVisible, setNotifVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const effectiveUnread = unreadCount !== undefined ? unreadCount : globalUnread;

  const initials = studentProfile?.fullName
    ? studentProfile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AN';

  const handleOpenNotifications = () => {
    markAllAsRead();
    if (onPressNotifications) {
      onPressNotifications();
    } else {
      setNotifVisible(true);
    }
  };

  const handleNavigateProfile = () => {
    setUserMenuVisible(false);
    (navigation as any).navigate('MainTabs', { screen: 'ProfileTab' });
  };

  const handleConfirmLogout = async () => {
    setUserMenuVisible(false);
    setConfirmLogoutVisible(false);
    await logout();
    const parentNav = navigation.getParent() as any;
    if (parentNav?.navigate) {
      parentNav.navigate('Login');
    } else {
      (navigation as any).navigate('Login');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.left}>
          {/* Menu / Hamburger Icon */}
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.iconBtn}
            accessibilityLabel="Open Navigation Drawer"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={24} color="#475569" />
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
              <Ionicons name="notifications-outline" size={22} color="#475569" />
              {effectiveUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{effectiveUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Student Avatar Circle matching Web Topbar UserMenu */}
          <TouchableOpacity
            onPress={() => setUserMenuVisible(true)}
            style={styles.profileBtn}
            accessibilityLabel="Student Profile Menu"
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Menu Dropdown Popover matching Web UserMenu (components/layout/user-menu.tsx) */}
      <Modal
        visible={userMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUserMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setUserMenuVisible(false)}>
          <View style={styles.popoverBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.userMenuContainer}>
                {/* User Info Header */}
                <View style={styles.userMenuHeader}>
                  <Text style={styles.userMenuName} numberOfLines={1}>
                    {studentProfile?.fullName || 'Student'}
                  </Text>
                  <Text style={styles.userMenuEmail} numberOfLines={1}>
                    {studentProfile?.email || 'student@learn.kreativaglobal.sch.id'}
                  </Text>
                </View>

                {/* Profile Item */}
                <TouchableOpacity
                  style={styles.userMenuItem}
                  onPress={handleNavigateProfile}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-outline" size={18} color="#475569" />
                  <Text style={styles.userMenuItemText}>Profile</Text>
                </TouchableOpacity>

                {/* Sign Out Item */}
                <TouchableOpacity
                  style={[styles.userMenuItem, styles.userMenuLogoutItem]}
                  onPress={() => {
                    setUserMenuVisible(false);
                    setConfirmLogoutVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.userMenuLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout Confirmation Dialog matching Web LogoutConfirmDialog */}
      <Modal
        visible={confirmLogoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLogoutVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmLogoutVisible(false)}>
          <View style={styles.confirmModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmModalCard}>
                <View style={styles.confirmModalHeader}>
                  <Text style={styles.confirmModalTitle}>Sign Out</Text>
                  <TouchableOpacity
                    onPress={() => setConfirmLogoutVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.confirmModalDesc}>
                  Are you sure you want to sign out of your account?
                </Text>

                <View style={styles.confirmModalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setConfirmLogoutVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmSignOutBtn}
                    onPress={handleConfirmLogout}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmSignOutText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Universal Notifications Modal */}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flex: 1,
  },
  title: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
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
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* --- USER MENU POPOVER STYLES --- */
  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  userMenuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    ...SHADOWS.md,
    elevation: 8,
  },
  userMenuHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userMenuName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  userMenuEmail: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userMenuItemText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
  },
  userMenuLogoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  userMenuLogoutText: {
    fontSize: 13.5,
    color: '#DC2626',
    fontWeight: '500',
  },

  /* --- CONFIRM LOGOUT MODAL STYLES --- */
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.lg,
    elevation: 10,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmModalDesc: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#475569',
  },
  confirmSignOutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  confirmSignOutText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* --- NOTIFICATIONS MODAL STYLES --- */
  notifCardPrimary: {
    backgroundColor: '#EFF6FF',
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
    fontFamily: FONTS.titleSemiBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  notifDescStandard: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  notifDateStandard: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  viewAllAnnouncementsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  viewAllAnnouncementsText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default AppHeader;
