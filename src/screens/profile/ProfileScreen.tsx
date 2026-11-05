import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useStudentData } from '../../context/StudentDataContext';
import AppHeader from '../../components/navigation/AppHeader';
import { FONTS, SHADOWS } from '../../constants/theme';

export const ProfileScreen: React.FC = () => {
  const { studentProfile } = useStudentData();
  const navigation = useNavigation<any>();
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
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.resetKey) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey]);

  const initials = studentProfile.fullName
    ? studentProfile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'ST';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Profile" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title matching Screenshot 110531 */}
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageSubtitle}>Your student information</Text>
        </View>

        {/* Profile Card matching Screenshot 110531 */}
        <View style={styles.profileCard}>
          {/* Top Row: Avatar + Name + Email */}
          <View style={styles.topRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
            <View style={styles.topDetails}>
              <Text style={styles.studentName}>{studentProfile.fullName}</Text>
              <Text style={styles.studentEmail}>{studentProfile.email}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SCHOOL</Text>
              <Text style={styles.fieldValue}>{studentProfile.schoolName}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CLASS</Text>
              <Text style={styles.fieldValue}>{studentProfile.className}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ACADEMIC YEAR</Text>
              <Text style={styles.fieldValue}>{studentProfile.academicYearName || 'Academic Year 7'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STUDENT ID</Text>
              <Text style={styles.fieldValue}>{studentProfile.studentId}</Text>
            </View>

            {studentProfile.house && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>HOUSE</Text>
                <Text style={styles.fieldValue}>{studentProfile.house}</Text>
              </View>
            )}
          </View>
        </View>
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
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitial: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 19,
    fontFamily: FONTS.title,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  fieldsContainer: {
    gap: 20,
  },
  fieldGroup: {},
  fieldLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    color: '#0F172A',
  },
});

export default ProfileScreen;
