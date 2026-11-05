import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, RADIUS } from '../../constants/theme';
import { Quiz, QuizQuestion } from '../../types';
import { getQuizQuestions } from '../../data/mockData';

interface QuizTakingScreenProps {
  quiz: Quiz;
  onBack: () => void;
  onComplete?: (score: number) => void;
}

export const QuizTakingScreen: React.FC<QuizTakingScreenProps> = ({
  quiz,
  onBack,
  onComplete,
}) => {
  const [questions] = useState<QuizQuestion[]>(() => getQuizQuestions(quiz.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const scrollRef = useRef<any>(null);

  // Timer Countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  // Scroll to top when changing question
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = () => {
    setShowConfirmModal(false);
    let earnedPoints = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 20), 0);

    questions.forEach((q) => {
      const selectedId = answers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      if (selectedId && correctOption && selectedId === correctOption.id) {
        earnedPoints += q.points || 20;
      }
    });

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
    setFinalScore(scorePercentage);
    setIsSubmitted(true);
    if (onComplete) {
      onComplete(scorePercentage);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const currentQ = questions[currentIndex];

  // -------------------------------------------------------------
  // SUBMITTED / RESULT SCREEN (IDENTICAL TO WEB ENGINE)
  // -------------------------------------------------------------
  if (isSubmitted && finalScore !== null) {
    const isPassing = finalScore >= 70;
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Hasil Kuis
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Hero Card */}
          <View style={styles.resultCard}>
            <View
              style={[
                styles.scoreCircle,
                { backgroundColor: isPassing ? '#DCFCE7' : '#FEF2F2' },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  { color: isPassing ? '#16A34A' : '#DC2626' },
                ]}
              >
                {finalScore}%
              </Text>
            </View>

            <Text style={styles.resultTitle}>
              {isPassing ? 'Selamat, Kuis Selesai!' : 'Kuis Telah Diselesaikan'}
            </Text>
            <Text style={styles.resultSubtitle}>
              Nilai perolehan kamu adalah{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {finalScore}/100
              </Text>
              . Jawaban kamu telah tersimpan.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {questions.filter((q) => {
                    const sel = answers[q.id];
                    const cor = q.options.find((o) => o.isCorrect);
                    return sel && cor && sel === cor.id;
                  }).length}
                </Text>
                <Text style={styles.statLabel}>Benar</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {questions.length -
                    questions.filter((q) => {
                      const sel = answers[q.id];
                      const cor = q.options.find((o) => o.isCorrect);
                      return sel && cor && sel === cor.id;
                    }).length}
                </Text>
                <Text style={styles.statLabel}>Salah</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{questions.length}</Text>
                <Text style={styles.statLabel}>Total Soal</Text>
              </View>
            </View>
          </View>

          {/* Review of Questions */}
          <Text style={styles.sectionTitle}>Review Soal & Pembahasan</Text>

          <View style={styles.reviewList}>
            {questions.map((q, idx) => {
              const selectedOptionId = answers[q.id];
              const selectedOption = q.options.find((o) => o.id === selectedOptionId);
              const correctOption = q.options.find((o) => o.isCorrect);
              const isCorrect = selectedOptionId === correctOption?.id;

              return (
                <View
                  key={q.id}
                  style={[
                    styles.reviewCard,
                    {
                      borderColor: isCorrect ? '#86EFAC' : '#FCA5A5',
                      backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
                    },
                  ]}
                >
                  <View style={styles.reviewCardHeader}>
                    <View
                      style={[
                        styles.reviewBadge,
                        {
                          backgroundColor: isCorrect ? '#16A34A' : '#DC2626',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? 'checkmark' : 'close'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.reviewBadgeText}>
                        Soal {idx + 1} • {isCorrect ? 'Benar' : 'Salah'}
                      </Text>
                    </View>
                    <Text style={styles.reviewPoints}>
                      {isCorrect ? `+${q.points}` : '0'} pts
                    </Text>
                  </View>

                  <Text style={styles.reviewQuestionText}>{q.question_text}</Text>

                  <View style={styles.reviewAnswersWrap}>
                    <Text style={styles.reviewAnswerLabel}>
                      Jawaban Kamu:{' '}
                      <Text
                        style={{
                          fontWeight: '600',
                          color: isCorrect ? '#15803D' : '#B91C1C',
                        }}
                      >
                        {selectedOption
                          ? `${selectedOption.optionLabel}. ${selectedOption.optionText}`
                          : 'Tidak Dijawab'}
                      </Text>
                    </Text>

                    {!isCorrect && correctOption && (
                      <Text style={styles.reviewAnswerCorrect}>
                        Kunci Jawaban:{' '}
                        <Text style={{ fontWeight: '600' }}>
                          {correctOption.optionLabel}. {correctOption.optionText}
                        </Text>
                      </Text>
                    )}

                    {q.explanation && (
                      <Text style={styles.reviewExplanation}>
                        💡 Pembahasan: {q.explanation}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.finishBtnText}>Kembali ke Daftar Kuis</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUIZ TAKING SCREEN
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowExitModal(true)}
          style={styles.headerBackBtn}
          accessibilityLabel="Tutup Kuis"
        >
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quiz.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            Soal {currentIndex + 1} dari {questions.length}
          </Text>
        </View>

        {/* Countdown Badge */}
        <View
          style={[
            styles.timerBadge,
            {
              backgroundColor: timeLeft < 120 ? '#FEE2E2' : '#EFF6FF',
              borderColor: timeLeft < 120 ? '#FCA5A5' : '#BFDBFE',
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={timeLeft < 120 ? '#DC2626' : '#2563EB'}
          />
          <Text
            style={[
              styles.timerText,
              { color: timeLeft < 120 ? '#DC2626' : '#2563EB' },
            ]}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Horizontal Question Number Pills */}
      <View style={styles.numberBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.numberBarContent}
        >
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = answers[questions[i].id] !== undefined;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => setCurrentIndex(i)}
                style={[
                  styles.numPill,
                  isCurrent && styles.numPillCurrent,
                  !isCurrent && isAnswered && styles.numPillAnswered,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.numPillText,
                    isCurrent && styles.numPillTextCurrent,
                    !isCurrent && isAnswered && styles.numPillTextAnswered,
                  ]}
                >
                  {i + 1}
                </Text>
                {!isCurrent && isAnswered && (
                  <View style={styles.answeredDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Question Card ScrollView */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionCard}>
          {/* Question Metadata */}
          <View style={styles.qMetaRow}>
            <View style={styles.qTypePill}>
              <Text style={styles.qTypePillText}>Multiple Choice</Text>
            </View>
            <Text style={styles.qPointsText}>{currentQ.points || 20} Poin</Text>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQ.question_text}</Text>

          {/* Options List */}
          <View style={styles.optionsList}>
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.id;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelectOption(currentQ.id, opt.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      isSelected && styles.optionRadioSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.optionLabel}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {opt.optionText}
                  </Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2563EB"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={currentIndex === 0 ? '#94A3B8' : '#0F172A'}
          />
          <Text
            style={[
              styles.navBtnText,
              currentIndex === 0 && styles.navBtnTextDisabled,
            ]}
          >
            Sebelumnya
          </Text>
        </TouchableOpacity>

        {currentIndex < questions.length - 1 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => setCurrentIndex((prev) => prev + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Berikutnya</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setShowConfirmModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Kumpulkan Kuis</Text>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmation Submit Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="help-circle-outline" size={32} color="#2563EB" />
            </View>

            <Text style={styles.modalTitle}>Kumpulkan Kuis Sekarang?</Text>
            <Text style={styles.modalDesc}>
              Kamu telah menjawab{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {answeredCount} dari {questions.length}
              </Text>{' '}
              soal. Setelah dikumpulkan, kamu tidak dapat mengubah jawaban lagi.
            </Text>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Ya, Kumpulkan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowConfirmModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Periksa Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Keluar dari Kuis?</Text>
            <Text style={styles.modalDesc}>
              Kuis sedang berlangsung. Waktu akan terus berjalan jika kamu keluar dari layar ini.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => {
                setShowExitModal(false);
                onBack();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Keluar Kuis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowExitModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Lanjutkan Kuis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  timerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '700',
  },
  numberBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  numberBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  numPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  numPillCurrent: {
    backgroundColor: '#2563EB',
  },
  numPillAnswered: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  numPillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  numPillTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  numPillTextAnswered: {
    color: '#15803D',
    fontWeight: '700',
  },
  answeredDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  qMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  qTypePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qTypePillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qPointsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  questionText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  optionItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionRadioSelected: {
    backgroundColor: '#2563EB',
  },
  optionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  checkIcon: {
    marginLeft: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.45,
    borderColor: '#CBD5E1',
  },
  navBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    gap: 4,
  },
  nextBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    gap: 6,
  },
  submitBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalConfirmBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalConfirmBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  resultScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 28,
    fontWeight: '800',
  },
  resultTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  resultSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  sectionTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  reviewList: {
    gap: 12,
    marginBottom: 24,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  reviewBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewPoints: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  reviewQuestionText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 21,
    color: '#0F172A',
    marginBottom: 10,
    fontWeight: '600',
  },
  reviewAnswersWrap: {
    gap: 4,
  },
  reviewAnswerLabel: {
    fontSize: 12.5,
    color: '#475569',
  },
  reviewAnswerCorrect: {
    fontSize: 12.5,
    color: '#15803D',
  },
  reviewExplanation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  finishBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default QuizTakingScreen;
