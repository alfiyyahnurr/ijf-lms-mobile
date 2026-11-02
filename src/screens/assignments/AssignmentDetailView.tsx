import React, { useState } from 'react';
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
import { Assignment } from '../../types';
import CustomButton from '../../components/common/CustomButton';
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

        {/* Success Toast Indicator if just submitted */}
        <ToastAlert
          visible={successToast}
          message="Assignment successfully submitted! Status updated."
          type="success"
          floating
          onClose={() => setSuccessToast(false)}
        />

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
                <CustomButton
                  title={isSubmitting ? 'Uploading...' : 'Submit Assignment'}
                  variant="primary"
                  size="md"
                  icon="cloud-upload"
                  fullWidth
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
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

          <View style={styles.detailItem}>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
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
    marginBottom: 14,
  },
  detailLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#0F172A',
  },
  detailValueExpired: {
    color: '#EF4444',
  },
  detailValueNormal: {
    color: '#0F172A',
  },
  uploadForm: {
    marginTop: 4,
  },
  uploadPrompt: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  dropZone: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dropZoneMain: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#2563EB',
  },
  dropZoneSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  fileSelectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedFileName: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#0F172A',
  },
  selectedFileSize: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 6,
  },
  inputLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    color: '#0F172A',
    marginBottom: 6,
  },
  noteInput: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    marginBottom: 16,
  },
  actionRow: {
    marginTop: 4,
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
