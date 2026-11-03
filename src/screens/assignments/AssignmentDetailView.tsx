import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';
import { Assignment } from '../../types';
import ToastAlert from '../../components/feedback/ToastAlert';

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onBack: () => void;
  onSubmitSuccess?: (assignmentId: number, note?: string) => void;
  backLabel?: string;
}

export const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({
  assignment,
  onBack,
  onSubmitSuccess,
  backLabel = 'Back to Course',
}) => {
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'submitted'>(
    assignment.status === 'submitted' ? 'submitted' : 'pending'
  );
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Check if deadline has passed (e.g. Sep / Aug / Jul 2026 are expired in academic timeline)
  const isDeadlinePassed = (() => {
    const due = assignment.dueDate.toLowerCase();
    return due.includes('sep') || due.includes('aug') || due.includes('jul');
  })();

  const formatFullDueDate = (due: string) => {
    return due
      .replace('Sep', 'September')
      .replace('Aug', 'August')
      .replace('Jul', 'July')
      .replace('Oct', 'October')
      .replace('Nov', 'November')
      .replace('Dec', 'December');
  };

  const handleAttachMockFile = () => {
    setAttachedFile(`${assignment.title.split('—')[0].trim()}_Solution_Fatih.pdf`);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = () => {
    if (isDeadlinePassed) {
      alert('The deadline for this assignment has passed. Submission is closed.');
      return;
    }

    if (!attachedFile && !submissionNote.trim()) {
      alert('Please attach a document or enter submission notes before submitting.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionStatus('submitted');
      setSuccessToast(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(assignment.id, submissionNote);
      }
    }, 700);
  };

  const getInstructions = () => {
    const subject = assignment.course.split(' — ')[0]?.trim() || assignment.course;
    return `Apply Term 1 concepts in a short project or written response for ${subject}.`;
  };

  return (
    <View style={styles.container}>
      {/* Success Toast Indicator if submitted in standalone mode */}
      {!onSubmitSuccess && (
        <ToastAlert
          visible={successToast}
          message="Assignment successfully submitted! Status updated."
          type="success"
          floating
          topOffset={Platform.OS === 'ios' ? 76 : 68}
          onClose={() => setSuccessToast(false)}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button matching Gambar 1: "← Back to Course" */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel={backLabel}
        >
          <Ionicons name="arrow-back" size={17} color="#475569" />
          <Text style={styles.backButtonText}>{backLabel}</Text>
        </TouchableOpacity>

        {/* Assignment Header Block matching Gambar 1 */}
        <View style={styles.headerBlock}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            {submissionStatus === 'submitted' ? (
              <View style={styles.submittedPill}>
                <Text style={styles.submittedPillText}>Submitted</Text>
              </View>
            ) : (
              <View style={styles.notSubmittedPill}>
                <Text style={styles.notSubmittedPillText}>Not{'\n'}submitted</Text>
              </View>
            )}
          </View>
          <Text style={styles.courseSubtitle}>{assignment.course}</Text>
        </View>

        {/* Card 1: Instructions matching Gambar 1 */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Instructions</Text>
          <Text style={styles.instructionBody}>{getInstructions()}</Text>
        </View>

        {/* Card 2: Deadline Passed / Submission Status matching Gambar 1 & 2 */}
        {isDeadlinePassed ? (
          <View style={[styles.card, styles.centerCard]}>
            <View style={styles.alertCircle}>
              <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.deadlineTitle}>Deadline Passed</Text>
            <Text style={styles.deadlineSub}>
              The submission deadline has passed. You can no longer submit this assignment.
            </Text>
          </View>
        ) : submissionStatus === 'submitted' ? (
          <View style={[styles.card, styles.centerCard]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark-done" size={28} color="#16A34A" />
            </View>
            <Text style={styles.deadlineTitle}>Submission Received</Text>
            <Text style={styles.deadlineSub}>
              Your solution has been submitted for evaluation. You can review your attached file below.
            </Text>
            {attachedFile && (
              <View style={styles.attachedFilePill}>
                <Ionicons name="document-text" size={18} color="#2563EB" />
                <Text style={styles.attachedFileName} numberOfLines={1}>
                  {attachedFile}
                </Text>
                <Text style={styles.attachedFileSize}>1.8 MB</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Submission</Text>
            <View style={styles.uploadForm}>
              <Text style={styles.uploadPrompt}>Attach Solution Document</Text>
              {attachedFile ? (
                <View style={styles.fileSelectedBox}>
                  <View style={styles.fileSelectedLeft}>
                    <Ionicons name="document-attach" size={24} color="#2563EB" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {attachedFile}
                      </Text>
                      <Text style={styles.selectedFileSize}>1.8 MB • Ready to submit</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleRemoveFile}
                    style={styles.removeFileBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropZone}
                  onPress={handleAttachMockFile}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#2563EB" />
                  </View>
                  <Text style={styles.dropZoneMain}>Tap to attach file</Text>
                  <Text style={styles.dropZoneSub}>PDF, DOCX, ZIP (Max 25 MB)</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.inputLabel}>Submission Notes (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add any notes or explanations for your teacher..."
                placeholderTextColor="#94A3B8"
                value={submissionNote}
                onChangeText={setSubmissionNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (isSubmitting || isDeadlinePassed) && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={isSubmitting || isDeadlinePassed}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="cloud-upload" size={19} color="#FFFFFF" style={styles.submitButtonIcon} />
                  )}
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Card 3: Details matching Gambar 2 */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Details</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={[styles.detailValue, isDeadlinePassed ? styles.detailValueExpired : styles.detailValueNormal]}>
              {formatFullDueDate(assignment.dueDate)} {isDeadlinePassed ? '(expired)' : ''}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Max Score</Text>
            <Text style={styles.detailValue}>100.00</Text>
          </View>

          <View style={[styles.detailItem, { marginBottom: 0 }]}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>Individual</Text>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#475569',
  },
  headerBlock: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  assignmentTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 32,
    letterSpacing: 0,
  },
  notSubmittedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notSubmittedPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#9A3412',
    textAlign: 'center',
    lineHeight: 15,
  },
  submittedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submittedPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    textAlign: 'center',
  },
  courseSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14.5,
    color: '#64748B',
    marginTop: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  centerCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  instructionBody: {
    fontFamily: FONTS.regular,
    fontSize: 14.5,
    color: '#475569',
    lineHeight: 22,
  },
  alertCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deadlineTitle: {
    fontFamily: FONTS.title,
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  deadlineSub: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 15.5,
    color: '#0F172A',
  },
  detailValueExpired: {
    color: '#EF4444',
  },
  detailValueNormal: {
    color: '#0F172A',
  },
  uploadForm: {
    marginTop: 2,
  },
  uploadPrompt: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#334155',
    marginBottom: 10,
  },
  dropZone: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    ...SHADOWS.sm,
  },
  dropZoneMain: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#2563EB',
    marginBottom: 3,
  },
  dropZoneSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
  },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  fileSelectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedFileName: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  selectedFileSize: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 6,
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#334155',
    marginBottom: 8,
  },
  noteInput: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 88,
    marginBottom: 18,
    lineHeight: 20,
  },
  actionRow: {
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: COLORS.accentBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonIcon: {
    marginRight: 2,
  },
  submitButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  attachedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    maxWidth: 280,
  },
  attachedFileName: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#1E293B',
    flex: 1,
  },
  attachedFileSize: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#64748B',
  },
});

export default AssignmentDetailView;
