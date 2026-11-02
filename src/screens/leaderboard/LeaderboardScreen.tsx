import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/navigation/AppHeader';
import { FONTS, SHADOWS } from '../../constants/theme';
import { useStudentData } from '../../context/StudentDataContext';

export const LeaderboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'house' | 'jenjang' | 'class'>('house');
  const {
    studentProfile,
    pointsHistory,
    classLeaderboard,
    houseLeaderboard,
    jenjangLeaderboard,
  } = useStudentData();

  // Dynamic podium representation from top 3 students in classLeaderboard
  const firstPlace = classLeaderboard[0];
  const secondPlace = classLeaderboard[1];
  const thirdPlace = classLeaderboard[2];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Leaderboard" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title matching Screenshot 105848 */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Leaderboard</Text>
          <Text style={styles.pageSubtitle}>IGCSE</Text>
        </View>

        {/* Top Individual Points Card matching Screenshot 105848 */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsBigText}>
            +<Text style={styles.pointsConsolasNumberBig}>{studentProfile.points}</Text>
          </Text>
          <Text style={styles.pointsLabel}>individual points</Text>
          <Text style={styles.pointsSubDetail}>
            D <Text style={styles.pointsConsolasNumber}>{studentProfile.disciplinePts}</Text>  ·  L <Text style={styles.pointsConsolasNumber}>{studentProfile.literacyPts}</Text>  ·  H <Text style={styles.pointsConsolasNumber}>{studentProfile.habitsPts}</Text>
          </Text>
        </View>

        {/* Tabs Row matching Screenshot 105829/105848 */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'house' && styles.tabButtonActive]}
            onPress={() => setActiveTab('house')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'house' && styles.tabTextActive]}>
              House
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'jenjang' && styles.tabButtonActive]}
            onPress={() => setActiveTab('jenjang')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'jenjang' && styles.tabTextActive]}>
              Jenjang
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'class' && styles.tabButtonActive]}
            onPress={() => setActiveTab('class')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'class' && styles.tabTextActive]}>
              Class
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: HOUSE */}
        {activeTab === 'house' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.houseList}>
              {houseLeaderboard.map((house) => {
                const maxHousePoints = Math.max(...houseLeaderboard.map((h) => h.points), 10);
                const hasPoints = house.points > 0;
                const fillWidth = hasPoints
                  ? `${Math.min(100, Math.max(6, (house.points / maxHousePoints) * 100))}%`
                  : '0%';

                return (
                  <View key={house.name} style={styles.houseCard}>
                    {/* Top Line */}
                    <View style={styles.houseHeaderRow}>
                      <View style={styles.houseLeftGroup}>
                        <Text style={styles.houseRank}>#{house.rank}</Text>
                        <View style={[styles.houseDot, { backgroundColor: house.color }]} />
                        <Text style={styles.houseName}>{house.name}</Text>
                      </View>
                      <Text style={styles.housePoints}>
                        <Text style={styles.pointsConsolasNumber}>{house.points}</Text> pts
                      </Text>
                    </View>

                    {/* Progress Track matching screenshot: circular dot indicator at start position for 0 pts, or dynamic fill if > 0 */}
                    <View style={styles.progressTrack}>
                      {hasPoints ? (
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: house.color,
                              width: `${Math.min(100, Math.max(10, (house.points / maxHousePoints) * 100))}%`,
                            },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.progressDotZero,
                            { backgroundColor: house.color },
                          ]}
                        />
                      )}
                    </View>

                    {/* Bottom Stats matching Screenshot: 0 members  ·  D 0  L 0  H 0 */}
                    <Text style={styles.houseMembersText}>
                      {house.members} members  ·  D <Text style={styles.pointsConsolasNumber}>{house.disciplinePts ?? 0}</Text>  L <Text style={styles.pointsConsolasNumber}>{house.literacyPts ?? 0}</Text>  H <Text style={styles.pointsConsolasNumber}>{house.habitsPts ?? 0}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* My points history Card matching Screenshot */}
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>My points history</Text>
              {pointsHistory.length > 0 ? (
                pointsHistory.map((item, index) => {
                  const isLast = index === pointsHistory.length - 1;
                  return (
                    <View
                      key={item.id}
                      style={[styles.historyRow, isLast && styles.historyRowLast]}
                    >
                      <Text style={styles.historyItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.historyPointsBadge}>
                        +{item.points}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.historyEmptyText}>No points entries yet.</Text>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: JENJANG */}
        {activeTab === 'jenjang' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.sectionSubtitle}>Ranking · IGCSE</Text>

            <View style={styles.tableCard}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, styles.colJenjangRank]}>Rank</Text>
                <Text style={[styles.thCell, styles.colJenjangName]}>Name</Text>
                <Text style={[styles.thCell, styles.colJenjangClass]}>Class</Text>
                <Text style={[styles.thCell, styles.colJenjangHouse]}>House</Text>
                <Text style={[styles.thCell, styles.colJenjangPoints]}>Points</Text>
              </View>

              {/* Table Rows */}
              {jenjangLeaderboard.map((item) => {
                const isYou = item.isCurrent || item.name.includes('(you)');
                const displayName = isYou ? item.name.replace(' (you)', '') : item.name;
                const literacyVal = isYou ? studentProfile.literacyPts : (item.literacyPts ?? 0);
                const habitsVal = isYou ? studentProfile.habitsPts : (item.habitsPts ?? 0);
                const totalPointsVal = isYou ? studentProfile.points : item.points;

                return (
                  <View
                    key={item.name}
                    style={[styles.tableRow, isYou && styles.tableRowHighlight]}
                  >
                    <Text style={[styles.tdRank, styles.colJenjangRank, isYou && styles.textHighlight]}>
                      #{item.rank}
                    </Text>
                    <View style={[styles.colJenjangName, styles.nameCellWrapper]}>
                      <View style={styles.nameRowInline}>
                        <Text
                          style={[styles.tdNameText, isYou && styles.textHighlight]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        {isYou && (
                          <Text style={styles.youInlineText}>(you)</Text>
                        )}
                      </View>

                      {/* Dynamic L and H breakdown badges matching Screenshot 1 */}
                      {(literacyVal > 0 || habitsVal > 0) && (
                        <View style={styles.categoryPillsRow}>
                          {literacyVal > 0 && (
                            <View style={styles.categoryPillGreen}>
                              <Text style={styles.categoryPillGreenText}>L {literacyVal}</Text>
                            </View>
                          )}
                          {habitsVal > 0 && (
                            <View style={styles.categoryPillGreen}>
                              <Text style={styles.categoryPillGreenText}>H {habitsVal}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.tdClass, styles.colJenjangClass]}>{item.class}</Text>
                    <Text
                      style={[
                        styles.tdHouse,
                        styles.colJenjangHouse,
                        item.house !== '—' && styles.tdHouseColored,
                      ]}
                    >
                      {item.house}
                    </Text>
                    <Text style={[styles.tdPoints, styles.colJenjangPoints, isYou && styles.textHighlight, { fontFamily: FONTS.consolas }]}>
                      {totalPointsVal}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 3: CLASS (PODIUM + TABLE) */}
        {activeTab === 'class' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.classHeaderTitle}>Class S4 Oxford</Text>
            <Text style={styles.classHeaderSub}>
              Unassigned leads in this class with {studentProfile.points} pts from 15 members
            </Text>

            {/* Dynamic Podium Graphics matching Screenshot 2 */}
            <View style={styles.podiumContainer}>
              {/* 2nd Place (Left) */}
              <View style={styles.podiumCol}>
                <View style={styles.medalCircle}>
                  <Text style={styles.medalIcon}>🥈</Text>
                </View>
                <Text style={styles.podiumStudentName} numberOfLines={1}>
                  {secondPlace ? secondPlace.name.replace(' (you)', '') : '—'}
                </Text>
                <Text style={styles.podiumPts}>
                  {secondPlace ? (secondPlace.isCurrent ? studentProfile.points : secondPlace.points) : 0}
                </Text>
                <View style={[styles.podiumPedestal, { height: 95 }]} />
              </View>

              {/* 1st Place (Center - Tallest) */}
              <View style={styles.podiumCol}>
                <View style={styles.medalCircle}>
                  <Text style={styles.medalIcon}>🥇</Text>
                </View>
                <Text style={styles.podiumStudentName} numberOfLines={1}>
                  {firstPlace ? firstPlace.name.replace(' (you)', '') : '—'}
                </Text>
                <Text style={styles.podiumPts}>
                  {firstPlace ? (firstPlace.isCurrent ? studentProfile.points : firstPlace.points) : 0}
                </Text>
                <View style={[styles.podiumPedestal, { height: 125 }]} />
              </View>

              {/* 3rd Place (Right - Shortest) */}
              <View style={styles.podiumCol}>
                <View style={styles.medalCircle}>
                  <Text style={styles.medalIcon}>🥉</Text>
                </View>
                <Text style={styles.podiumStudentName} numberOfLines={1}>
                  {thirdPlace ? thirdPlace.name.replace(' (you)', '') : '—'}
                </Text>
                <Text style={styles.podiumPts}>
                  {thirdPlace ? (thirdPlace.isCurrent ? studentProfile.points : thirdPlace.points) : 0}
                </Text>
                <View style={[styles.podiumPedestal, { height: 75 }]} />
              </View>
            </View>

            {/* Table below podium matching Screenshot 2 */}
            <View style={styles.tableCard}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, styles.colClassRank]}>Rank</Text>
                <Text style={[styles.thCell, styles.colClassName]}>Name</Text>
                <Text style={[styles.thCell, styles.colClassHouse]}>House</Text>
                <Text style={[styles.thCell, styles.colClassPoints]}>Points</Text>
              </View>

              {/* Table Rows with dynamic class leaderboard */}
              {classLeaderboard.map((item) => {
                const isYou = item.isCurrent || item.name.includes('(you)');
                const displayName = isYou ? item.name.replace(' (you)', '') : item.name;
                const literacyVal = isYou ? studentProfile.literacyPts : (item.literacyPts ?? 0);
                const habitsVal = isYou ? studentProfile.habitsPts : (item.habitsPts ?? 0);
                const totalPointsVal = isYou ? studentProfile.points : item.points;

                return (
                  <View
                    key={item.name}
                    style={[styles.tableRow, isYou && styles.tableRowHighlight]}
                  >
                    <Text style={[styles.tdRank, styles.colClassRank, isYou && styles.textHighlight]}>
                      #{item.rank}
                    </Text>
                    <View style={[styles.colClassName, styles.nameCellWrapper]}>
                      <View style={styles.nameRowInline}>
                        <Text
                          style={[styles.tdNameText, isYou && styles.textHighlight]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        {isYou && (
                          <Text style={styles.youInlineText}>(you)</Text>
                        )}
                      </View>

                      {/* Dynamic L and H breakdown badges matching Screenshot 2 */}
                      {(literacyVal > 0 || habitsVal > 0) && (
                        <View style={styles.categoryPillsRow}>
                          {literacyVal > 0 && (
                            <View style={styles.categoryPillGreen}>
                              <Text style={styles.categoryPillGreenText}>L {literacyVal}</Text>
                            </View>
                          )}
                          {habitsVal > 0 && (
                            <View style={styles.categoryPillGreen}>
                              <Text style={styles.categoryPillGreenText}>H {habitsVal}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tdHouse,
                        styles.colClassHouse,
                        item.house !== '—' && styles.tdHouseColored,
                      ]}
                    >
                      {item.house}
                    </Text>
                    <Text style={[styles.tdPoints, styles.colClassPoints, isYou && styles.textHighlight, { fontFamily: FONTS.consolas }]}>
                      {totalPointsVal}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 108,
  },
  headerBox: {
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
  pointsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  pointsBigText: {
    fontFamily: FONTS.title,
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  pointsConsolasNumberBig: {
    fontFamily: FONTS.consolas,
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  pointsConsolasNumber: {
    fontFamily: FONTS.consolas,
    fontWeight: '700',
  },
  pointsLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  pointsSubDetail: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: FONTS.bold,
    color: '#2563EB',
    fontWeight: '700',
  },
  tabContentContainer: {
    paddingTop: 4,
  },
  houseList: {
    gap: 12,
    marginBottom: 16,
  },
  houseCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  houseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  houseLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  houseRank: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
    width: 24,
  },
  houseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  houseName: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  housePoints: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5EFE6',
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressDotZero: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  houseMembersText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
  },
  historyCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  historyTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  historyEmptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  historyRowLast: {
    borderBottomWidth: 0,
  },
  historyItemTitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  historyPointsBadge: {
    fontFamily: FONTS.consolas,
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionSubtitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  classHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  classHeaderSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    paddingTop: 10,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  medalCircle: {
    marginBottom: 6,
  },
  medalIcon: {
    fontSize: 22,
  },
  podiumStudentName: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumPts: {
    fontFamily: FONTS.consolas,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 6,
  },
  podiumPedestal: {
    width: '100%',
    backgroundColor: '#E0E7FF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thCell: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowHighlight: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3.5,
    borderLeftColor: '#2563EB',
  },
  nameCellWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  nameRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tdNameText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  youInlineText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  categoryPillGreen: {
    backgroundColor: '#DCFCE7',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillGreenText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  youBadgeMini: {
    backgroundColor: '#BFDBFE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  youBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'lowercase',
  },
  textHighlight: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  tdRank: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tdClass: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
  },
  tdHouse: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
  },
  tdHouseColored: {
    fontFamily: FONTS.semiBold,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  tdPoints: {
    fontFamily: FONTS.consolas,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  // Dedicated column layouts for Jenjang Table (5 columns)
  colJenjangRank: {
    width: 36,
  },
  colJenjangName: {
    flex: 1,
    paddingRight: 6,
  },
  colJenjangClass: {
    width: 74,
  },
  colJenjangHouse: {
    width: 72,
    textAlign: 'center',
  },
  colJenjangPoints: {
    width: 44,
    textAlign: 'right',
  },
  // Dedicated column layouts for Class Table (4 columns)
  colClassRank: {
    width: 38,
  },
  colClassName: {
    flex: 1,
    paddingRight: 6,
  },
  colClassHouse: {
    width: 90,
    textAlign: 'center',
  },
  colClassPoints: {
    width: 48,
    textAlign: 'right',
  },
});

export default LeaderboardScreen;
