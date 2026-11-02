import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CourseSessionDetail } from '../../types';
import { FONTS, SHADOWS } from '../../constants/theme';

interface SessionDetailViewProps {
  session: CourseSessionDetail;
  onBack: () => void;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({ session, onBack }) => {
  const handleOpenResource = () => {
    if (session.beforeClass.resourceUrl) {
      Linking.openURL(session.beforeClass.resourceUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Back Button matching Screenshot 3: "← Back to Course" */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to Course"
        >
          <Ionicons name="arrow-back" size={16} color="#475569" />
          <Text style={styles.backButtonText}>Back to Course</Text>
        </TouchableOpacity>

        {/* 2. Main Title and Status Badge matching Screenshot 3 */}
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle} numberOfLines={2}>
              {session.title}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{session.status}</Text>
            </View>
          </View>

          {/* Subtitle matching Screenshot 3 */}
          <Text style={styles.subtitle}>
            {session.courseName} — {session.classCode} {session.academicYear} • Session {session.sessionNumber}
          </Text>
        </View>

        {/* 3. Card 1: BEFORE CLASS matching Screenshot 3 */}
        <View style={styles.beforeClassCard}>
          <Text style={styles.cardHeaderTagAmber}>BEFORE CLASS</Text>
          <Text style={styles.activityHeading}>
            {session.beforeClass.activityType}{' '}
            <Text style={styles.activityDuration}>· {session.beforeClass.duration}</Text>
          </Text>
          <Text style={styles.cardBodyText}>{session.beforeClass.prompt}</Text>
          <TouchableOpacity
            style={styles.resourceLink}
            onPress={handleOpenResource}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceLinkText}>Open resource →</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Card 2: Learning Objectives matching Screenshot 3 */}
        <View style={styles.neutralCard}>
          <Text style={styles.neutralCardTitle}>Learning Objectives</Text>
          <Text style={styles.cardBodyText}>{session.learningObjectives}</Text>
        </View>

        {/* 5. Card 3: Content matching Screenshot 4 */}
        <View style={styles.neutralCard}>
          <Text style={styles.neutralCardTitle}>Content</Text>
          <Text style={styles.cardBodyText}>{session.inClassContent}</Text>
        </View>

        {/* 6. Card 4: Materials matching Screenshot 4 & 5 */}
        <View style={styles.neutralCard}>
          <Text style={styles.neutralCardTitle}>Materials</Text>
          {session.materials.length === 0 ? (
            <Text style={styles.emptyMaterialsText}>No materials uploaded yet.</Text>
          ) : (
            session.materials.map((file, idx) => (
              <View key={idx} style={styles.materialRow}>
                <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                <Text style={styles.materialFileName}>{file}</Text>
              </View>
            ))
          )}
        </View>

        {/* 7. Card 5: AFTER CLASS matching Screenshot 4 & 5 */}
        <View style={styles.afterClassCard}>
          <Text style={styles.cardHeaderTagGreen}>AFTER CLASS</Text>
          <Text style={styles.activityHeading}>
            {session.afterClass.activityType}{' '}
            <Text style={styles.activityDuration}>· {session.afterClass.duration}</Text>
          </Text>
          <Text style={styles.cardBodyText}>{session.afterClass.prompt}</Text>
        </View>

        {/* 8. Card 6: Session Info matching Screenshot 5 */}
        <View style={styles.neutralCard}>
          <Text style={styles.neutralCardTitle}>Session Info</Text>

          {/* Date */}
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Date</Text>
            <Text style={styles.infoFieldValue}>{session.sessionInfo.fullDate}</Text>
          </View>

          {/* Time */}
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Time</Text>
            <Text style={styles.infoFieldValue}>{session.sessionInfo.timeSlot}</Text>
          </View>

          {/* Location */}
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Location</Text>
            <Text style={styles.infoFieldValue}>{session.sessionInfo.location}</Text>
          </View>

          {/* Independent Study Pills */}
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Independent study</Text>
            <View style={styles.pillsRow}>
              {session.sessionInfo.independentStudy.map((pill, idx) => {
                const isPre = pill.toLowerCase().includes('pre');
                return (
                  <View
                    key={idx}
                    style={[
                      styles.studyPill,
                      isPre ? styles.studyPillPre : styles.studyPillPost,
                    ]}
                  >
                    <Text
                      style={[
                        styles.studyPillText,
                        isPre ? styles.studyPillTextPre : styles.studyPillTextPost,
                      ]}
                    >
                      {pill}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
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
    gap: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#475569',
  },
  headerBlock: {
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  pageTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0,
  },
  statusBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statusBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 18,
  },
  /* Card 1: BEFORE CLASS */
  beforeClassCard: {
    backgroundColor: '#FEF9C3', // Warm yellow pastel
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
  },
  cardHeaderTagAmber: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  activityHeading: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  activityDuration: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#64748B',
  },
  cardBodyText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  resourceLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resourceLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#B45309',
  },
  /* Neutral White Cards (Objectives, Content, Materials, Session Info) */
  neutralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  neutralCardTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyMaterialsText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  materialFileName: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#2563EB',
  },
  /* Card 5: AFTER CLASS */
  afterClassCard: {
    backgroundColor: '#F0FDF4', // Light green pastel
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
  },
  cardHeaderTagGreen: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  /* Session Info Key-Value Styles */
  infoField: {
    marginTop: 10,
  },
  infoFieldLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 3,
  },
  infoFieldValue: {
    fontFamily: FONTS.medium,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  studyPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  studyPillPre: {
    backgroundColor: '#FEF3C7',
  },
  studyPillPost: {
    backgroundColor: '#DCFCE7',
  },
  studyPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  studyPillTextPre: {
    color: '#B45309',
  },
  studyPillTextPost: {
    color: '#15803D',
  },
});

export default SessionDetailView;
