import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';
import { Course, CourseSession, CourseSessionDetail, Assignment, Quiz, SubjectGrade } from '../../types';
import {
  ASSIGNMENTS_DATA,
  QUIZZES_DATA,
  GRADES_DATA,
  getCourseSessions,
  getCourseSessionDetail,
} from '../../data/mockData';
import AssignmentDetailView from '../assignments/AssignmentDetailView';
import SessionDetailView from './SessionDetailView';
import CalendarDatePickerModal from '../../components/modals/CalendarDatePickerModal';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
}

type TabType = 'overview' | 'sessions' | 'assignments' | 'quizzes' | 'grade' | 'forums';

export type PrePostOption = 'any' | 'has_pre' | 'has_post' | 'has_pre_or_post' | 'in_class_only';

const PRE_POST_OPTIONS: { key: PrePostOption; label: string }[] = [
  { key: 'any', label: 'Any' },
  { key: 'has_pre', label: 'Has Pre' },
  { key: 'has_post', label: 'Has Post' },
  { key: 'has_pre_or_post', label: 'Has Pre or Post' },
  { key: 'in_class_only', label: 'In-class only' },
];

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSession, setSelectedSession] = useState<CourseSessionDetail | null>(null);
  // Initial state null so sessions are closed by default
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Multi-select status filter
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [prePostFilter, setPrePostFilter] = useState<PrePostOption>('any');
  const [isPrePostDropdownOpen, setIsPrePostDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to'>('from');
  const scrollRef = useRef<any>(null);

  // Reset any open session accordion and subviews when course changes or mounts
  useEffect(() => {
    setExpandedSessionId(null);
    setSelectedSession(null);
    setSelectedAssignment(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [course.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  const toggleStatus = (st: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setPrePostFilter('any');
    setFromDate('');
    setToDate('');
    setIsPrePostDropdownOpen(false);
  };

  // Active filter category count (Status, Pre/Post, From, To)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatuses.length > 0) count += 1;
    if (prePostFilter !== 'any') count += 1;
    if (fromDate.trim().length > 0) count += 1;
    if (toDate.trim().length > 0) count += 1;
    return count;
  }, [selectedStatuses, prePostFilter, fromDate, toDate]);

  const handleBack = () => {
    setExpandedSessionId(null);
    setSelectedSession(null);
    setSelectedAssignment(null);
    onBack();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setExpandedSessionId(null);
  };

  // Helper to parse date string into timestamp for range comparison
  const parseToTimestamp = (dateStr: string): number | null => {
    if (!dateStr || !dateStr.trim()) return null;
    const trimmed = dateStr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return isNaN(d.getTime()) ? null : d.getTime();
      }
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  // 10 Sessions data for this course
  const allSessions = useMemo(() => {
    return getCourseSessions(course.id, course.name, course.sessions);
  }, [course.id, course.name, course.sessions]);

  // Filtered sessions with multi-status, pre/post learning, and date range comparison
  const filteredSessions = useMemo(() => {
    const fromTime = parseToTimestamp(fromDate);
    const toTime = parseToTimestamp(toDate);

    return allSessions.filter((s) => {
      const matchesSearch = !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);

      let matchesPrePost = true;
      if (prePostFilter === 'has_pre') {
        matchesPrePost = Boolean(s.hasPreLearning);
      } else if (prePostFilter === 'has_post') {
        matchesPrePost = Boolean(s.hasPostLearning);
      } else if (prePostFilter === 'has_pre_or_post') {
        matchesPrePost = Boolean(s.hasPreLearning || s.hasPostLearning);
      } else if (prePostFilter === 'in_class_only') {
        matchesPrePost = !s.hasPreLearning && !s.hasPostLearning;
      }

      const sessionTime = parseToTimestamp(s.date);
      const matchesFromDate = !fromTime || (sessionTime !== null && sessionTime >= fromTime);
      const matchesToDate = !toTime || (sessionTime !== null && sessionTime <= toTime);

      return matchesSearch && matchesStatus && matchesPrePost && matchesFromDate && matchesToDate;
    });
  }, [allSessions, searchQuery, selectedStatuses, prePostFilter, fromDate, toDate]);

  // Assignments for this course
  const courseAssignments: Assignment[] = useMemo(() => {
    const codeKey = course.code.toLowerCase().replace('_ig', '');
    const namePrefix = course.name.split(' ')[0].toLowerCase();
    return ASSIGNMENTS_DATA.filter((a) => {
      const aCourse = a.course.toLowerCase();
      const aTitle = a.title.toLowerCase();
      return (
        aCourse.includes(course.name.toLowerCase()) ||
        aCourse.includes(namePrefix) ||
        aTitle.includes(namePrefix) ||
        aCourse.includes(codeKey)
      );
    });
  }, [course]);

  // Quizzes for this course
  const courseQuizzes: Quiz[] = useMemo(() => {
    const codeKey = course.code.toLowerCase().replace('_ig', '');
    const namePrefix = course.name.split(' ')[0].toLowerCase();
    return QUIZZES_DATA.filter((q) => {
      const qCourse = q.course.toLowerCase();
      const qTitle = q.title.toLowerCase();
      return (
        qCourse.includes(course.name.toLowerCase()) ||
        qCourse.includes(namePrefix) ||
        qTitle.includes(namePrefix) ||
        qCourse.includes(codeKey)
      );
    });
  }, [course]);

  // Grade for this course
  const courseGrade: SubjectGrade | undefined = useMemo(() => {
    const codeKey = course.code.toLowerCase().replace('_ig', '');
    const namePrefix = course.name.split(' ')[0].toLowerCase();
    return GRADES_DATA.find((g) => {
      const gSub = g.subject.toLowerCase();
      const gCode = g.code.toLowerCase();
      return gCode.includes(codeKey) || gSub.includes(namePrefix);
    });
  }, [course]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'grade', label: 'My Grade' },
    { key: 'forums', label: 'Forums' },
  ];

  if (selectedAssignment) {
    return (
      <AssignmentDetailView
        assignment={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
        backLabel="Back to Course"
      />
    );
  }

  if (selectedSession) {
    return (
      <SessionDetailView
        session={selectedSession}
        onBack={() => {
          setSelectedSession(null);
          setExpandedSessionId(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Back Button matching Screenshot: "← Back to Courses" */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to Courses"
        >
          <Ionicons name="arrow-back" size={17} color="#475569" />
          <Text style={styles.backButtonText}>Back to Courses</Text>
        </TouchableOpacity>

        {/* 2. Course Header Banner matching Screenshot (Pure Card mode, no toggle) */}
        <View style={styles.headerBlock}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.courseTitle}>{course.name}</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>active</Text>
            </View>
          </View>

          <Text style={styles.courseSubtitle}>
            {course.class || 'S4 Oxford'} • {course.teacher === 'No teacher assigned' ? 'No teacher' : (course.teacher || 'No teacher')}
          </Text>
        </View>

        {/* 3. Horizontal Underline Tabs matching Screenshot */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => handleTabChange(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab 1: Overview matching Image 1 */}
        {activeTab === 'overview' && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewSection}>
              <Text style={styles.overviewLabel}>TEACHER</Text>
              <Text style={styles.overviewValue}>{course.teacher || 'No teacher assigned'}</Text>
            </View>

            <View style={styles.overviewSection}>
              <Text style={styles.overviewLabel}>CLASS</Text>
              <Text style={styles.overviewValue}>{course.class || 'S4 Oxford'}</Text>
            </View>

            <View style={styles.overviewSection}>
              <Text style={styles.overviewLabel}>DESCRIPTION</Text>
              <Text style={styles.overviewValueMuted}>
                {course.description || 'No course description yet.'}
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewFooterRow}>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewLabel}>SESSIONS</Text>
                <Text style={styles.overviewStatValue}>{course.sessions}</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewLabel}>CURRICULUM</Text>
                <Text style={styles.overviewStatValue}>{course.curriculum || 'Kurikulum Merdeka'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Sessions matching Image 2, 3, & 5 */}
        {activeTab === 'sessions' && (
          <View style={styles.sessionsContainer}>
            {/* Search & Advanced Filter Card */}
            <View style={styles.searchCard}>
              <Text style={styles.searchCardTitle}>Search sessions</Text>
              <View style={styles.searchInputWrap}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Action Buttons Row: Advanced & Clear */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.advancedBtn, isAdvancedOpen && styles.advancedBtnActive]}
                  onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="funnel-outline"
                    size={15}
                    color={isAdvancedOpen ? '#2563EB' : '#475569'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.advancedBtnText, isAdvancedOpen && styles.advancedBtnTextActive]}>
                    Advanced
                  </Text>
                  {isAdvancedOpen && activeFilterCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isAdvancedOpen ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={isAdvancedOpen ? '#2563EB' : '#475569'}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                {isAdvancedOpen && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={handleClearFilters}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={15} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Advanced Filter Collapsible Section (matching Screenshots) */}
              {isAdvancedOpen && (
                <View style={styles.advancedContent}>
                  {/* Status Pills */}
                  <Text style={styles.filterSectionTitle}>Status</Text>
                  <View style={styles.statusPillsRow}>
                    {(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map((st) => {
                      const labels: Record<string, string> = {
                        scheduled: 'Scheduled',
                        in_progress: 'In Progress',
                        completed: 'Completed',
                        cancelled: 'Cancelled',
                      };
                      const isSel = selectedStatuses.includes(st);
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[styles.filterStatusPill, isSel && styles.filterStatusPillActive]}
                          onPress={() => toggleStatus(st)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.filterStatusPillText, isSel && styles.filterStatusPillTextActive]}>
                            {labels[st]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Pre / Post Learning Select */}
                  <Text style={[styles.filterSectionTitle, { marginTop: 14 }]}>Pre / Post learning</Text>
                  <TouchableOpacity
                    style={styles.selectDropdown}
                    onPress={() => setIsPrePostDropdownOpen(!isPrePostDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectDropdownText}>
                      {PRE_POST_OPTIONS.find((opt) => opt.key === prePostFilter)?.label || 'Any'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#475569" />
                  </TouchableOpacity>

                  {/* Dropdown Menu Options matching Image 2 */}
                  {isPrePostDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {PRE_POST_OPTIONS.map((opt) => {
                        const isSelected = prePostFilter === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                            onPress={() => {
                              setPrePostFilter(opt.key);
                              setIsPrePostDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Date Range Inputs ("From" & "To") */}
                  <View style={styles.dateRangeRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.filterSectionTitle}>From</Text>
                      <TouchableOpacity
                        style={styles.datePickerField}
                        onPress={() => {
                          setDatePickerTarget('from');
                          setIsDatePickerOpen(true);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.datePickerValueText, !fromDate && styles.datePickerPlaceholder]}>
                          {fromDate || 'dd/mm/yyyy'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dateCol}>
                      <Text style={styles.filterSectionTitle}>To</Text>
                      <TouchableOpacity
                        style={styles.datePickerField}
                        onPress={() => {
                          setDatePickerTarget('to');
                          setIsDatePickerOpen(true);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.datePickerValueText, !toDate && styles.datePickerPlaceholder]}>
                          {toDate || 'dd/mm/yyyy'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Showing summary text */}
              <Text style={styles.showingCounterText}>
                Showing {filteredSessions.length} of {allSessions.length} sessions
              </Text>
            </View>

            {/* Individual Session Cards or Empty Filter State matching Image 4 */}
            {filteredSessions.length === 0 ? (
              <View style={styles.emptySessionsContainer}>
                <Text style={styles.emptySessionsText}>
                  No sessions match your filters.
                </Text>
                {(searchQuery.trim().length > 0 || selectedStatuses.length > 0 || prePostFilter !== 'any' || fromDate !== '' || toDate !== '') && (
                  <TouchableOpacity
                    style={styles.resetFiltersBtn}
                    onPress={handleClearFilters}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredSessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const detail = isExpanded ? getCourseSessionDetail(session, course) : null;

              return (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Top Clickable Header Row */}
                  <TouchableOpacity
                    style={styles.sessionCardHeader}
                    onPress={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    activeOpacity={0.75}
                    accessibilityLabel={`Session ${session.title}`}
                  >
                    {/* Left Blue Circle */}
                    <View style={styles.sessionCircle}>
                      <Text style={styles.sessionCircleNumber}>{session.sessionNumber}</Text>
                    </View>

                    {/* Center Content */}
                    <View style={styles.sessionCenterWrap}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text style={styles.sessionDate}>{session.date}</Text>
                      <View style={styles.tagsRow}>
                        {session.hasPreLearning && (
                          <View style={styles.preTag}>
                            <Text style={styles.preTagText}>Pre</Text>
                          </View>
                        )}
                        {session.hasPostLearning && (
                          <View style={styles.postTag}>
                            <Text style={styles.postTagText}>Post</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Right Status Pill & Chevron */}
                    <View style={styles.sessionRightWrap}>
                      <View style={styles.scheduledPill}>
                        <Text style={styles.scheduledPillText}>{session.status}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isExpanded ? '#2563EB' : '#94A3B8'}
                        style={{ marginTop: 6 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Dropdown Details matching Screenshots 1 & 2 */}
                  {isExpanded && detail && (
                    <View style={styles.accordionBody}>
                      {/* Sub-Card 1: BEFORE CLASS */}
                      <View style={styles.accBeforeClassCard}>
                        <Text style={styles.accTagAmber}>BEFORE CLASS</Text>
                        <Text style={styles.accActivityHeading}>
                          {detail.beforeClass.activityType}{' '}
                          <Text style={styles.accActivityDuration}>· {detail.beforeClass.duration}</Text>
                        </Text>
                        <Text style={styles.accBodyText}>{detail.beforeClass.prompt}</Text>
                        <TouchableOpacity style={styles.accResourceLink} activeOpacity={0.7}>
                          <Text style={styles.accResourceLinkText}>Open resource →</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sub-Card 2: LEARNING OBJECTIVES */}
                      <View style={styles.accNeutralCard}>
                        <Text style={styles.accTagNeutral}>LEARNING OBJECTIVES</Text>
                        <Text style={styles.accBodyTextDark}>{detail.learningObjectives}</Text>
                      </View>

                      {/* Sub-Card 3: IN CLASS */}
                      <View style={styles.accNeutralCard}>
                        <Text style={styles.accTagNeutral}>IN CLASS</Text>
                        <Text style={styles.accBodyTextDark}>{detail.inClassContent}</Text>
                      </View>

                      {/* Sub-Card 4: AFTER CLASS */}
                      <View style={styles.accAfterClassCard}>
                        <Text style={styles.accTagGreen}>AFTER CLASS</Text>
                        <Text style={styles.accActivityHeading}>
                          {detail.afterClass.activityType}{' '}
                          <Text style={styles.accActivityDuration}>· {detail.afterClass.duration}</Text>
                        </Text>
                        <Text style={styles.accBodyText}>{detail.afterClass.prompt}</Text>
                      </View>

                      {/* Open Full Session Action Link matching Screenshot 2 */}
                      <TouchableOpacity
                        style={styles.openFullSessionBtn}
                        onPress={() => setSelectedSession(detail)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.openFullSessionText}>Open full session →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }))}
          </View>
        )}

        {/* Tab 3: Assignments matching Image 4 */}
        {activeTab === 'assignments' && (
          <View style={styles.assignmentsContainer}>
            {courseAssignments.length === 0 ? (
              <View style={styles.emptyCenteredContainer}>
                <Text style={styles.emptyCenteredText}>No assignments assigned yet.</Text>
              </View>
            ) : (
              courseAssignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.assignmentCard}
                  onPress={() => setSelectedAssignment(assignment)}
                  activeOpacity={0.7}
                >
                  <View style={styles.assignmentTopRow}>
                    <Text style={styles.assignmentTitle} numberOfLines={2}>
                      {assignment.title}
                    </Text>
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingPillText}>{assignment.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentDueDate}>Due: {assignment.dueDate}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab 4: Quizzes */}
        {activeTab === 'quizzes' && (
          <View style={styles.quizzesContainer}>
            {courseQuizzes.length === 0 ? (
              <View style={styles.emptyCenteredContainer}>
                <Text style={styles.emptyCenteredText}>No checkpoint quizzes yet.</Text>
              </View>
            ) : (
              courseQuizzes.map((quiz) => (
                <View key={quiz.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentTopRow}>
                    <Text style={styles.assignmentTitle}>{quiz.title}</Text>
                    <View style={styles.scheduledPill}>
                      <Text style={styles.scheduledPillText}>{quiz.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentDueDate}>
                    {quiz.questions} Questions • {quiz.duration}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 5: My Grade matching Image 6 (100% Identik) */}
        {activeTab === 'grade' && (
          <View style={styles.emptyCenteredContainer}>
            <Text style={styles.emptyCenteredText}>No grades recorded yet.</Text>
          </View>
        )}

        {/* Tab 6: Forums matching Image 7 (100% Identik) */}
        {activeTab === 'forums' && (
          <View style={styles.emptyCenteredContainer}>
            <Text style={styles.emptyCenteredText}>No discussion forums yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Interactive Calendar Date Picker Modal */}
      <CalendarDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        title={datePickerTarget === 'from' ? 'Select Start Date (From)' : 'Select End Date (To)'}
        initialDate={datePickerTarget === 'from' ? fromDate : toDate}
        onSelectDate={(selected) => {
          if (datePickerTarget === 'from') {
            setFromDate(selected);
          } else {
            setToDate(selected);
          }
        }}
      />
    </View>
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
    paddingTop: 12,
    paddingBottom: 108,
  },

  /* Back Button */
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#475569',
    marginLeft: 6,
  },

  /* Header Block */
  headerBlock: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  courseTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
    flex: 1,
    marginRight: 10,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activePillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  courseSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },

  /* Horizontal Underline Tabs */
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 18,
  },
  tabsScrollContent: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
  },
  tabButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabButtonTextActive: {
    fontFamily: FONTS.bold,
    color: '#2563EB',
    fontWeight: '700',
  },

  /* Tab 1: Overview Card */
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    ...SHADOWS.sm,
  },
  overviewSection: {
    marginBottom: 16,
  },
  overviewLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  overviewValue: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  overviewValueMuted: {
    fontFamily: FONTS.regular,
    fontSize: 14.5,
    color: '#94A3B8',
  },
  overviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  overviewFooterRow: {
    flexDirection: 'row',
  },
  overviewCol: {
    flex: 1,
  },
  overviewStatValue: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Tab 2: Sessions */
  sessionsContainer: {
    gap: 12,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  searchCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  searchInputWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  advancedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  advancedBtnActive: {
    borderColor: '#2563EB',
  },
  advancedBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  advancedBtnTextActive: {
    color: '#2563EB',
  },
  filterBadge: {
    backgroundColor: '#2563EB',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  clearBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
  },
  advancedContent: {
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterStatusPill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  filterStatusPillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterStatusPillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#64748B',
  },
  filterStatusPillTextActive: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#2563EB',
  },
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  selectDropdownText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
    ...SHADOWS.md,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownItemSelected: {
    backgroundColor: '#2563EB',
  },
  dropdownItemText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#0F172A',
  },
  dropdownItemTextSelected: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateCol: {
    flex: 1,
  },
  datePickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 42,
  },
  datePickerValueText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#0F172A',
  },
  datePickerPlaceholder: {
    color: '#94A3B8',
  },
  showingCounterText: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 14,
  },
  emptySessionsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySessionsText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  resetFiltersBtn: {
    marginTop: 14,
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFiltersBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Session Cards */
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sessionCircleNumber: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  sessionCenterWrap: {
    flex: 1,
    marginRight: 10,
  },
  sessionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  sessionDate: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  preTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  preTagText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  postTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  postTagText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  sessionRightWrap: {
    alignItems: 'flex-end',
  },
  scheduledPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  scheduledPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1D4ED8',
  },

  /* Accordion Dropdown Styles (Screenshots 1 & 2) */
  accordionBody: {
    marginTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  accBeforeClassCard: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
  },
  accTagAmber: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  accActivityHeading: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  accActivityDuration: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
  },
  accBodyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 8,
  },
  accResourceLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  accResourceLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  accNeutralCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
  },
  accTagNeutral: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  accBodyTextDark: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 19,
  },
  accAfterClassCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  accTagGreen: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  openFullSessionBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 2,
    paddingVertical: 4,
  },
  openFullSessionText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Tab 3: Assignments */
  assignmentsContainer: {
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  assignmentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  assignmentTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  pendingPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
  },
  assignmentDueDate: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
  },

  /* Tab 4: Quizzes */
  quizzesContainer: {
    gap: 12,
  },

  /* Empty Centered Containers (My Grade & Forums 100% Match Image 6 & 7) */
  emptyCenteredContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyCenteredText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});

export default CourseDetailView;
