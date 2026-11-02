import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
import { FONTS, SHADOWS } from '../../constants/theme';
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

  // Auto-close assignment detail when navigating away to other bottom tabs
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedAssignment(null);
      };
    }, [])
  );

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
            /* Cards List matching Screenshot 110036 */
            <View style={styles.cardList}>
              {assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => handleSelectAssignment(assignment)}
                  activeOpacity={0.75}
                  style={styles.assignmentCard}
                >
                  {/* Title */}
                  <Text style={styles.assignmentTitle} numberOfLines={2}>
                    {assignment.title}
                  </Text>

                  {/* Course and Due Date */}
                  <Text style={styles.assignmentSubtitle} numberOfLines={2}>
                    {assignment.course} • Due: {assignment.dueDate}
                  </Text>

                  {/* Status pill located UNDER subtitle */}
                  <View style={styles.statusPillRow}>
                    <View
                      style={
                        assignment.status === 'pending'
                          ? styles.pendingPill
                          : styles.submittedPill
                      }
                    >
                      <Text
                        style={
                          assignment.status === 'pending'
                            ? styles.pendingPillText
                            : styles.submittedPillText
                        }
                      >
                        {assignment.status}
                      </Text>
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
    padding: 18,
    ...SHADOWS.sm,
  },
  assignmentTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 6,
  },
  assignmentSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pendingPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#C2410C',
  },
  submittedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  submittedPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
});

export default AssignmentsScreen;
