import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabParamList } from '../../types/navigation';
import { useStudentData } from '../../context/StudentDataContext';
import { Assignment } from '../../types';
import AppHeader from '../../components/navigation/AppHeader';
import ToastAlert from '../../components/feedback/ToastAlert';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import CardSkeleton from '../../components/feedback/CardSkeleton';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import AssignmentDetailView from './AssignmentDetailView';

export const AssignmentsScreen: React.FC = () => {
  const {
    assignments,
    isLoading,
    isRefreshing,
    isError,
    errorMessage,
    refreshAllData,
  } = useStudentData();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<BottomTabParamList, 'AssignmentsTab'>>();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<any>(null);

  // Auto-close assignment detail and scroll to top when navigating away or focusing
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        setSelectedAssignment(null);
        setToastMessage(null);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setSelectedAssignment(null);
      setToastMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if ((route.params as any)?.resetKey) {
      setSelectedAssignment(null);
      setToastMessage(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [(route.params as any)?.resetKey]);

  useEffect(() => {
    if (route.params?.assignmentId) {
      const found = assignments.find((a) => a.id === route.params?.assignmentId);
      if (found) {
        setSelectedAssignment(found);
        navigation.setParams({ isDetail: true, assignmentId: undefined });
      }
    }
  }, [route.params?.assignmentId, assignments]);

  useEffect(() => {
    if (route.params?.isDetail === false && selectedAssignment !== null) {
      setSelectedAssignment(null);
    }
  }, [route.params?.isDetail]);

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    navigation.setParams({ isDetail: true });
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    navigation.setParams({ isDetail: false, assignmentId: undefined });
  };

  const handleSubmissionSuccess = (assignmentId: number) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (target) {
      target.status = 'submitted';
    }
    setToastMessage(`Assignment "${target?.title || 'Assignment'}" successfully submitted!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Assignments" />

      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        floating
        onClose={() => setToastMessage(null)}
      />

      {selectedAssignment ? (
        <AssignmentDetailView
          assignment={selectedAssignment}
          onBack={handleBack}
          onSubmitSuccess={handleSubmissionSuccess}
          backLabel="Back to Assignments"
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshAllData}
              colors={[COLORS.accentBlue]}
              tintColor={COLORS.accentBlue}
            />
          }
        >
          {/* Header Title matching Screenshot 110036 */}
          <View style={styles.headerBox}>
            <Text style={styles.pageTitle}>Assignments</Text>
            <Text style={styles.pageSubtitle}>All assignments across your courses</Text>
          </View>

          {/* Data State Guards */}
          {isLoading ? (
            <CardSkeleton count={3} variant="assignment" />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Assignments"
              subtitle={errorMessage || undefined}
              onRetry={refreshAllData}
            />
          ) : assignments.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="No Assignments"
              subtitle="You have no pending or completed assignments at the moment."
              actionLabel="Refresh List"
              onAction={refreshAllData}
            />
          ) : (
            /* Cards List matching Web assignments-list-client */
            <View style={styles.cardList}>
              {assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => handleSelectAssignment(assignment)}
                  activeOpacity={0.75}
                  style={styles.assignmentCard}
                >
                  <View style={styles.assignmentCardInner}>
                    <View style={styles.assignmentCardMain}>
                      <Text style={styles.assignmentTitle} numberOfLines={2}>
                        {assignment.title}
                      </Text>
                      <Text style={styles.assignmentSubtitle} numberOfLines={2}>
                        {assignment.course} • Due: {assignment.dueDate}
                      </Text>
                    </View>
                    <View style={styles.assignmentCardRight}>
                      {assignment.score && assignment.score !== '—' && (
                        <Text style={styles.assignmentScoreText}>{assignment.score}/100</Text>
                      )}
                      <Badge
                        color={
                          assignment.status === 'graded'
                            ? 'green'
                            : assignment.status === 'submitted'
                            ? 'blue'
                            : 'orange'
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
    top: Platform.OS === 'ios' ? 76 : 68,
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
  pageSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  cardList: {
    gap: 14,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  assignmentCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  assignmentCardMain: {
    flex: 1,
  },
  assignmentTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  assignmentSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  assignmentCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  assignmentScoreText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
});

export default AssignmentsScreen;
