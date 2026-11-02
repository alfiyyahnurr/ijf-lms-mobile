import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudentData } from '../../context/StudentDataContext';
import AppHeader from '../../components/navigation/AppHeader';
import ToastAlert from '../../components/feedback/ToastAlert';
import { FONTS, SHADOWS } from '../../constants/theme';

export const ReportCardScreen: React.FC = () => {
  const { grades } = useStudentData();
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Simulates GET /api/student/report-cards/:id/pdf
      await new Promise((resolve) => setTimeout(resolve, 800));
      setToastMessage('Report Card PDF downloaded successfully!');
    } catch (err: any) {
      setToastMessage('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Report Card" />

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
      >
        {/* Header Title matching Screenshot 110209 */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Report Card</Text>
          <Text style={styles.pageSubtitle}>Published term reports and their history</Text>
        </View>

        {/* Download Term PDF Button matching Postman /api/student/report-cards/:id/pdf */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadPdf}
          activeOpacity={0.8}
          disabled={downloading}
          accessibilityLabel="Download Report Card PDF"
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.downloadBtnContent}>
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Download Term 1 Report Card (PDF)</Text>
            </View>
          )}
        </TouchableOpacity>

        {grades.length === 0 ? (
          /* Clean Status Card matching Screenshot 110209 */
          <View style={styles.statusCard}>
            <Text style={styles.statusCardText}>
              Your report card has not been published yet.
            </Text>
          </View>
        ) : (
          <View style={styles.gradesList}>
            {grades.map((grade) => (
              <View key={grade.subject} style={styles.gradeCard}>
                <Text style={styles.subjectText}>{grade.subject}</Text>
                <Text style={styles.scoreText}>{grade.score} ({grade.grade})</Text>
              </View>
            ))}
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
  downloadBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  downloadBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadBtnText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...SHADOWS.sm,
  },
  statusCardText: {
    fontSize: 14.5,
    fontFamily: FONTS.medium,
    color: '#334155',
    lineHeight: 22,
  },
  gradesList: {
    gap: 12,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontFamily: FONTS.title,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
});

export default ReportCardScreen;
