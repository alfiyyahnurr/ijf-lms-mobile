import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HomeIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '../common/WebIcons';
import { FONTS } from '../../constants/theme';

export const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 10);
  const containerHeight = 66 + (insets.bottom > 0 ? insets.bottom : 8);

  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute.name;
  const isAssignmentDetail =
    currentRouteName === 'AssignmentsTab' &&
    Boolean((currentRoute.params as any)?.isDetail);

  // Map any route to one of the 5 canonical active tabs (or null if none)
  const getActiveTab = (): 'Home' | 'Plan' | 'Courses' | 'Habits' | 'Board' | null => {
    // Pengecualian: Ketika user membuka detail card assignment, bottom nav memilih menu 'Courses'
    if (isAssignmentDetail) {
      return 'Courses';
    }

    switch (currentRouteName) {
      case 'DashboardTab':
        return 'Home';
      case 'WeeklyTab':
        return 'Plan';
      case 'CoursesTab':
        return 'Courses';
      case 'HabitsTab':
        return 'Habits';
      case 'BoardTab':
        return 'Board';
      default:
        // Halaman yang tidak ada di 5 menu bottom nav (Announcements, Profile, Quizzes,
        // Exams, Report Card, Literacy, dan daftar Assignments) TIDAK men-select menu apapun.
        return null;
    }
  };

  const activeTab = getActiveTab();

  const tabs: {
    label: 'Home' | 'Plan' | 'Courses' | 'Habits' | 'Board';
    screen: string;
    Icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  }[] = [
    { label: 'Home', screen: 'DashboardTab', Icon: HomeIcon },
    { label: 'Plan', screen: 'WeeklyTab', Icon: CalendarIcon },
    { label: 'Courses', screen: 'CoursesTab', Icon: BookOpenIcon },
    { label: 'Habits', screen: 'HabitsTab', Icon: CheckCircleIcon },
    { label: 'Board', screen: 'BoardTab', Icon: TrophyIcon },
  ];

  const ACTIVE_COLOR = '#2563EB';
  const INACTIVE_COLOR = '#64748B';

  return (
    <View style={[styles.container, { height: containerHeight, paddingBottom: bottomInset }]}>
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.label;
        const IconComponent = tab.Icon;
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={tab.label}
            onPress={() => navigation.navigate(tab.screen)}
            style={styles.tabBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              <IconComponent size={24} color={color} strokeWidth={isFocused ? 2.2 : 1.8} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color },
                isFocused && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

export default CustomBottomTabBar;
