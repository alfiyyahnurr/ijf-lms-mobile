import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { DrawerParamList } from '../../types/navigation';
import { useStudentData } from '../../context/StudentDataContext';
import AppHeader from '../../components/navigation/AppHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import ErrorState from '../../components/feedback/ErrorState';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const {
    studentProfile,
    dashboardData,
    isDashboardLoading,
    fetchDashboardData,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();

  // Auto-refresh live dashboard data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Stats from Live Backend API
  const activeCoursesCount = dashboardData?.stats?.activeCourses ?? 0;
  const pendingAssignmentsCount = dashboardData?.stats?.pendingAssignments ?? 0;
  const upcomingExamsCount = dashboardData?.stats?.upcomingExams ?? 0;
  const sessionsThisWeekCount = dashboardData?.stats?.sessionsThisWeek ?? 0;

  // 2. Points & House from Live Backend API
  const totalPoints = dashboardData?.points?.total ?? studentProfile.points;
  const disciplinePts = dashboardData?.points?.discipline ?? studentProfile.disciplinePts;
  const literacyPts = dashboardData?.points?.literacy ?? studentProfile.literacyPts;
  const habitsPts = dashboardData?.points?.habits ?? studentProfile.habitsPts;
  const houseName = dashboardData?.points?.houseName || studentProfile.house || 'Unassigned';
  const houseRank = dashboardData?.points?.houseRank;
  const houseTotal = dashboardData?.points?.houseTotal ?? 0;

  // 3. Upcoming Sessions from Live Backend API (empty array if student has 0 sessions)
  const sessionsList = dashboardData?.upcomingSessions ?? [];

  // 4. Pending Assignments from Live Backend API (empty array if 0 assignments)
  const pendingList = dashboardData?.pendingAssignments ?? [];

  // 5. Recent Scores from Live Backend API (empty array if 0 scores)
  const scoresList = dashboardData?.recentScores ?? [];

  // 6. Announcements from Live Backend API (max 2 items matching Web LMS)
  const announcementsList = dashboardData?.announcements ? dashboardData.announcements.slice(0, 2) : [];

  const route = useRoute<any>();
  const scrollRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress' as any, () => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.resetKey) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  if (isDashboardLoading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader showTitle={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F089F" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={['#4F089F']}
            tintColor="#4F089F"
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeBox}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>Welcome back!</Text>
        </View>

        {isError ? (
          <ErrorState
            title="Failed to Load Dashboard"
            subtitle={errorMessage || 'Unable to sync dashboard data with server.'}
            onRetry={refreshAllData}
          />
        ) : (
          <>
            {/* 4 Stat Cards Stacked Full Width matching Web LMS */}
        <View style={styles.statStack}>
          <StatCard
            value={activeCoursesCount}
            label="Active Courses"
            icon="book-outline"
            iconColor="#2563EB"
            iconBgColor="#EFF6FF"
          />
          <StatCard
            value={pendingAssignmentsCount}
            label="Pending Assignments"
            icon="clipboard-outline"
            iconColor="#EA580C"
            iconBgColor="#FFF7ED"
          />
          <StatCard
            value={upcomingExamsCount}
            label="Upcoming Exams"
            icon="school-outline"
            iconColor="#9333EA"
            iconBgColor="#FAF5FF"
          />
          <StatCard
            value={sessionsThisWeekCount}
            label="Sessions This Week"
            icon="calendar-outline"
            iconColor="#0D9488"
            iconBgColor="#F0FDF4"
          />
        </View>

        {/* MY POINTS Card matching Web LMS */}
        <Card accentBorder="blue" style={styles.sectionCard}>
          <View style={styles.cardHeaderFlex}>
            <View style={styles.labelRow}>
              <Ionicons name="trophy-outline" size={15} color="#64748B" />
              <Text style={styles.cardLabel}>MY POINTS</Text>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate('BoardTab')}>
              <Text style={styles.cardLink}>Leaderboard →</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pointsValue}>{totalPoints}</Text>

          <View style={styles.badgeRow}>
            <Badge color="purple">Discipline {disciplinePts}</Badge>
            <Badge color="teal">Literacy {literacyPts}</Badge>
            <Badge color="green">Habits {habitsPts}</Badge>
          </View>
        </Card>

        {/* HOUSE STANDING Card matching Web LMS (teal accent) */}
        <Card accentColor="teal" style={styles.sectionCard}>
          <View style={styles.cardHeaderFlex}>
            <View style={styles.labelRow}>
              <Ionicons name="home-outline" size={15} color="#64748B" />
              <Text style={styles.cardLabel}>HOUSE STANDING</Text>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate('BoardTab')}>
              <Text style={styles.cardLink}>View →</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.houseName}>{houseName}</Text>
          <Text style={styles.houseDesc}>
            {houseRank != null
              ? `Rank #${houseRank} · ${houseTotal} house pts`
              : (houseName !== 'Unassigned' ? 'No house ranking yet' : 'Not assigned to any house')}
          </Text>
        </Card>

        {/* Upcoming Sessions Card matching Web LMS */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          {sessionsList.length === 0 ? (
            <Text style={styles.emptyNotice}>No upcoming sessions.</Text>
          ) : (
            <View style={styles.subList}>
              {sessionsList.map((s: any, idx: number) => (
                <View key={s.id || idx} style={styles.subCardItem}>
                  <View style={styles.subCardContent}>
                    <Text style={styles.subCardTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.subCardSub} numberOfLines={1}>
                      {s.courseName || s.course_name || 'Course'}
                    </Text>
                  </View>
                  <Badge color="blue">{s.status || 'scheduled'}</Badge>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Pending Assignments Card matching Web LMS ("All caught up!") */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pending Assignments</Text>

          {pendingList.length === 0 ? (
            <Text style={styles.emptyNotice}>All caught up!</Text>
          ) : (
            <>
              <View style={styles.subList}>
                {pendingList.map((item: any, idx: number) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.subCardItem}
                    onPress={() =>
                      (navigation as any).navigate('AssignmentsTab', {
                        assignmentId: item.id,
                        isDetail: true,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.subCardContent}>
                      <Text style={styles.subCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.subCardSub}>Due: {formatDueDate(item.dueDate || item.due_date)}</Text>
                    </View>
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingPillText}>Pending</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => (navigation as any).navigate('AssignmentsTab', { isDetail: false })}
                style={styles.viewAllRow}
                activeOpacity={0.7}
              >
                <Text style={styles.cardLink}>View all assignments →</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Recent Scores Card matching Web LMS */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Scores</Text>
          {scoresList.length === 0 ? (
            <Text style={styles.emptyNotice}>No scores yet.</Text>
          ) : (
            <View style={styles.subList}>
              {scoresList.map((s: any, idx: number) => (
                <View key={s.id || idx} style={styles.subCardItem}>
                  <View style={styles.subCardContent}>
                    <Text style={styles.subCardTitle} numberOfLines={1}>
                      {s.title || s.subject}
                    </Text>
                    <Text style={styles.subCardSub}>
                      {s.courseName || s.course_name || 'Assessment'}
                    </Text>
                  </View>
                  <Text style={styles.scoreGreenText}>
                    {s.score}/{s.maxScore ?? s.max_score ?? 100}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Announcements Card matching Web LMS */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Announcements</Text>

          {announcementsList.length === 0 ? (
            <Text style={styles.emptyNotice}>No announcements available.</Text>
          ) : (
            <>
              <View style={styles.subList}>
                {announcementsList.map((item: any, idx: number) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.announcementBox}
                    onPress={() => (navigation as any).navigate('AnnouncementsTab')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subCardTitle}>{item.title}</Text>
                    <Text style={styles.announcementDesc} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => (navigation as any).navigate('AnnouncementsTab')}
                style={styles.viewAllRow}
                activeOpacity={0.7}
              >
                <Text style={styles.cardLink}>View all announcements →</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 108,
  },
  welcomeBox: {
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
  },
  pageSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statStack: {
    marginBottom: 8,
  },
  sectionCard: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  cardLink: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  pointsValue: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillDiscipline: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillDisciplineText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7E22CE',
  },
  pillLiteracy: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillLiteracyText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0F766E',
  },
  pillHabits: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillHabitsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#15803D',
  },
  houseName: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 4,
  },
  houseDesc: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#475569',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyNotice: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: '#475569',
    marginTop: 2,
    marginBottom: 4,
  },
  subList: {
    gap: 8,
    marginBottom: 12,
  },
  subCardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subCardContent: {
    flex: 1,
    marginRight: 10,
  },
  subCardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  subCardSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
  },
  announcementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  announcementDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#475569',
    marginTop: 4,
  },
  viewAllRow: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  scoreGreenText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
});

export default DashboardScreen;
