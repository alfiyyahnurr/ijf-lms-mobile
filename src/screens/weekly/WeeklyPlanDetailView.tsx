import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SHADOWS } from '../../constants/theme';
import { WeeklyPlanSession } from '../../types';

interface WeeklyPlanDetailViewProps {
  session: WeeklyPlanSession;
  dayName: string;
  onBack: () => void;
  onUpdateSession?: (session: WeeklyPlanSession) => void;
}

export const WeeklyPlanDetailView: React.FC<WeeklyPlanDetailViewProps> = ({
  session,
  dayName,
  onBack,
  onUpdateSession,
}) => {
  const [preDone, setPreDone] = useState<boolean>(Boolean(session.preDone));
  const [postDone, setPostDone] = useState<boolean>(Boolean(session.postDone));
  const [preQuestion, setPreQuestion] = useState<string>(session.preQuestion || '');
  const [postNote, setPostNote] = useState<string>(session.postNote || '');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<any>(null);
  const afterCardY = useRef<number>(420);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: any) => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [session.sessionId]);

  const handleTogglePreDone = () => {
    const nextVal = !preDone;
    setPreDone(nextVal);
    session.preDone = nextVal;
    if (onUpdateSession) onUpdateSession(session);
  };

  const handleTogglePostDone = () => {
    const nextVal = !postDone;
    setPostDone(nextVal);
    session.postDone = nextVal;
    if (onUpdateSession) onUpdateSession(session);
  };

  const handleSaveQuestion = (text: string) => {
    setPreQuestion(text);
    session.preQuestion = text;
    if (onUpdateSession) onUpdateSession(session);
  };

  const handleSaveReflection = (text: string) => {
    setPostNote(text);
    session.postNote = text;
    if (onUpdateSession) onUpdateSession(session);
  };

  const handleOpenResource = () => {
    Linking.openURL('https://youtube.com').catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 68 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Back Button matching Screenshot: "← Back to Weekly Plan" */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to Weekly Plan"
        >
          <Ionicons name="arrow-back" size={17} color="#475569" />
          <Text style={styles.backButtonText}>Back to Weekly Plan</Text>
        </TouchableOpacity>

        {/* Hero Card Dark Navy */}
        <View style={styles.heroCard}>
          <Text style={styles.dayLabel}>{dayName.toUpperCase()}</Text>
          <Text style={styles.courseTitle}>{session.courseName}</Text>

          <View style={styles.topicSection}>
            <Text style={styles.topicLabel}>TOPIC</Text>
            <Text style={styles.topicTitle}>{session.title}</Text>
            <Text style={styles.topicDesc}>
              By end of class: Students will engage with: {session.courseName} · Week 10
            </Text>
          </View>
        </View>

        {/* Card 1: BEFORE CLASS (Warm Amber Card) */}
        <View style={styles.beforeCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.beforeBadge}>BEFORE CLASS</Text>
              <Text style={styles.activityTitle}>
                Video / Lecture <Text style={styles.activityDuration}>· 15 min</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.markDoneBtnAmber,
                preDone && styles.markDoneBtnSolidDone,
              ]}
              onPress={handleTogglePreDone}
              activeOpacity={0.75}
            >
              {preDone && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              <Text
                style={[
                  styles.markDoneTextAmber,
                  preDone && styles.markDoneTextDoneWhite,
                ]}
              >
                {preDone ? 'Done' : 'Mark done'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.guidingQuestion}>
            Before {session.courseName}: after a short clip on "{session.title}", what is one
            idea you want to try or discuss in class?
          </Text>

          <TouchableOpacity
            style={styles.resourceLink}
            onPress={handleOpenResource}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceLinkText}>Open resource →</Text>
          </TouchableOpacity>

          <Text style={styles.inputSectionLabelAmber}>MY QUESTION FOR CLASS</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="After pre-learning, write one question to bring to class..."
            placeholderTextColor="#94A3B8"
            value={preQuestion}
            onChangeText={handleSaveQuestion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({ y: 160, animated: true });
              }, 120);
            }}
          />
        </View>

        {/* Card 2: AFTER CLASS (Soft Mint Card) */}
        <View
          style={styles.afterCard}
          onLayout={(e) => {
            afterCardY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.afterBadge}>AFTER CLASS</Text>
              <Text style={styles.activityTitle}>
                Reflection writing <Text style={styles.activityDuration}>· 10 min</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.markDoneBtnGreen,
                postDone && styles.markDoneBtnSolidDone,
              ]}
              onPress={handleTogglePostDone}
              activeOpacity={0.75}
            >
              {postDone && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              <Text
                style={[
                  styles.markDoneTextGreen,
                  postDone && styles.markDoneTextDoneWhite,
                ]}
              >
                {postDone ? 'Done' : 'Mark done'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.reflectionPrompt}>
            Reflect on today's {session.courseName} session ("{session.title}"): What went well? What
            will you try next time? Write 4–6 sentences.
          </Text>

          <Text style={styles.inputSectionLabelGreen}>MY REFLECTION AFTER CLASS</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What clicked? What do you still want to explore?"
            placeholderTextColor="#94A3B8"
            value={postNote}
            onChangeText={handleSaveReflection}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({
                  y: Math.max(540, (afterCardY.current || 420) + 120),
                  animated: true,
                });
              }, 120);
            }}
          />
        </View>

        {/* Card 3: CONTENT (Neutral Card) */}
        <View style={styles.contentCard}>
          <Text style={styles.contentLabel}>CONTENT</Text>
          <Text style={styles.contentTitle}>
            {session.courseName} Term 1 Week 10 — S4 A
          </Text>
        </View>

        {/* Footer info: Time and Room */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>
            {session.time}   {session.room || 'HS Block'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#475569',
  },
  /* Hero Card */
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    ...SHADOWS.sm,
  },
  dayLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  courseTitle: {
    fontFamily: FONTS.georgia,
    fontSize: 22,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 14,
  },
  topicSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  topicLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  topicTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 4,
  },
  topicDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },
  /* Card 1: Before Class */
  beforeCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  beforeBadge: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#B45309',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  activityTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#1E293B',
  },
  activityDuration: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
  },
  markDoneBtnAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#D97706',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markDoneBtnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markDoneBtnSolidDone: {
    backgroundColor: '#276749',
    borderColor: '#276749',
  },
  markDoneTextAmber: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#B45309',
  },
  markDoneTextGreen: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#15803D',
  },
  markDoneTextDoneWhite: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  guidingQuestion: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 12,
  },
  resourceLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  resourceLinkText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: '#D97706',
  },
  inputSectionLabelAmber: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#B45309',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  /* Card 2: After Class */
  afterCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    ...SHADOWS.sm,
  },
  afterBadge: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#15803D',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reflectionPrompt: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 16,
  },
  inputSectionLabelGreen: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#15803D',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  /* Shared Note Input */
  noteInput: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 74,
    lineHeight: 20,
  },
  /* Card 3: Content */
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  contentLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  contentTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#0F172A',
  },
  /* Footer Info */
  footerInfo: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  footerInfoText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
  },
});

export default WeeklyPlanDetailView;
