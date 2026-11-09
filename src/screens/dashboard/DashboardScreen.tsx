import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { DrawerParamList } from '../../types/navigation';
import { WEEKLY_SCHEDULE } from '../../data/mockData';
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
    courses,
    assignments,
    exams,
    announcements,
    grades,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();

  const upcomingSessions = [
    { id: 1, title: 'W8 · Chemistry · Stoichiometry', courseName: 'Chemistry IGCSE — S4 A 2026/2027', status: 'scheduled' },
    { id: 2, title: 'W8 · Mathematics · Quadratic Equations', courseName: 'Mathematics IGCSE — S4 A 2026/2027', status: 'scheduled' },
    { id: 3, title: 'W8 · Physics · Kinematics Lab', courseName: 'Physics IGCSE — S4 A 2026/2027', status: 'scheduled' },
  ];

  const pendingAssignmentsCount = assignments.filter(
    (assignment) => assignment.status === 'pending'
  ).length;

  const upcomingExamsCount = exams.filter(
    (exam) => exam.status === 'upcoming'
  ).length;

  const sessionsThisWeekCount = Object.values(WEEKLY_SCHEDULE).reduce(
    (total, sessions) => total + sessions.length,
    0
  );

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
            {/* 4 Stat Cards Stacked Full Width matching Screenshot 105517 */}
        <View style={styles.statStack}>
          <StatCard
            value={courses.length}
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

        {/* MY POINTS Card matching Screenshot 105530 */}
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

          <Text style={styles.pointsValue}>{studentProfile.points}</Text>

          <View style={styles.badgeRow}>
            <Badge color="purple">Discipline {studentProfile.disciplinePts}</Badge>
            <Badge color="teal">Literacy {studentProfile.literacyPts}</Badge>
            <Badge color="green">Habits {studentProfile.habitsPts}</Badge>
          </View>
        </Card>

        {/* HOUSE STANDING Card matching Screenshot 105530 */}
        <Card accentBorder="green" style={styles.sectionCard}>
          <View style={styles.cardHeaderFlex}>
            <View style={styles.labelRow}>
              <Ionicons name="home-outline" size={15} color="#64748B" />
              <Text style={styles.cardLabel}>HOUSE STANDING</Text>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate('BoardTab')}>
              <Text style={styles.cardLink}>View →</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.houseName}>{studentProfile.house || 'No House Assigned'}</Text>
          <Text style={styles.houseDesc}>{studentProfile.house ? 'No house ranking yet' : 'Not assigned to any house'}</Text>
        </Card>

        {/* Upcoming Sessions Card matching Web */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          {upcomingSessions.length === 0 ? (
            <Text style={styles.emptyNotice}>No upcoming sessions.</Text>
          ) : (
            <View style={styles.subList}>
              {upcomingSessions.map((s) => (
                <View key={s.id} style={styles.subCardItem}>
                  <View style={styles.subCardContent}>
                    <Text style={styles.subCardTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.subCardSub} numberOfLines={1}>
                      {s.courseName}
                    </Text>
                  </View>
                  <Badge color="blue">{s.status}</Badge>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Pending Assignments Card matching Screenshot 105543 */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pending Assignments</Text>

          {assignments.filter((item) => item.status === 'pending').length === 0 ? (
            <Text style={styles.emptyNotice}>No pending assignments.</Text>
          ) : (
            <>
              <View style={styles.subList}>
                {assignments
                  .filter((item) => item.status === 'pending')
                  .slice(0, 3)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
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
                        <Text style={styles.subCardSub}>Due: {item.dueDate || 'N/A'}</Text>
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

        {/* Recent Scores Card matching Web */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Scores</Text>
          {grades.length === 0 ? (
            <Text style={styles.emptyNotice}>No scores yet.</Text>
          ) : (
            <View style={styles.subList}>
              {grades.slice(0, 3).map((s, idx) => (
                <View key={s.id || idx} style={styles.subCardItem}>
                  <View style={styles.subCardContent}>
                    <Text style={styles.subCardTitle} numberOfLines={1}>
                      {s.subject}
                    </Text>
                    <Text style={styles.subCardSub}>Term 1 Assessment</Text>
                  </View>
                  <Text style={styles.scoreGreenText}>{s.score}/100</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Announcements Card matching Screenshot 105557 */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Announcements</Text>

          {announcements.length === 0 ? (
            <Text style={styles.emptyNotice}>No announcements available.</Text>
          ) : (
            <>
              <View style={styles.subList}>
                {announcements.map((item) => (
                  <TouchableOpacity
                    key={item.id}
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
});

export default DashboardScreen;
