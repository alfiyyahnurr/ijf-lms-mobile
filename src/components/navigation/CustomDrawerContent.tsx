import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  BookOpenIcon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  ScrollTextIcon,
  BookMarkedIcon,
  CheckCircleIcon,
  TrophyIcon,
  MegaphoneIcon,
  UserIcon,
  LogOutIcon,
  CloseIcon,
  ChevronDownIcon,
  WebIconProps,
} from '../common/WebIcons';

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation,
  state,
}) => {
  const { studentProfile } = useStudentData();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const mainTabsRoute = state.routes.find((r) => r.name === 'MainTabs');
  const tabsState = mainTabsRoute?.state as any;
  const activeTabName =
    tabsState?.routes?.[tabsState?.index ?? 0]?.name || 'DashboardTab';

  const navigateTo = (tabName: string) => {
    navigation.navigate('MainTabs' as any, {
      screen: tabName,
      params: {
        isDetail: false,
        resetKey: Date.now(),
      },
    });
    navigation.closeDrawer();
  };

  const primaryItems: { label: string; tabName: string; Icon: React.FC<WebIconProps> }[] = [
    { label: 'Dashboard', tabName: 'DashboardTab', Icon: HomeIcon },
    { label: 'Weekly Plan', tabName: 'WeeklyTab', Icon: CalendarIcon },
    { label: 'My Courses', tabName: 'CoursesTab', Icon: BookOpenIcon },
    { label: 'Assignments', tabName: 'AssignmentsTab', Icon: ClipboardListIcon },
    { label: 'Quizzes', tabName: 'QuizzesTab', Icon: FileTextIcon },
    { label: 'Exams', tabName: 'ExamsTab', Icon: GraduationCapIcon },
    { label: 'Report Card', tabName: 'ReportCardTab', Icon: ScrollTextIcon },
    { label: 'Literacy', tabName: 'LiteracyTab', Icon: BookMarkedIcon },
    { label: 'Habits', tabName: 'HabitsTab', Icon: CheckCircleIcon },
    { label: 'Leaderboard', tabName: 'BoardTab', Icon: TrophyIcon },
  ];

  const moreItems: { label: string; tabName: string; Icon: React.FC<WebIconProps> }[] = [
    { label: 'Announcements', tabName: 'AnnouncementsTab', Icon: MegaphoneIcon },
    { label: 'Profile', tabName: 'ProfileTab', Icon: UserIcon },
  ];

  // Student Info formatting: className · academicYear · houseName (matches web lines 174-182)
  const studentMeta = [
    studentProfile?.className,
    studentProfile?.academicYearName,
    studentProfile?.house && studentProfile.house !== 'Unassigned' ? studentProfile.house : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left']}>
      {/* 1. Logo + School Name Header (matches web lines 117-148) */}
      <View style={styles.brandHeader}>
        <View style={styles.brandInfo}>
          <Image
            source={require('../../../assets/LOGO_KREATIVA_NEGATIF.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle} numberOfLines={2}>
              {studentProfile?.schoolName || 'Kreativa Global High School'}
            </Text>
            <Text style={styles.brandSubtitle}>Student Portal</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.closeDrawer()}
          style={styles.closeBtn}
          accessibilityLabel="Close drawer"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <CloseIcon size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* 2. Student Info Section (matches web lines 170-185) */}
      <View style={styles.profileBox}>
        <Text style={styles.userName} numberOfLines={1}>
          {studentProfile?.fullName || 'Student'}
        </Text>
        <Text style={styles.userMeta} numberOfLines={1}>
          {studentMeta || studentProfile?.className || 'Student Portal'}
        </Text>
      </View>

      {/* 3. Navigation List (matches web lines 187-233) */}
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {primaryItems.map((item) => {
          const isActive = activeTabName === item.tabName;
          const IconComponent = item.Icon;

          return (
            <TouchableOpacity
              key={item.tabName}
              onPress={() => navigateTo(item.tabName)}
              style={[styles.navLink, isActive ? styles.navLinkActive : styles.navLinkInactive]}
              activeOpacity={0.75}
            >
              <View style={styles.navIcon}>
                <IconComponent
                  size={20}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.70)'}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isActive ? styles.navLabelActive : styles.navLabelInactive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* 4. More Section (matches web lines 201-221) */}
        <View style={styles.moreSection}>
          <TouchableOpacity
            onPress={() => setMoreOpen(!moreOpen)}
            style={styles.moreHeader}
            activeOpacity={0.7}
          >
            <Text style={styles.moreTitle}>More</Text>
            <View style={[styles.chevronWrap, moreOpen && styles.chevronRotated]}>
              <ChevronDownIcon size={16} color="rgba(255, 255, 255, 0.50)" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {moreOpen && (
            <View style={styles.moreSubmenu}>
              {moreItems.map((item) => {
                const isActive = activeTabName === item.tabName;
                const IconComponent = item.Icon;

                return (
                  <TouchableOpacity
                    key={item.tabName}
                    onPress={() => navigateTo(item.tabName)}
                    style={[
                      styles.navLink,
                      isActive ? styles.navLinkActive : styles.navLinkInactive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.navIcon}>
                      <IconComponent
                        size={20}
                        color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.70)'}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.navLabel,
                        isActive ? styles.navLabelActive : styles.navLabelInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. Logout Footer (matches web lines 234-245) */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => setConfirmLogout(true)}
          style={styles.logoutBtn}
          activeOpacity={0.75}
        >
          <View style={styles.navIcon}>
            <LogOutIcon size={20} color="rgba(255, 255, 255, 0.70)" strokeWidth={2} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Confirm Logout Modal (matches web LogoutConfirmDialog.tsx) */}
      <Modal
        visible={confirmLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLogout(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmLogout(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Confirm Logout</Text>
                  <TouchableOpacity
                    onPress={() => setConfirmLogout(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.modalCloseBtn}
                  >
                    <CloseIcon size={20} color="#64748B" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalMessage}>
                  Are you sure you want to log out? You will need to sign in again to access your courses.
                </Text>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setConfirmLogout(false)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalLogoutBtn}
                    onPress={async () => {
                      setConfirmLogout(false);
                      await logout();
                      const parentNav = navigation.getParent() as any;
                      if (parentNav?.navigate) {
                        parentNav.navigate('Login');
                      } else {
                        (navigation as any).navigate('Login');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalLogoutBtnText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Root container: w-72 (288px) with background secondaryColor (#5001b2)
  container: {
    flex: 1,
    backgroundColor: '#5001B2',
  },

  // Header: p-4 border-b border-white/10
  brandHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  brandLogo: {
    width: 60,
    height: 60,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  brandSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Student Info Section: px-4 py-3 border-b border-white/10 text-center
  profileBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.70)',
    marginTop: 2,
    textAlign: 'center',
  },

  // Nav: flex-1 p-2 space-y-0.5 overflow-y-auto
  menuScroll: {
    flex: 1,
    padding: 8,
  },
  menuScrollContent: {
    paddingBottom: 16,
    gap: 2,
  },

  // NavLink: flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navLinkActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)', // bg-white/20
  },
  navLinkInactive: {
    backgroundColor: 'transparent',
  },
  navIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 14,
    flex: 1,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  navLabelInactive: {
    color: 'rgba(255, 255, 255, 0.70)', // text-white/70
    fontWeight: '400',
  },

  // More Section: pt-2 mt-1 border-t border-white/10
  moreSection: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.50)', // text-white/50
  },
  chevronWrap: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  moreSubmenu: {
    paddingTop: 2,
    gap: 2,
  },

  // Footer: p-2 border-t border-white/10
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '400',
  },

  // Modal: fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.50)', // bg-black/50
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  modalLogoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626', // variant="error" in web (#DC2626)
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoutBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default CustomDrawerContent;
