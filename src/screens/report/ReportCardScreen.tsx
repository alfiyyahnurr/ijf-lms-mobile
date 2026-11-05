import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import AppHeader from '../../components/navigation/AppHeader';
import ToastAlert from '../../components/feedback/ToastAlert';
import { api } from '../../services/api';
import {
  PublishedCard,
  PublishedCardSummary,
} from '../../types';
import { rubricPhrase, MOCK_PUBLISHED_CARDS_SUMMARY, MOCK_PUBLISHED_CARDS_DETAIL } from '../../data/mockData';

export const ReportCardScreen: React.FC = () => {
  const [cards, setCards] = useState<PublishedCardSummary[]>(MOCK_PUBLISHED_CARDS_SUMMARY);
  const [selectedId, setSelectedId] = useState<number | null>(MOCK_PUBLISHED_CARDS_SUMMARY[0]?.id ?? null);
  const [card, setCard] = useState<PublishedCard | null>(MOCK_PUBLISHED_CARDS_DETAIL[1] ?? null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Load published cards list on initial mount
  useEffect(() => {
    let isMounted = true;
    async function fetchCards() {
      try {
        const fetchedCards = await api.reportCards.list();
        if (isMounted && fetchedCards && fetchedCards.length > 0) {
          setCards(fetchedCards);
          const firstId = fetchedCards[0].id;
          setSelectedId(firstId);
          const detail = await api.reportCards.getReportCard(firstId);
          if (isMounted) {
            setCard(detail);
          }
        }
      } catch (err: any) {
        // Fallback already pre-set
      }
    }
    fetchCards();
    return () => {
      isMounted = false;
    };
  }, []);

  async function openCard(id: number) {
    setSelectedId(id);
    if (card?.id === id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await api.reportCards.getReportCard(id);
      if (!detail) throw new Error('Could not load this report card');
      setCard(detail);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Could not load this report card');
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!card) return;
    setDownloading(true);
    try {
      await api.reportCards.downloadPdf(card.id);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setToastMessage(`Report Card (${card.term_name}) PDF downloaded successfully!`);
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
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* PageHeader matching web PageHeader component */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageTitle}>Report Card</Text>
            <Text style={styles.pageDescription}>Published term reports and their history</Text>
          </View>
          {card ? (
            <TouchableOpacity
              style={styles.downloadPdfBtn}
              onPress={handleDownloadPdf}
              activeOpacity={0.8}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.downloadPdfText}>Download PDF</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {cards.length === 0 ? (
          <View style={styles.webCard}>
            <Text style={styles.emptyText}>Your report card has not been published yet.</Text>
          </View>
        ) : (
          <View style={styles.mainLayout}>
            {/* Term selector button list */}
            <View style={styles.termSelectorList}>
              {cards.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => openCard(item.id)}
                    style={[
                      styles.termBtn,
                      isSelected ? styles.termBtnActive : styles.termBtnInactive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.termBtnTitle,
                        isSelected ? styles.termBtnTitleActive : styles.termBtnTitleInactive,
                      ]}
                    >
                      {item.academic_year_name} · {item.term_name}
                    </Text>
                    <Text style={styles.termBtnSubtitle}>{item.class_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Main Report Card Detail Container */}
            <View style={styles.webCard}>
              {loading && <Text style={styles.loadingText}>Loading report…</Text>}
              {error && <Text style={styles.errorText}>{error}</Text>}
              {card && !loading && <CardDetail card={card} />}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function CardDetail({ card }: { card: PublishedCard }) {
  return (
    <View style={styles.detailContainer}>
      {/* School Name & Term Subtitle */}
      <View style={styles.schoolHeader}>
        <Text style={styles.schoolNameText}>{card.school_name}</Text>
        <Text style={styles.schoolTermSub}>
          {card.term_name} · {card.academic_year_name}
        </Text>
      </View>

      {/* 2-Column Meta DL Grid */}
      <View style={styles.metaGrid}>
        <View style={styles.metaCol}>
          <Field label="Student" value={card.student_name} />
        </View>
        <View style={styles.metaCol}>
          <Field label="Student ID" value={card.student_nis} />
        </View>
        <View style={styles.metaCol}>
          <Field label="Class" value={card.class_name} />
        </View>
        <View style={styles.metaCol}>
          <Field label="Phase" value={card.phase || '—'} />
        </View>
        <View style={styles.metaCol}>
          <Field label="Term" value={String(card.term_number)} />
        </View>
      </View>

      {/* Academic Achievement Section */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Academic achievement</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCell, styles.colSubject]}>Subject</Text>
              <Text style={[styles.thCell, styles.colTopic]}>Topic</Text>
              <Text style={[styles.thCell, styles.colScore]}>CA1</Text>
              <Text style={[styles.thCell, styles.colScore]}>CA2</Text>
              <Text style={[styles.thCell, styles.colFinal]}>Final</Text>
            </View>

            {/* Table Body */}
            {card.subjects.map((row) => (
              <View key={row.subject_id} style={styles.tableDataRow}>
                <Text style={[styles.tdCell, styles.colSubject, styles.tdSubjectText]}>
                  {row.subject_name}
                </Text>
                <Text style={[styles.tdCell, styles.colTopic, styles.tdTopicText]}>
                  {row.key_learning_focus || '—'}
                </Text>
                <Text style={[styles.tdCell, styles.colScore, styles.tdScoreText]}>
                  {row.ca ?? '—'}
                </Text>
                <Text style={[styles.tdCell, styles.colScore, styles.tdScoreText]}>
                  {row.ma ?? '—'}
                </Text>
                <Text style={[styles.tdCell, styles.colFinal, styles.tdFinalText]}>
                  {row.term_average ?? '—'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Aspects Sections (Character & Core Values, Core Competencies) */}
      {card.aspects.map((aspect) => (
        <View key={aspect.id} style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{aspect.title}</Text>
          <View style={styles.aspectsList}>
            {aspect.items.map((item) => (
              <View key={item.id} style={styles.aspectCard}>
                <View style={styles.aspectCardHeader}>
                  <Text style={styles.aspectLabel}>{item.label}</Text>
                  <Text style={styles.aspectScore}>
                    {item.score_kind === 'abc'
                      ? rubricPhrase(item.score) || item.score || '—'
                      : item.score || '—'}
                  </Text>
                </View>
                {item.description ? (
                  <Text style={styles.aspectDescription}>{item.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Area for development Section */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Area for development</Text>
        <Text style={styles.commentBody}>
          {card.area_for_development || card.homeroom_comment || '—'}
        </Text>
        {card.homeroom_teacher ? (
          <Text style={styles.teacherSignature}>
            — {card.homeroom_teacher}, Homeroom Teacher
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

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
    paddingBottom: 110,
  },
  // PageHeader: matches flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  pageHeaderLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 30,
  },
  pageDescription: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
  },
  // Download button: inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-white
  downloadPdfBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  downloadPdfText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  mainLayout: {
    gap: 20,
  },
  // Term selector list
  termSelectorList: {
    gap: 8,
  },
  termBtn: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  termBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  termBtnInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  termBtnTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  termBtnTitleActive: {
    color: '#1D4ED8',
  },
  termBtnTitleInactive: {
    color: '#0F172A',
  },
  termBtnSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  // Web Card style: bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm
  webCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#475569',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
  },
  detailContainer: {
    gap: 22,
  },
  // School Name and Term Subtitle
  schoolHeader: {
    gap: 3,
  },
  schoolNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  schoolTermSub: {
    fontSize: 14,
    color: '#475569',
  },
  // 2-Column Meta dl: dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 12,
  },
  metaCol: {
    width: '47%',
  },
  fieldBox: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  // Sections: mb-2 text-sm font-semibold uppercase tracking-wide text-[#0F172A]
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#0F172A',
    marginBottom: 4,
  },
  // Table Styling matching overflow-x-auto table className="w-full text-left text-sm"
  tableScroll: {
    marginHorizontal: -6,
  },
  tableScrollContent: {
    paddingHorizontal: 6,
    minWidth: 540,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  thCell: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tdCell: {
    fontSize: 13,
    color: '#0F172A',
  },
  colSubject: {
    width: 145,
    paddingRight: 8,
  },
  colTopic: {
    width: 220,
    paddingRight: 8,
  },
  colScore: {
    width: 50,
    paddingRight: 8,
    textAlign: 'center',
  },
  colFinal: {
    width: 55,
    textAlign: 'center',
  },
  tdSubjectText: {
    fontWeight: '500',
    color: '#0F172A',
  },
  tdTopicText: {
    color: '#475569',
  },
  tdScoreText: {
    color: '#0F172A',
  },
  tdFinalText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  // Aspects cards matching rounded-md border border-[#E2E8F0] px-3 py-2 text-sm
  aspectsList: {
    gap: 8,
  },
  aspectCard: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  aspectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  aspectLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  aspectScore: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#1D4ED8',
    flexShrink: 0,
  },
  aspectDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  // Area for development
  commentBody: {
    fontSize: 13.5,
    color: '#0F172A',
    lineHeight: 20,
  },
  teacherSignature: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748B',
  },
});

export default ReportCardScreen;
