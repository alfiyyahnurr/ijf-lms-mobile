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
  ChevronUpIcon,
  ChevronDownIcon,
  WebIconProps,
} from '../common/WebIcons';
import { FONTS } from '../../constants/theme';

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation,
  state,
}) => {
  const { studentProfile } = useStudentData();
  const [moreExpanded, setMoreExpanded] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const navItems: { label: string; tabName: string; Icon: React.FC<WebIconProps> }[] = [
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left']}>
      {/* 1. Drawer Branding Header matching screenshot */}
      <View style={styles.brandHeader}>
        <View style={styles.brandInfo}>
          <Image
            source={require('../../../assets/LOGO_KREATIVA_NEGATIF.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle} numberOfLines={2}>
              Kreativa Global High{'\n'}School
            </Text>
            <Text style={styles.brandSubtitle}>Student Portal</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.closeDrawer()}
          style={styles.closeBtn}
          accessibilityLabel="Close drawer"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon size={19} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* 2. Student Profile Identity Box matching screenshot */}
      <View style={styles.profileBox}>
        <Text style={styles.userName}>{studentProfile.fullName}</Text>
        <Text style={styles.userClass}>{studentProfile.className}</Text>
      </View>

      {/* 3. Scrollable Nav Items matching screenshot */}
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {navItems.map((item) => {
          const isActive = activeTabName === item.tabName;
          const IconComponent = item.Icon;

          return (
            <TouchableOpacity
              key={item.tabName}
              onPress={() => navigateTo(item.tabName)}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.75}
            >
              <View style={styles.navIcon}>
                <IconComponent
                  size={20}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)'}
                  strokeWidth={isActive ? 2 : 1.8}
                />
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* 4. MORE Accordion Section matching screenshot */}
        <TouchableOpacity
          onPress={() => setMoreExpanded(!moreExpanded)}
          style={styles.moreHeader}
          activeOpacity={0.7}
        >
          <Text style={styles.moreTitle}>MORE</Text>
          {moreExpanded ? (
            <ChevronUpIcon size={14} color="rgba(255, 255, 255, 0.65)" strokeWidth={2} />
          ) : (
            <ChevronDownIcon size={14} color="rgba(255, 255, 255, 0.65)" strokeWidth={2} />
          )}
        </TouchableOpacity>

        {moreExpanded && (
          <View style={styles.moreSubmenu}>
            <TouchableOpacity
              onPress={() => navigateTo('AnnouncementsTab')}
              style={[
                styles.navItem,
                activeTabName === 'AnnouncementsTab' && styles.navItemActive,
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.navIcon}>
                <MegaphoneIcon
                  size={20}
                  color={
                    activeTabName === 'AnnouncementsTab'
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.9)'
                  }
                  strokeWidth={activeTabName === 'AnnouncementsTab' ? 2 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  activeTabName === 'AnnouncementsTab' && styles.navLabelActive,
                ]}
              >
                Announcements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo('ProfileTab')}
              style={[
                styles.navItem,
                activeTabName === 'ProfileTab' && styles.navItemActive,
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.navIcon}>
                <UserIcon
                  size={20}
                  color={
                    activeTabName === 'ProfileTab'
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.9)'
                  }
                  strokeWidth={activeTabName === 'ProfileTab' ? 2 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  activeTabName === 'ProfileTab' && styles.navLabelActive,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 5. Logout Footer matching screenshot */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={styles.logoutBtn}
          activeOpacity={0.75}
        >
          <View style={styles.navIcon}>
            <LogOutIcon size={20} color="#FFFFFF" strokeWidth={1.8} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Confirm Logout Modal Alert matching reference screenshot */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                {/* Header Row: Title & Close Icon */}
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Confirm Logout</Text>
                  <TouchableOpacity
                    onPress={() => setShowLogoutModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <CloseIcon size={20} color="#0F172A" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>

                {/* Description Body */}
                <Text style={styles.modalBodyText}>
                  Are you sure you want to log out? You will need to sign in again to access your courses.
                </Text>

                {/* Action Buttons: Stacked vertically */}
                <TouchableOpacity
                  style={styles.modalLogoutBtn}
                  onPress={() => {
                    setShowLogoutModal(false);
                    navigation.closeDrawer();
                    (navigation.getParent() as any)?.navigate('Login');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalLogoutBtnText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5001B2', // Brand Royal Violet
  },
  brandHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogo: {
    width: 42,
    height: 42,
    marginRight: 10,
  },
  brandTextWrap: {
    flex: 1,
    marginRight: 6,
  },
  brandTitle: {
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userName: {
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  userClass: {
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12.5,
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  menuScrollContent: {
    paddingBottom: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  navIcon: {
    marginRight: 14,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14.5,
    fontWeight: '500',
  },
  navLabelActive: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 6,
  },
  moreTitle: {
    fontFamily: FONTS.semiBold,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  moreSubmenu: {
    paddingTop: 2,
  },
  footer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
  },

  // -------------------------------------------------------------
  // CONFIRM LOGOUT MODAL STYLES (MATCHING USER SCREENSHOT)
  // -------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  modalBodyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    marginBottom: 22,
  },
  modalLogoutBtn: {
    height: 46,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoutBtnText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCancelBtn: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalCancelBtnText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default CustomDrawerContent;
