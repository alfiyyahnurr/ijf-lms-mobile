import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/navigation/AppHeader';
import ModalSheet from '../../components/modals/ModalSheet';
import ToastAlert from '../../components/feedback/ToastAlert';
import ErrorState from '../../components/feedback/ErrorState';
import { useStudentData } from '../../context/StudentDataContext';
import { getSchoolWeek } from '../../utils/calendarUtils';
import { WeeklyPlanSession } from '../../types';
import { FONTS, SHADOWS } from '../../constants/theme';

export const WeeklyPlanScreen: React.FC = () => {
  const {
    studentProfile,
    getWeeklyPlan,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();

  // weekOffset = 0 represents the active current week (e.g. 19 – 23 October 2026)
  // Negative offset represents past weeks (e.g. -1 is 12 – 16 October 2026)
  // User cannot go beyond 0 into future weeks (Next is disabled)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedSession, setSelectedSession] = useState<WeeklyPlanSession | null>(null);
  const [preQuestionInput, setPreQuestionInput] = useState('');
  const [postNoteInput, setPostNoteInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-close open session modal when user navigates away from Weekly Plan
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedSession(null);
      };
    }, [])
  );

  // Term 1 Boundary (Sep 7, 2026 is -6 weeks from Oct 19, 2026)
  const MIN_WEEK_OFFSET = -6;
  const MAX_WEEK_OFFSET = 0;

  // Calculate real dynamic 5-day school week (Monday to Friday)
  const schoolWeek = useMemo(() => {
    return getSchoolWeek(new Date(), weekOffset);
  }, [weekOffset]);

  // Fetch sessions for this week based on Postman format
  const sessions = useMemo(() => {
    return getWeeklyPlan(schoolWeek.weekStartIso);
  }, [schoolWeek.weekStartIso, getWeeklyPlan]);

  const isPrevDisabled = weekOffset <= MIN_WEEK_OFFSET;
  const isNextDisabled = weekOffset >= MAX_WEEK_OFFSET;

  const handlePrevWeek = () => {
    if (!isPrevDisabled) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (!isNextDisabled) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  const handleOpenSessionModal = (session: WeeklyPlanSession, isFutureDate: boolean) => {
    if (isFutureDate) {
      setToastMessage('This date is locked. Future sessions cannot be accessed in advance.');
      return;
    }
    setSelectedSession(session);
    setPreQuestionInput(session.preQuestion || '');
    setPostNoteInput(session.postNote || '');
  };

  const handleSaveProgress = () => {
    if (selectedSession) {
      selectedSession.preQuestion = preQuestionInput;
      selectedSession.postNote = postNoteInput;
      selectedSession.preDone = true;
      if (postNoteInput.trim().length > 0) {
        selectedSession.postDone = true;
      }
      setToastMessage(`Session progress for "${selectedSession.courseName}" updated!`);
      setSelectedSession(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showTitle={false} />

      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        floating
        onClose={() => setToastMessage(null)}
      />

      <ScrollView
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
        {/* Header Title matching Screenshot */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Weekly Plan</Text>
        </View>

        {isError ? (
          <ErrorState
            title="Failed to Load Weekly Plan"
            subtitle={errorMessage || 'Unable to sync weekly sessions with server.'}
            onRetry={refreshAllData}
          />
        ) : (
          <>
            {/* YOUR PROFILE Box matching Screenshot */}
            <View style={styles.profileBox}>
              <Text style={styles.profileLabel}>YOUR PROFILE</Text>
              <Text style={styles.profileName}>{studentProfile.fullName}</Text>
              <Text style={styles.profileDetails}>
                {studentProfile.className}, {studentProfile.schoolName}
              </Text>
            </View>

        {/* Date Navigator matching Screenshot */}
        <View style={styles.navigatorRow}>
          {/* < Prev Button */}
          <TouchableOpacity
            style={[styles.navButton, isPrevDisabled && styles.navButtonDisabled]}
            onPress={handlePrevWeek}
            activeOpacity={isPrevDisabled ? 1 : 0.7}
            disabled={isPrevDisabled}
          >
            <Ionicons
              name="chevron-back"
              size={14}
              color={isPrevDisabled ? '#E5E0D8' : '#1B2D4F'}
            />
            <Text
              style={[
                styles.navButtonText,
                isPrevDisabled && styles.navButtonTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          {/* Dynamic Real Calendar Range (e.g. 19 October – 23 October 2026) */}
          <View style={styles.dateCenter}>
            <Text style={styles.dateRangeText}>
              {schoolWeek.rangeLabel} {schoolWeek.yearLabel}
            </Text>
          </View>

          {/* Next > Button (Disabled on current week as shown in reference photo) */}
          <TouchableOpacity
            style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
            onPress={handleNextWeek}
            activeOpacity={isNextDisabled ? 1 : 0.7}
            disabled={isNextDisabled}
          >
            <Text
              style={[
                styles.navButtonText,
                isNextDisabled && styles.navButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isNextDisabled ? '#E5E0D8' : '#1B2D4F'}
            />
          </TouchableOpacity>
        </View>

        {/* Sessions Content */}
        {sessions.length === 0 ? (
          /* Empty State Text Centered matching Screenshot 105616 */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessageText}>
              No sessions scheduled this week.
            </Text>
          </View>
        ) : (
          /* 5 School Days (Monday to Friday) List with Future Locking */
          <View style={styles.daysList}>
            {schoolWeek.days.map((day) => {
              const daySessions = sessions.filter(
                (s: WeeklyPlanSession) => s.dayOfWeek === (day.dayName === 'Monday' ? 1 : day.dayName === 'Tuesday' ? 2 : day.dayName === 'Wednesday' ? 3 : day.dayName === 'Thursday' ? 4 : 5)
              );

              return (
                <View key={day.dateString} style={styles.daySection}>
                  {/* Day Header Row */}
                  <View style={styles.dayHeaderRow}>
                    <View style={styles.dayTitleWrap}>
                      <Text
                        style={[
                          styles.dayNameText,
                          day.isToday && styles.dayNameToday,
                          day.isFuture && styles.dayNameFuture,
                        ]}
                      >
                        {day.dayName}, {day.dayNumber} {day.monthName.slice(0, 3)}
                      </Text>
                      {day.isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </View>

                    {day.isFuture && (
                      <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                        <Text style={styles.lockedBadgeText}>Locked</Text>
                      </View>
                    )}
                  </View>

                  {/* Day Sessions or No Class */}
                  {daySessions.length === 0 ? (
                    <View style={styles.noDaySessionCard}>
                      <Text style={styles.noDaySessionText}>No sessions scheduled.</Text>
                    </View>
                  ) : (
                    daySessions.map((session: WeeklyPlanSession) => (
                      <TouchableOpacity
                        key={session.sessionId}
                        style={[
                          styles.sessionCard,
                          day.isFuture && styles.sessionCardLocked,
                        ]}
                        onPress={() => handleOpenSessionModal(session, day.isFuture)}
                        activeOpacity={day.isFuture ? 0.9 : 0.75}
                      >
                        <View style={styles.sessionCardHeader}>
                          <View style={styles.courseCodeBadge}>
                            <Text style={styles.courseCodeBadgeText}>
                              {session.courseCode}
                            </Text>
                          </View>
                          <Text style={styles.sessionTimeText}>{session.time}</Text>
                        </View>

                        <Text
                          style={[
                            styles.sessionTitleText,
                            day.isFuture && styles.sessionTitleTextLocked,
                          ]}
                          numberOfLines={2}
                        >
                          {session.title}
                        </Text>

                        <Text style={styles.sessionMetaText} numberOfLines={1}>
                          {session.room} • {session.teacher}
                        </Text>

                        {/* Learning Progress Pills (aligned with Postman schema) */}
                        <View style={styles.pillsRow}>
                          <View
                            style={[
                              styles.progressPill,
                              session.preDone
                                ? styles.progressPillDone
                                : styles.progressPillPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.progressPillText,
                                session.preDone
                                  ? styles.progressPillTextDone
                                  : styles.progressPillTextPending,
                              ]}
                            >
                              Pre-learning: {session.preDone ? 'Done' : 'Pending'}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.progressPill,
                              session.postDone
                                ? styles.progressPillDone
                                : styles.progressPillPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.progressPillText,
                                session.postDone
                                  ? styles.progressPillTextDone
                                  : styles.progressPillTextPending,
                              ]}
                            >
                              Post-learning: {session.postDone ? 'Done' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Session Progress Modal (based on Postman /api/student/sessions/:id/progress) */}
      <ModalSheet
        visible={!!selectedSession}
        title="Session Details"
        onClose={() => setSelectedSession(null)}
      >
        {selectedSession && (
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.courseCodeBadge}>
                <Text style={styles.courseCodeBadgeText}>
                  {selectedSession.courseCode}
                </Text>
              </View>
              <Text style={styles.modalTimeText}>{selectedSession.time}</Text>
            </View>

            <Text style={styles.modalTitle}>{selectedSession.title}</Text>
            <Text style={styles.modalMeta}>
              {selectedSession.room} • {selectedSession.teacher}
            </Text>

            {/* Materials Section */}
            {selectedSession.materials && selectedSession.materials.length > 0 && (
              <View style={styles.materialsBox}>
                <Text style={styles.sectionHeading}>Materials & Resources</Text>
                {selectedSession.materials.map((mat, idx) => (
                  <View key={idx} style={styles.materialItem}>
                    <Ionicons name="document-text-outline" size={14} color="#2563EB" />
                    <Text style={styles.materialText}>{mat}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pre-learning Question */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>PRE-LEARNING QUESTION / INQUIRY</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Write your preliminary inquiry here..."
                placeholderTextColor="#94A3B8"
                value={preQuestionInput}
                onChangeText={setPreQuestionInput}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Post-learning Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>POST-LEARNING REFLECTION & NOTES</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What did you learn in this session?..."
                placeholderTextColor="#94A3B8"
                value={postNoteInput}
                onChangeText={setPostNoteInput}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.saveProgressBtn}
              onPress={handleSaveProgress}
              activeOpacity={0.8}
            >
              <Text style={styles.saveProgressBtnText}>Save Session Progress</Text>
            </TouchableOpacity>
          </View>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 999,
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
    marginBottom: 20,
  },
  pageTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
  },
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  profileLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#1B2D4F',
    marginBottom: 4,
  },
  profileDetails: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: '#78716C',
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  navButtonDisabled: {
    backgroundColor: '#FAF8F5',
    borderColor: '#E5E0D8',
    shadowOpacity: 0,
    elevation: 0,
  },
  navButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1B2D4F',
  },
  navButtonTextDisabled: {
    color: '#E5E0D8',
  },
  dateCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRangeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#1B2D4F',
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessageText: {
    fontFamily: FONTS.titleMedium,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    color: '#0F172A',
    textAlign: 'center',
  },
  /* Days list & session cards */
  daysList: {
    gap: 20,
  },
  daySection: {
    gap: 8,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dayTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNameText: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1B2D4F',
  },
  dayNameToday: {
    color: '#2563EB',
  },
  dayNameFuture: {
    color: '#94A3B8',
  },
  todayBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lockedBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  noDaySessionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    alignItems: 'center',
  },
  noDaySessionText: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#78716C',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...SHADOWS.sm,
  },
  sessionCardLocked: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E4E4E7',
    opacity: 0.75,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  courseCodeBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  sessionTimeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  sessionTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2D4F',
    lineHeight: 20,
    marginBottom: 4,
  },
  sessionTitleTextLocked: {
    color: '#78716C',
  },
  sessionMetaText: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#78716C',
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressPillDone: {
    backgroundColor: '#DCFCE7',
  },
  progressPillPending: {
    backgroundColor: '#FEF3C7',
  },
  progressPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPillTextDone: {
    color: '#15803D',
  },
  progressPillTextPending: {
    color: '#B45309',
  },
  /* Modal Content */
  modalContent: {
    paddingBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTimeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 4,
  },
  modalMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  materialsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  materialText: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  saveProgressBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveProgressBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

export default WeeklyPlanScreen;
