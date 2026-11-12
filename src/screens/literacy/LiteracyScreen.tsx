import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING, SHADOWS, FONTS } from '../../constants/theme';
import {
  INITIAL_LITERACY_ENTRIES,
  INITIAL_LITERACY_PROGRESS,
  LITERACY_TYPES,
  LITERACY_LANGUAGES,
  LITERACY_GENRES,
  LITERACY_RATINGS,
  LITERACY_PROMPTS_BY_TRACK,
  LITERACY_CLAIM_PROMPTS,
  LITERACY_EVIDENCE_PROMPTS,
  LITERACY_SO_WHAT_PROMPTS,
  getReadingTypeLabel,
  getReadingTypeId,
  getReadingTypeColor,
  getReadingTypeTheme,
  getRatingLabel,
  getRatingScore,
} from '../../data/mockData';
import { LiteracyEntry, LiteracyFormData, LiteracyProgressStats } from '../../types';
import { useStudentData } from '../../context/StudentDataContext';
import { api } from '../../services/api';
import AppHeader from '../../components/navigation/AppHeader';
import { CalendarDatePickerModal } from '../../components/modals/CalendarDatePickerModal';
import ToastAlert from '../../components/feedback/ToastAlert';

interface DropdownModalState {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

function getTodayJakartaStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

const DEFAULT_EMPTY_FORM: LiteracyFormData = {
  title: '',
  author: '',
  type: 'Novel / Fiction',
  language: 'English',
  genre: '',
  pagesOrLength: '',
  dateFinished: getTodayJakartaStr(),
  rating: '',
  vocabulary: '',
  reflectionClaimPrompt: '',
  reflectionClaimText: '',
  reflectionEvidencePrompt: '',
  reflectionEvidenceText: '',
  reflectionSoWhatPrompt: '',
  reflectionSoWhatText: '',
  connection: '',
};

export const LiteracyScreen: React.FC = () => {
  const {
    literacyEntries,
    addLiteracyEntry,
    updateLiteracyEntry,
    deleteLiteracyEntry,
    fetchLiteracyLogs,
    fetchLiteracyStats,
  } = useStudentData();

  // Navigation tabs: 'log' | 'progress'
  const [activeTab, setActiveTab] = useState<'log' | 'progress'>('log');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LiteracyEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Live status states
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStats, setLiveStats] = useState<LiteracyProgressStats | null>(null);

  // Entries State (synced with context)
  const [entries, setEntries] = useState<LiteracyEntry[]>(literacyEntries);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastType(type);
    setToastMessage(message);
  }, []);
  const [deleteToastVisible, setDeleteToastVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mainScrollRef = useRef<any>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
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
    setEntries(literacyEntries);
  }, [literacyEntries]);

  // Auto-dismiss delete toast after 3.5s
  useEffect(() => {
    if (deleteToastVisible) {
      const timer = setTimeout(() => {
        setDeleteToastVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [deleteToastVisible]);


  // Form State (Default: Completely Empty)
  const [formData, setFormData] = useState<LiteracyFormData>({ ...DEFAULT_EMPTY_FORM });

  // Refs for every TextInput so we can accurately measure and auto-scroll
  const titleInputRef = useRef<any>(null);
  const authorInputRef = useRef<any>(null);
  const pagesInputRef = useRef<any>(null);
  const vocabInputRef = useRef<any>(null);
  const claimInputRef = useRef<any>(null);
  const evidenceInputRef = useRef<any>(null);
  const soWhatInputRef = useRef<any>(null);
  const connectionInputRef = useRef<any>(null);

  // Layout refs to accurately compute exact positions across form cards
  const card1Y = useRef<number>(40);
  const card2Y = useRef<number>(550);
  const claimContainerY = useRef<number>(60);
  const evidenceContainerY = useRef<number>(420);
  const soWhatContainerY = useRef<number>(780);
  const connectionCardY = useRef<number>(1780);

  // Smooth auto-scroll helper so active input is comfortably positioned above keyboard
  const scrollToField = useCallback((yOffset: number) => {
    setTimeout(() => {
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, yOffset),
        animated: true,
      });
    }, 120);
  }, []);

  const scrollToFocusedInput = useCallback((_inputRef: any, fallbackY: number) => {
    scrollToField(fallbackY);
  }, [scrollToField]);

  const scrollToInput = useCallback((yOffset: number) => {
    scrollToField(yOffset);
  }, [scrollToField]);

  // Reset form to completely empty state
  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_EMPTY_FORM });
  }, []);

  // Handle Cancel or Back (Reset progress automatically if not saved)
  const handleCancelOrBack = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (selectedEntry) {
      setSelectedEntry(null);
      return;
    }
    setIsAdding(false);
    resetForm();
  }, [isEditing, selectedEntry, resetForm]);

  // Load literacy logs and statistics whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsFetching(true);
      Promise.all([fetchLiteracyLogs(), fetchLiteracyStats()])
        .then(([logs, stats]) => {
          if (isMounted) {
            if (Array.isArray(logs)) setEntries(logs);
            if (stats) setLiveStats(stats);
          }
        })
        .finally(() => {
          if (isMounted) setIsFetching(false);
        });

      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        isMounted = false;
        setIsAdding(false);
        setSelectedEntry(null);
        setIsEditing(false);
        resetForm();
        mainScrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [fetchLiteracyLogs, fetchLiteracyStats, resetForm])
  );

  // Pure Pull-to-Refresh handler for Literacy logs & stats
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [logs, stats] = await Promise.all([
        fetchLiteracyLogs(),
        fetchLiteracyStats(),
      ]);
      if (Array.isArray(logs)) setEntries(logs);
      if (stats) setLiveStats(stats);
    } catch (err) {
      console.warn('[Literacy onRefresh Error]', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLiteracyLogs, fetchLiteracyStats]);

  // Reset when user taps tab icon or navigation triggers reset
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('tabPress', () => {
      setIsAdding(false);
      setSelectedEntry(null);
      setIsEditing(false);
      setActiveTab('log');
      resetForm();
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation, resetForm]);

  useEffect(() => {
    if (route.params?.resetKey) {
      setIsAdding(false);
      setSelectedEntry(null);
      setIsEditing(false);
      setActiveTab('log');
      resetForm();
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route.params?.resetKey, resetForm]);



  // Modal Sheet state for picker dropdowns
  const [dropdownModal, setDropdownModal] = useState<DropdownModalState | null>(null);

  // Calendar Date Picker Modal state
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Computed Progress Metrics
  const progressStats = useMemo<LiteracyProgressStats>(() => {
    if (liveStats) {
      return liveStats;
    }
    const textsRead = entries.length;
    const uniqueGenres = new Set(entries.map((e) => e.genre).filter(Boolean)).size;
    const englishCount = entries.filter((e) => e.language === 'English').length;
    const englishPercentage = textsRead > 0 ? Math.round((englishCount / textsRead) * 100) : 0;

    // Calculate average rating
    const ratedEntries = entries.filter((e) => e.rating);
    let avgRating = '—';
    if (ratedEntries.length > 0) {
      let totalStars = 0;
      let count = 0;
      ratedEntries.forEach((e) => {
        const ratingStr = String(e.rating);
        const starMatches = ratingStr.match(/[★⭐]/g);
        if (starMatches) {
          totalStars += starMatches.length;
          count++;
        } else if (typeof e.rating === 'number') {
          totalStars += e.rating;
          count++;
        }
      });
      if (count > 0) {
        const avg = totalStars / count;
        avgRating = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
      }
    }

    return {
      textsRead,
      textsTarget: INITIAL_LITERACY_PROGRESS.textsTarget,
      genreVariety: uniqueGenres,
      genreTarget: INITIAL_LITERACY_PROGRESS.genreTarget,
      avgRating,
      englishPercentage,
      englishTargetPercentage: INITIAL_LITERACY_PROGRESS.englishTargetPercentage,
      level: INITIAL_LITERACY_PROGRESS.level,
      schoolLevel: INITIAL_LITERACY_PROGRESS.schoolLevel,
    };
  }, [entries, liveStats]);

  // Form Field Update Helper
  const updateFormField = <K extends keyof LiteracyFormData>(key: K, value: LiteracyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Dynamic prompts based on track (SMP vs SMA)
  const currentTrack = useMemo<'smp' | 'sma'>(() => {
    const raw = (liveStats?.schoolLevel || liveStats?.level || '').toLowerCase();
    if (raw.includes('smp') || raw.includes('middle')) return 'smp';
    return 'sma';
  }, [liveStats]);

  const currentPrompts = useMemo(() => {
    return LITERACY_PROMPTS_BY_TRACK[currentTrack] || LITERACY_PROMPTS_BY_TRACK.sma;
  }, [currentTrack]);

  const claimPrompts = useMemo(() => {
    if (formData.reflectionClaimPrompt && !currentPrompts.claim.includes(formData.reflectionClaimPrompt)) {
      return [formData.reflectionClaimPrompt, ...currentPrompts.claim];
    }
    return currentPrompts.claim;
  }, [formData.reflectionClaimPrompt, currentPrompts]);

  const evidencePrompts = useMemo(() => {
    if (formData.reflectionEvidencePrompt && !currentPrompts.evidence.includes(formData.reflectionEvidencePrompt)) {
      return [formData.reflectionEvidencePrompt, ...currentPrompts.evidence];
    }
    return currentPrompts.evidence;
  }, [formData.reflectionEvidencePrompt, currentPrompts]);

  const soWhatPrompts = useMemo(() => {
    if (formData.reflectionSoWhatPrompt && !currentPrompts.sowhat.includes(formData.reflectionSoWhatPrompt)) {
      return [formData.reflectionSoWhatPrompt, ...currentPrompts.sowhat];
    }
    return currentPrompts.sowhat;
  }, [formData.reflectionSoWhatPrompt, currentPrompts]);

  // Progressive disclosure conditions for Reflection steps
  const hasClaimPrompt = Boolean(formData.reflectionClaimPrompt);
  const isClaimCompleted = hasClaimPrompt && formData.reflectionClaimText.trim().length > 0;

  const canShowEvidence = isClaimCompleted;
  const hasEvidencePrompt = canShowEvidence && Boolean(formData.reflectionEvidencePrompt);
  const isEvidenceCompleted = hasEvidencePrompt && formData.reflectionEvidenceText.trim().length > 0;

  const canShowSoWhat = isEvidenceCompleted;
  const hasSoWhatPrompt = canShowSoWhat && Boolean(formData.reflectionSoWhatPrompt);
  const isSoWhatCompleted = hasSoWhatPrompt && formData.reflectionSoWhatText.trim().length > 0;

  const canShowConnection = isSoWhatCompleted;

  // Validation: Title & Author filled + all required reflection steps completed
  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.author.trim().length > 0 &&
    isClaimCompleted &&
    isEvidenceCompleted &&
    isSoWhatCompleted;

  // Handle Save Entry (New or Update)
  const handleSaveEntry = async () => {
    if (!isFormValid || isSaving) {
      if (!formData.title.trim() || !formData.author.trim()) {
        showToastNotification('Please enter Title and Author to save.', 'error');
      } else if (!isClaimCompleted) {
        showToastNotification('Please complete the Claim reflection step.', 'error');
      } else if (!isEvidenceCompleted) {
        showToastNotification('Please complete the Evidence reflection step.', 'error');
      } else if (!isSoWhatCompleted) {
        showToastNotification('Please complete the So What? reflection step.', 'error');
      }
      return;
    }

    const todayStr = getTodayJakartaStr();
    const finishedDate = formData.dateFinished || todayStr;
    if (finishedDate > todayStr) {
      showToastNotification('Finished date cannot be in the future.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && selectedEntry) {
        const updated = await api.literacy.update(selectedEntry.id, {
          title: formData.title.trim(),
          author: formData.author.trim(),
          readingType: getReadingTypeId(formData.type),
          type: getReadingTypeLabel(formData.type),
          language: formData.language || 'English',
          genre: formData.genre.trim() || undefined,
          pagesOrLength: formData.pagesOrLength.trim() || '—',
          finishedDate,
          dateFinished: finishedDate,
          rating: getRatingScore(formData.rating) ?? undefined,
          vocabulary: formData.vocabulary.trim(),
          claimPrompt: formData.reflectionClaimPrompt,
          claim: formData.reflectionClaimText.trim(),
          evidencePrompt: formData.reflectionEvidencePrompt,
          evidence: formData.reflectionEvidenceText.trim(),
          sowhatPrompt: formData.reflectionSoWhatPrompt,
          sowhat: formData.reflectionSoWhatText.trim(),
          connection: formData.connection.trim(),
        });
        updateLiteracyEntry(selectedEntry.id, updated);
        setEntries((prev) => prev.map((e) => (String(e.id) === String(selectedEntry.id) ? updated : e)));
        setSelectedEntry(updated);
        setIsEditing(false);
        showToastNotification('Reading entry updated successfully!', 'success');
      } else {
        const result = await api.literacy.create({
          title: formData.title.trim(),
          author: formData.author.trim(),
          readingType: getReadingTypeId(formData.type),
          type: getReadingTypeLabel(formData.type),
          language: formData.language || 'English',
          genre: formData.genre.trim() || undefined,
          pagesOrLength: formData.pagesOrLength.trim() || '—',
          finishedDate,
          dateFinished: finishedDate,
          rating: getRatingScore(formData.rating) ?? undefined,
          vocabulary: formData.vocabulary.trim(),
          claimPrompt: formData.reflectionClaimPrompt,
          claim: formData.reflectionClaimText.trim(),
          evidencePrompt: formData.reflectionEvidencePrompt,
          evidence: formData.reflectionEvidenceText.trim(),
          sowhatPrompt: formData.reflectionSoWhatPrompt,
          sowhat: formData.reflectionSoWhatText.trim(),
          connection: formData.connection.trim(),
        });
        addLiteracyEntry(result.entry, result.pointsAwarded);
        setEntries((prev) => [result.entry, ...prev]);
        setIsAdding(false);
        resetForm();
        showToastNotification(result.message || `+${result.pointsAwarded} pts · Reading log`, 'success');
      }

      fetchLiteracyStats().then((s) => {
        if (s) setLiveStats(s);
      });
    } catch (err: any) {
      showToastNotification(err?.message || 'Failed to save reading entry. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Start Edit
  const handleStartEdit = () => {
    if (!selectedEntry) return;
    const finished = selectedEntry.finishedDate || selectedEntry.dateFinished || getTodayJakartaStr();
    setFormData({
      title: selectedEntry.title,
      author: selectedEntry.author,
      type: getReadingTypeLabel(selectedEntry.type || selectedEntry.readingType),
      language: selectedEntry.language || 'English',
      genre: selectedEntry.genre || '',
      pagesOrLength: selectedEntry.pagesOrLength === '—' ? '' : selectedEntry.pagesOrLength,
      dateFinished: finished,
      rating: getRatingLabel(selectedEntry.rating),
      vocabulary:
        selectedEntry.vocabulary ||
        (selectedEntry.vocab ? selectedEntry.vocab.join(', ') : ''),
      reflectionClaimPrompt:
        selectedEntry.claimPrompt ||
        selectedEntry.reflectionClaim ||
        currentPrompts.claim[0],
      reflectionClaimText: selectedEntry.claim || selectedEntry.reflectionText || '',
      reflectionEvidencePrompt:
        selectedEntry.evidencePrompt || currentPrompts.evidence[0],
      reflectionEvidenceText: selectedEntry.evidence || '',
      reflectionSoWhatPrompt:
        selectedEntry.sowhatPrompt || currentPrompts.sowhat[0],
      reflectionSoWhatText: selectedEntry.sowhat || '',
      connection: selectedEntry.connection || '',
    });
    setIsEditing(true);
  };

  // Handle Delete Entry
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    try {
      await api.literacy.delete(selectedEntry.id);
      deleteLiteracyEntry(selectedEntry.id);
      setEntries((prev) => prev.filter((e) => String(e.id) !== String(selectedEntry.id)));
      setSelectedEntry(null);
      setIsEditing(false);
      setDeleteDialogVisible(false);
      setDeleteToastVisible(true);
      fetchLiteracyStats().then((s) => {
        if (s) setLiveStats(s);
      });
    } catch (err: any) {
      showToastNotification(err?.message || 'Failed to delete entry', 'error');
      setDeleteDialogVisible(false);
    }
  };

  // Helper to format date string to "DD Mon YYYY" (e.g. 22 Oct 2026)
  const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr) return '22 Oct 2026';
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parts[2];
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return `${day} ${monthNames[monthIdx] || 'Oct'} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  };

  // Helper to format pure gold rating stars with 5 stars total matching Image 5
  const formatRatingStars = (rating?: string | number | null): string => {
    const score = getRatingScore(rating);
    if (!score) return '';
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  // Helper to format date from calendar picker
  const handleDateSelected = (selectedDateStr: string) => {
    setCalendarVisible(false);
    if (!selectedDateStr) return;
    let formatted = selectedDateStr;
    if (selectedDateStr.includes('/')) {
      const parts = selectedDateStr.split('/');
      if (parts.length === 3) {
        formatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    updateFormField('dateFinished', formatted);
  };

  // Target Met logic for Tab Progress
  const isVolumeMet = progressStats.textsRead >= progressStats.textsTarget;
  const isGenreMet = progressStats.genreVariety >= progressStats.genreTarget;
  const isEnglishMet = progressStats.englishPercentage >= progressStats.englishTargetPercentage;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header: Hamburger on Left, Profile Avatar on Right, Clean Background */}
      <AppHeader showTitle={false} />

      {/* Top Floating Green Indicator: Entry deleted (Image 4) */}
      <ToastAlert
        visible={deleteToastVisible}
        message="Entry deleted"
        type="success"
        floating
        onClose={() => setDeleteToastVisible(false)}
      />

      {/* Global Toast Alert */}
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type={toastType}
        floating
        onClose={() => setToastMessage(null)}
      />

      {/* Underline Tab Bar (Log vs Progress) */}
      {!isAdding && !selectedEntry && !isEditing && (
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'log' && styles.tabButtonActive]}
            onPress={() => setActiveTab('log')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'log' && styles.tabButtonTextActive]}>
              Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'progress' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('progress');
              handleCancelOrBack();
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'progress' && styles.tabButtonTextActive,
              ]}
            >
              Progress
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={mainScrollRef}
          style={styles.mainScroll}
          contentContainerStyle={[
            styles.mainScrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 110 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#135E66']}
              tintColor="#135E66"
            />
          }
        >
        {/* ================================================================
            TAB 1: LOG VIEW
            ================================================================ */}
        {activeTab === 'log' && (
          <>
            {/* 1. DETAIL VIEW (When an entry card is tapped) */}
            {selectedEntry && !isEditing ? (
              <View style={styles.detailViewContainer}>
                {/* Back to Log Link */}
                <TouchableOpacity
                  style={styles.backToLogLink}
                  onPress={() => setSelectedEntry(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color="#135E66" style={{ marginRight: 6 }} />
                  <Text style={styles.backToLogText}>Back to log</Text>
                </TouchableOpacity>

                {/* Main Card with Dynamic Header Banner matching reading type */}
                <View style={styles.detailCard}>
                  {/* Dynamic Color Header Banner (Web LMS parity) */}
                  <View
                    style={[
                      styles.detailHeaderBanner,
                      {
                        backgroundColor: getReadingTypeColor(
                          selectedEntry.readingType || selectedEntry.type
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.detailBannerTitle}>{selectedEntry.title}</Text>
                    <Text style={styles.detailBannerAuthor}>{selectedEntry.author}</Text>
                  </View>

                  {/* Body with 3 Reflection Pill Containers */}
                  <View style={styles.detailCardBody}>
                    {/* C CLAIM */}
                    <View style={styles.detailStepBoxClaim}>
                      <Text style={styles.detailStepLabelClaim}>C CLAIM</Text>
                      <Text style={styles.detailStepBodyText}>
                        {selectedEntry.claim || selectedEntry.reflectionText || '—'}
                      </Text>
                    </View>

                    {/* E EVIDENCE */}
                    <View style={styles.detailStepBoxEvidence}>
                      <Text style={styles.detailStepLabelEvidence}>E EVIDENCE</Text>
                      <Text style={styles.detailStepBodyText}>
                        {selectedEntry.evidence || '—'}
                      </Text>
                    </View>

                    {/* S SO WHAT? */}
                    <View style={styles.detailStepBoxSoWhat}>
                      <Text style={styles.detailStepLabelSoWhat}>S SO WHAT?</Text>
                      <Text style={styles.detailStepBodyText}>
                        {selectedEntry.sowhat || '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons: Edit Entry & Delete this entry */}
                <View style={styles.detailActionBtnWrap}>
                  <TouchableOpacity
                    style={styles.editEntryBtn}
                    onPress={handleStartEdit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editEntryBtnText}>Edit entry</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteEntryBtn}
                    onPress={() => setDeleteDialogVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteEntryBtnText}>Delete this entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !isAdding && !isEditing ? (
              /* 2. NORMAL LIST VIEW */
              <View style={styles.logContainer}>
                {/* Subheader: Stats Info on Left, + Add Entry Button on Right */}
                <View style={styles.subheaderRow}>
                  <Text style={styles.statsSummaryText}>
                    {progressStats.textsRead} texts · {progressStats.genreVariety} genres ·{' '}
                    {progressStats.englishPercentage}% English · {entries.length * 3} pts
                  </Text>

                  <TouchableOpacity
                    style={styles.addEntryButton}
                    onPress={() => {
                      resetForm();
                      setIsAdding(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addEntryButtonText}>+ Add Entry</Text>
                  </TouchableOpacity>
                </View>

                {/* Loading State / Empty State vs List Cards */}
                {isFetching && entries.length === 0 ? (
                  <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#135E66" />
                    <Text style={{ marginTop: 12, fontSize: 13, color: '#64748B' }}>
                      Loading reading entries...
                    </Text>
                  </View>
                ) : entries.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No reading entries yet.</Text>
                    <Text style={{ marginTop: 6, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                      Tap "+ Add Entry" above to log your first reading text.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.entryList}>
                    {entries.map((entry) => {
                      const typeTheme = getReadingTypeTheme(entry.type || entry.readingType);
                      return (
                        <TouchableOpacity
                          key={entry.id}
                          style={styles.entryCard}
                          onPress={() => setSelectedEntry(entry)}
                          activeOpacity={0.85}
                        >
                          {/* Left Vertical Accent Line (Dynamic Color matching Type) */}
                          <View
                            style={[
                              styles.leftAccentLine,
                              { backgroundColor: typeTheme.color },
                            ]}
                          />

                          {/* Content Right */}
                          <View style={styles.entryContentCol}>
                            {/* Row 1: Title on left, Date on right */}
                            <View style={styles.entryRowTop}>
                              <Text style={styles.entryTitleText} numberOfLines={1}>
                                {entry.title}
                              </Text>
                              <Text style={styles.entryDateText}>
                                {formatDisplayDate(entry.dateFinished || entry.finishedDate)}
                              </Text>
                            </View>

                            {/* Row 2: Author on left, Pure Gold Stars on right */}
                            <View style={styles.entryRowSecond}>
                              <Text style={styles.entryAuthorText}>{entry.author}</Text>
                              <Text style={styles.entryGoldStars}>
                                {formatRatingStars(entry.rating)}
                              </Text>
                            </View>

                            {/* Row 3: Pills (Type with dynamic color & Genre in soft sand) */}
                            <View style={styles.entryPillRow}>
                              <View
                                style={[
                                  styles.typePill,
                                  {
                                    backgroundColor: typeTheme.bg,
                                    borderColor: typeTheme.border,
                                    borderWidth: 1,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.typePillText,
                                    { color: typeTheme.color },
                                  ]}
                                >
                                  {getReadingTypeLabel(entry.type || entry.readingType)}
                                </Text>
                              </View>
                              {Boolean(entry.genre) && (
                                <View style={styles.genrePill}>
                                  <Text style={styles.genrePillText}>
                                    {entry.genre}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Row 4: Reflection Italic Quote */}
                            <Text style={styles.entryQuoteText} numberOfLines={2}>
                              “{entry.claim || entry.reflectionText || '—'}”
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              /* 3. ADD OR EDIT ENTRY FORM VIEW */
              <View style={styles.addFormContainer}>
                {/* Back to Log Navigation Link */}
                <TouchableOpacity
                  style={styles.backToLogLink}
                  onPress={handleCancelOrBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color="#135E66" style={{ marginRight: 6 }} />
                  <Text style={styles.backToLogText}>Back to log</Text>
                </TouchableOpacity>

                {/* CARD 1: WHAT I READ */}
                <View
                  style={styles.formCard}
                  onLayout={(e) => {
                    card1Y.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.cardSectionTitle}>What I Read</Text>

                  {/* TITLE */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>TITLE</Text>
                    <TextInput
                      ref={titleInputRef}
                      style={styles.textInput}
                      placeholder="Title of book, article, essay..."
                      placeholderTextColor="#94A3B8"
                      value={formData.title}
                      onChangeText={(val) => updateFormField('title', val)}
                      onFocus={() => scrollToField(0)}
                    />
                  </View>

                  {/* AUTHOR / SOURCE */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>AUTHOR / SOURCE</Text>
                    <TextInput
                      ref={authorInputRef}
                      style={styles.textInput}
                      placeholder="Author name or publication..."
                      placeholderTextColor="#94A3B8"
                      value={formData.author}
                      onChangeText={(val) => updateFormField('author', val)}
                      onFocus={() => scrollToField(60)}
                    />
                  </View>

                  {/* TYPE & LANGUAGE (2-Column Grid) */}
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>TYPE</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() =>
                          setDropdownModal({
                            title: 'Select type...',
                            options: LITERACY_TYPES,
                            selected: formData.type,
                            onSelect: (val) => updateFormField('type', val),
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !formData.type && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {formData.type || 'Select type...'}
                        </Text>
                        <Ionicons name="chevron-down" size={15} color="#475569" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>LANGUAGE</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() =>
                          setDropdownModal({
                            title: 'Language',
                            options: LITERACY_LANGUAGES,
                            selected: formData.language,
                            onSelect: (val) => updateFormField('language', val),
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !formData.language && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {formData.language || 'Select language...'}
                        </Text>
                        <Ionicons name="chevron-down" size={15} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* GENRE & PAGES/LENGTH (2-Column Grid) */}
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>GENRE</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() =>
                          setDropdownModal({
                            title: 'Select genre',
                            options: LITERACY_GENRES,
                            selected: formData.genre,
                            onSelect: (val) => updateFormField('genre', val),
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !formData.genre && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {formData.genre || 'Select genre'}
                        </Text>
                        <Ionicons name="chevron-down" size={15} color="#475569" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>PAGES / LENGTH</Text>
                      <TextInput
                        ref={pagesInputRef}
                        style={styles.textInput}
                        placeholder="e.g. 280 pages"
                        placeholderTextColor="#94A3B8"
                        value={formData.pagesOrLength}
                        onChangeText={(val) => updateFormField('pagesOrLength', val)}
                        onFocus={() => scrollToField(200)}
                      />
                    </View>
                  </View>

                  {/* DATE FINISHED & MY RATING (2-Column Grid) */}
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>DATE FINISHED</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !formData.dateFinished && styles.placeholderText,
                          ]}
                        >
                          {formData.dateFinished ? formatDisplayDate(formData.dateFinished) : 'Select date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#1E293B" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.gridCol}>
                      <Text style={styles.fieldLabel}>MY RATING</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() =>
                          setDropdownModal({
                            title: 'Rate this',
                            options: LITERACY_RATINGS,
                            selected: formData.rating,
                            onSelect: (val) => updateFormField('rating', val),
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !formData.rating && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {formData.rating || 'Rate this'}
                        </Text>
                        <Ionicons name="chevron-down" size={15} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* NEW VOCABULARY */}
                  <View style={styles.formGroup}>
                    <Text style={styles.fieldLabel}>NEW VOCABULARY / KEY TERMS (OPTIONAL)</Text>
                    <TextInput
                      ref={vocabInputRef}
                      style={styles.textInput}
                      placeholder="e.g. resilience, dialectical..."
                      placeholderTextColor="#94A3B8"
                      value={formData.vocabulary}
                      onChangeText={(val) => updateFormField('vocabulary', val)}
                      onFocus={() => scrollToField(360)}
                    />
                  </View>
                </View>

                {/* CARD 2: MY REFLECTION (3-TIER FRAMEWORK) */}
                <View
                  style={styles.formCard}
                  onLayout={(e) => {
                    card2Y.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.cardSectionTitleReflection}>My Reflection</Text>
                  <Text style={styles.cardSubtitle}>Claim → Evidence → So what?</Text>

                  {/* STEP 1: CLAIM (ICE TEAL / CYAN CONTAINER) */}
                  <View
                    style={styles.claimContainer}
                    onLayout={(e) => {
                      claimContainerY.current = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.stepHeaderRow}>
                      <View style={styles.claimBadge}>
                        <Text style={styles.badgeLetter}>C</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimTitle}>Claim</Text>
                        <Text style={styles.stepSubtitle}>
                          Choose a prompt, then write your response
                        </Text>
                      </View>
                    </View>

                    {/* Radio Options for Claim */}
                    <View style={styles.radioGroup}>
                      {claimPrompts.map((prompt) => {
                        const isSelected = formData.reflectionClaimPrompt === prompt;
                        return (
                          <TouchableOpacity
                            key={prompt}
                            style={[
                              styles.radioCard,
                              isSelected && styles.claimRadioCardSelected,
                            ]}
                            onPress={() => updateFormField('reflectionClaimPrompt', prompt)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.claimRadioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={styles.claimRadioDot} />}
                            </View>
                            <Text
                              style={[
                                styles.radioPromptText,
                                isSelected && styles.claimPromptTextSelected,
                              ]}
                            >
                              {prompt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Dynamic Textarea for Claim */}
                    {hasClaimPrompt && (
                      <TextInput
                        ref={claimInputRef}
                        style={styles.reflectionTextarea}
                        placeholder="Write your claim here..."
                        placeholderTextColor="#94A3B8"
                        value={formData.reflectionClaimText}
                        onChangeText={(val) => updateFormField('reflectionClaimText', val)}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        onFocus={() => {
                          scrollToField(
                            (card2Y.current || 550) + (claimContainerY.current || 60) + 100
                          );
                        }}
                      />
                    )}
                  </View>

                  {/* STEP 2: EVIDENCE (WARM GOLD / AMBER CONTAINER) - Appears after Claim is completed */}
                  {canShowEvidence && (
                    <View
                      style={styles.evidenceContainer}
                      onLayout={(e) => {
                        evidenceContainerY.current = e.nativeEvent.layout.y;
                      }}
                    >
                      <View style={styles.stepHeaderRow}>
                        <View style={styles.evidenceBadge}>
                          <Text style={styles.badgeLetter}>E</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.evidenceTitle}>Evidence</Text>
                          <Text style={styles.stepSubtitle}>
                            Support your claim with specific text
                          </Text>
                        </View>
                      </View>

                      {/* Radio Options for Evidence */}
                      <View style={styles.radioGroup}>
                        {evidencePrompts.map((prompt) => {
                          const isSelected = formData.reflectionEvidencePrompt === prompt;
                          return (
                            <TouchableOpacity
                              key={prompt}
                              style={[
                                styles.radioCard,
                                isSelected && styles.evidenceRadioCardSelected,
                              ]}
                              onPress={() => updateFormField('reflectionEvidencePrompt', prompt)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  isSelected && styles.evidenceRadioCircleSelected,
                                ]}
                              >
                                {isSelected && <View style={styles.evidenceRadioDot} />}
                              </View>
                              <Text
                                style={[
                                  styles.radioPromptText,
                                  isSelected && styles.evidencePromptTextSelected,
                                ]}
                              >
                                {prompt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Dynamic Textarea for Evidence */}
                      {hasEvidencePrompt && (
                        <TextInput
                          ref={evidenceInputRef}
                          style={styles.reflectionTextarea}
                          placeholder="Cite or describe the specific evidence..."
                          placeholderTextColor="#94A3B8"
                          value={formData.reflectionEvidenceText}
                          onChangeText={(val) => updateFormField('reflectionEvidenceText', val)}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          onFocus={() => {
                            scrollToField(
                              (card2Y.current || 550) + (evidenceContainerY.current || 420) + 100
                            );
                          }}
                        />
                      )}
                    </View>
                  )}

                  {/* STEP 3: SO WHAT? (SAGE MINT GREEN CONTAINER) - Appears after Evidence is completed */}
                  {canShowSoWhat && (
                    <View
                      style={styles.soWhatContainer}
                      onLayout={(e) => {
                        soWhatContainerY.current = e.nativeEvent.layout.y;
                      }}
                    >
                      <View style={styles.stepHeaderRow}>
                        <View style={styles.soWhatBadge}>
                          <Text style={styles.badgeLetter}>S</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.soWhatTitle}>So What?</Text>
                          <Text style={styles.stepSubtitle}>
                            Why does this matter beyond the text?
                          </Text>
                        </View>
                      </View>

                      {/* Radio Options for So What? */}
                      <View style={styles.radioGroup}>
                        {soWhatPrompts.map((prompt) => {
                          const isSelected = formData.reflectionSoWhatPrompt === prompt;
                          return (
                            <TouchableOpacity
                              key={prompt}
                              style={[
                                styles.radioCard,
                                isSelected && styles.soWhatRadioCardSelected,
                              ]}
                              onPress={() => updateFormField('reflectionSoWhatPrompt', prompt)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  isSelected && styles.soWhatRadioCircleSelected,
                                ]}
                              >
                                {isSelected && <View style={styles.soWhatRadioDot} />}
                              </View>
                              <Text
                                style={[
                                  styles.radioPromptText,
                                  isSelected && styles.soWhatPromptTextSelected,
                                ]}
                              >
                                {prompt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Dynamic Textarea for So What? */}
                      {hasSoWhatPrompt && (
                        <TextInput
                          ref={soWhatInputRef}
                          style={styles.reflectionTextarea}
                          placeholder="So what? Why does this matter?"
                          placeholderTextColor="#94A3B8"
                          value={formData.reflectionSoWhatText}
                          onChangeText={(val) => updateFormField('reflectionSoWhatText', val)}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          onFocus={() => {
                            scrollToField(
                              (card2Y.current || 550) + (soWhatContainerY.current || 780) + 100
                            );
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>

                {/* CARD 3: CONNECTION TO THE REAL WORLD (OPTIONAL) - Appears after So What? is completed */}
                {canShowConnection && (
                  <View
                    style={styles.formCard}
                    onLayout={(e) => {
                      connectionCardY.current = e.nativeEvent.layout.y;
                    }}
                  >
                    <Text style={styles.fieldLabel}>CONNECTION TO THE REAL WORLD (OPTIONAL)</Text>
                    <TextInput
                      ref={connectionInputRef}
                      style={styles.reflectionTextarea}
                      placeholder="Does this connect to a current event, another book, or a global issue?"
                      placeholderTextColor="#94A3B8"
                      value={formData.connection}
                      onChangeText={(val) => updateFormField('connection', val)}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      onFocus={() => {
                        scrollToField(Math.max(0, (connectionCardY.current || 1780) - 20));
                      }}
                    />
                  </View>
                )}

                {/* ACTION BUTTONS: CANCEL VS SAVE / UPDATE ENTRY */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelOrBack}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isFormValid && !isSaving ? styles.saveButtonActive : styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveEntry}
                    disabled={!isFormValid || isSaving}
                    activeOpacity={isFormValid && !isSaving ? 0.8 : 1}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.saveButtonText,
                          isFormValid && styles.saveButtonTextActive,
                        ]}
                      >
                        {isEditing ? 'Update Entry →' : 'Save Entry →'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ================================================================
            TAB 2: PROGRESS VIEW (Image 2 with Green Checkmarks)
            ================================================================ */}
        {activeTab === 'progress' && (
          <View style={styles.progressContainer}>
            {/* 4 Metric Cards Grid (2x2) */}
            <View style={styles.metricGrid}>
              {/* Card 1: Texts read */}
              <View style={[styles.metricCard, styles.metricCardTeal]}>
                <Text style={[styles.metricValue, { color: '#135E66' }]}>
                  {progressStats.textsRead}
                </Text>
                <Text style={styles.metricTargetText}>/ {progressStats.textsTarget} target</Text>
                <Text style={styles.metricLabelText}>Texts read</Text>
              </View>

              {/* Card 2: Genre variety */}
              <View style={[styles.metricCard, styles.metricCardAmber]}>
                <Text style={[styles.metricValue, { color: '#B8842A' }]}>
                  {progressStats.genreVariety}
                </Text>
                <Text style={styles.metricTargetText}>/ {progressStats.genreTarget} target</Text>
                <Text style={styles.metricLabelText}>Genre variety</Text>
              </View>
            </View>

            <View style={styles.metricGrid}>
              {/* Card 3: Avg rating */}
              <View style={[styles.metricCard, styles.metricCardGreen]}>
                <Text style={[styles.metricValue, { color: '#16A34A' }]}>
                  {progressStats.avgRating}
                </Text>
                <Text style={styles.metricTargetText}>out of 5</Text>
                <Text style={styles.metricLabelText}>Avg rating</Text>
              </View>

              {/* Card 4: English % */}
              <View style={[styles.metricCard, styles.metricCardNavy]}>
                <Text style={[styles.metricValue, { color: '#1B2D4F' }]}>
                  {progressStats.englishPercentage}
                </Text>
                <Text style={styles.metricTargetText}>
                  target ≥{progressStats.englishTargetPercentage}%
                </Text>
                <Text style={styles.metricLabelText}>English %</Text>
              </View>
            </View>

            {/* Semester Target Card (Dark Navy Card with Green Checkmarks when met) */}
            <View style={styles.targetCardDark}>
              <Text style={styles.targetCardDarkTitle}>
                This semester's literacy targets · {progressStats.schoolLevel || 'SMA'}
              </Text>

              {/* Volume Target Row */}
              <View style={styles.targetRow}>
                {isVolumeMet ? (
                  <Ionicons name="checkmark" size={16} color="#34D399" style={{ marginRight: 2 }} />
                ) : (
                  <Text style={styles.targetBullet}>○</Text>
                )}
                <Text style={[styles.targetRowText, isVolumeMet && styles.targetRowTextMet]}>
                  Volume: {progressStats.textsRead}/{progressStats.textsTarget} texts
                </Text>
              </View>

              <View style={styles.targetDivider} />

              {/* Genre Variety Target Row */}
              <View style={styles.targetRow}>
                {isGenreMet ? (
                  <Ionicons name="checkmark" size={16} color="#34D399" style={{ marginRight: 2 }} />
                ) : (
                  <Text style={styles.targetBullet}>○</Text>
                )}
                <Text style={[styles.targetRowText, isGenreMet && styles.targetRowTextMet]}>
                  Genre variety: {progressStats.genreVariety}/{progressStats.genreTarget}
                </Text>
              </View>

              <View style={styles.targetDivider} />

              {/* English Percentage Target Row */}
              <View style={styles.targetRow}>
                {isEnglishMet ? (
                  <Ionicons name="checkmark" size={16} color="#34D399" style={{ marginRight: 2 }} />
                ) : (
                  <Text style={styles.targetBullet}>○</Text>
                )}
                <Text style={[styles.targetRowText, isEnglishMet && styles.targetRowTextMet]}>
                  English: {progressStats.englishPercentage}% (target ≥
                  {progressStats.englishTargetPercentage}%)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>

      {/* ================================================================
          CONFIRMATION DIALOG FOR DELETE ENTRY
          ================================================================ */}
      {deleteDialogVisible && (
        <Modal
          visible={deleteDialogVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteDialogVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDeleteDialogVisible(false)}>
            <View style={styles.dialogBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.dialogCard}>
                  <Text style={styles.dialogTitle}>Delete entry?</Text>
                  <Text style={styles.dialogMessage}>
                    Are you sure you want to delete this reading entry? This action cannot be
                    undone.
                  </Text>

                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setDeleteDialogVisible(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dialogCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dialogDeleteBtn}
                      onPress={handleDeleteEntry}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dialogDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* ================================================================
          CUSTOM DROPDOWN POPOVER MODAL
          ================================================================ */}
      {dropdownModal && (
        <Modal
          visible={Boolean(dropdownModal)}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownModal(null)}
        >
          <TouchableWithoutFeedback onPress={() => setDropdownModal(null)}>
            <View style={styles.dropdownBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownCard}>
                  <ScrollView
                    style={{ maxHeight: 380 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {dropdownModal.options.map((option, idx) => {
                      const isSelected = dropdownModal.selected === option;
                      return (
                        <TouchableOpacity
                          key={option + '_' + idx}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            dropdownModal.onSelect(option);
                            setDropdownModal(null);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* ================================================================
          CALENDAR DATE PICKER MODAL
          ================================================================ */}
      <CalendarDatePickerModal
        visible={calendarVisible}
        title="Select Date Finished"
        initialDate={formData.dateFinished}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={handleDateSelected}
      />
    </SafeAreaView>
  );
};

export default LiteracyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 76 : 68,
    left: 16,
    right: 16,
    zIndex: 9999,
  },


  mainScroll: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainScrollContent: {
    paddingBottom: 108,
  },

  // -------------------------------------------------------------
  // TAB BAR (UNDERLINE STYLE)
  // -------------------------------------------------------------
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 28,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabButtonActive: {
    borderBottomColor: '#135E66',
  },
  tabButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#64748B',
  },
  tabButtonTextActive: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#135E66',
  },

  // -------------------------------------------------------------
  // TAB 1: LOG SUBHEADER & EMPTY STATE
  // -------------------------------------------------------------
  logContainer: {
    flex: 1,
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  statsSummaryText: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    flex: 1,
  },
  addEntryButton: {
    backgroundColor: '#135E66',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEntryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 160,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#64748B',
  },

  // -------------------------------------------------------------
  // ENTRY LIST CARD (100% IDENTIC TO WHATFONT REFERENCE)
  // -------------------------------------------------------------
  entryList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.sm,
  },
  leftAccentLine: {
    width: 3.5,
    backgroundColor: '#135E66',
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  entryContentCol: {
    flex: 1,
  },
  entryRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  entryTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: '#1B2D4F',
    flex: 1,
    marginRight: 8,
  },
  entryDateText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
  },
  entryRowSecond: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entryAuthorText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
  },
  entryGoldStars: {
    fontSize: 13,
    color: '#B8842A',
    letterSpacing: 2,
  },
  entryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typePill: {
    backgroundColor: '#E6F4F6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typePillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: '#1A5F6E',
  },
  genrePill: {
    backgroundColor: '#F7F3EC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  genrePillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '500',
    color: '#1C1917',
  },
  entryQuoteText: {
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: '#1C1917',
    marginTop: 2,
  },

  // -------------------------------------------------------------
  // DETAIL VIEW (IMAGE 1 & 2 OF DETAIL)
  // -------------------------------------------------------------
  detailViewContainer: {
    paddingTop: 12,
  },
  detailCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  detailHeaderBanner: {
    backgroundColor: '#1C4E5B',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  detailBannerTitle: {
    fontFamily: FONTS.georgia,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailBannerAuthor: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#E2E8F0',
  },
  detailCardBody: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  detailStepBoxClaim: {
    backgroundColor: '#EBF5F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4EBF0',
    padding: 14,
  },
  detailStepLabelClaim: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    color: '#1A5F6E',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  detailStepBoxEvidence: {
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5DE9C',
    padding: 14,
  },
  detailStepLabelEvidence: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#A16207',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailStepBoxSoWhat: {
    backgroundColor: '#EAF7EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7E4C7',
    padding: 14,
  },
  detailStepLabelSoWhat: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#2D7D46',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailStepBoxConnection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  detailStepLabelConnection: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailStepBodyText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
  },
  detailActionBtnWrap: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 30,
  },
  editEntryBtn: {
    height: 48,
    backgroundColor: '#135E66',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editEntryBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteEntryBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteEntryBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#DC2626',
  },

  // -------------------------------------------------------------
  // ADD & EDIT ENTRY FORM
  // -------------------------------------------------------------
  addFormContainer: {
    paddingTop: 12,
  },
  backToLogLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backToLogText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1A5F6E',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  cardSectionTitle: {
    fontFamily: FONTS.georgia,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    color: '#1A5F6E',
    marginBottom: 14,
  },
  cardSectionTitleReflection: {
    fontFamily: FONTS.georgia,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    color: '#1B2D4F',
    marginBottom: 14,
  },
  cardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: -8,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#1E293B',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#1E293B',
    flex: 1,
    marginRight: 6,
  },
  placeholderText: {
    color: '#94A3B8',
  },

  // -------------------------------------------------------------
  // MY REFLECTION (3-TIER CONTAINERS)
  // -------------------------------------------------------------
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  badgeLetter: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  stepSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // 1. Claim Box
  claimContainer: {
    backgroundColor: '#EBF5F7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C4E3E8',
    padding: 14,
    marginBottom: 16,
  },
  claimBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A5F6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#1A5F6E',
  },
  claimRadioCardSelected: {
    borderColor: '#135E66',
    borderWidth: 1.5,
    backgroundColor: '#E0EFF2',
  },
  claimRadioCircleSelected: {
    borderColor: '#135E66',
  },
  claimRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#135E66',
  },
  claimPromptTextSelected: {
    fontFamily: FONTS.medium,
    color: '#135E66',
  },

  // 2. Evidence Box
  evidenceContainer: {
    backgroundColor: '#FFF9EB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F5DE9C',
    padding: 14,
    marginBottom: 16,
  },
  evidenceBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#B47A1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15.5,
    color: '#A16207',
  },
  evidenceRadioCardSelected: {
    borderColor: '#B47A1E',
    borderWidth: 1.5,
    backgroundColor: '#FEF3C7',
  },
  evidenceRadioCircleSelected: {
    borderColor: '#B47A1E',
  },
  evidenceRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B47A1E',
  },
  evidencePromptTextSelected: {
    fontFamily: FONTS.medium,
    color: '#A16207',
  },

  // 3. So What? Box
  soWhatContainer: {
    backgroundColor: '#EAF7EE',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B7E4C7',
    padding: 14,
    marginBottom: 4,
  },
  soWhatBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2D7D46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soWhatTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15.5,
    color: '#2D7D46',
  },
  soWhatRadioCardSelected: {
    borderColor: '#2D7D46',
    borderWidth: 1.5,
    backgroundColor: '#DCFCE7',
  },
  soWhatRadioCircleSelected: {
    borderColor: '#2D7D46',
  },
  soWhatRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7D46',
  },
  soWhatPromptTextSelected: {
    fontFamily: FONTS.medium,
    color: '#2D7D46',
  },

  // Radio Options
  radioGroup: {
    gap: 8,
    marginBottom: 10,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioPromptText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
    lineHeight: 18,
  },
  reflectionTextarea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 85,
    marginTop: 4,
  },

  // Action Buttons
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.5,
    color: '#475569',
  },
  saveButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E0D8',
  },
  saveButtonActive: {
    backgroundColor: '#135E66',
  },
  saveButtonText: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveButtonTextActive: {
    fontFamily: FONTS.titleSemiBold,
    color: '#FFFFFF',
  },

  // -------------------------------------------------------------
  // TAB 2: PROGRESS VIEW
  // -------------------------------------------------------------
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderTopWidth: 3,
    ...SHADOWS.sm,
  },
  metricCardTeal: {
    borderTopColor: '#135E66',
  },
  metricCardAmber: {
    borderTopColor: '#B8842A',
  },
  metricCardGreen: {
    borderTopColor: '#16A34A',
  },
  metricCardNavy: {
    borderTopColor: '#1B2D4F',
  },
  metricValue: {
    fontFamily: FONTS.georgia,
    fontSize: 22,
    lineHeight: 33,
    fontWeight: '800',
  },
  metricTargetText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '400',
    color: '#78716C',
    marginTop: 2,
    marginBottom: 4,
  },
  metricLabelText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '400',
    color: '#1F2937',
  },

  // Dark Navy Target Card
  targetCardDark: {
    backgroundColor: '#1A2B49',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  targetCardDarkTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetBullet: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 2,
  },
  targetRowText: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#CBD5E1',
  },
  targetRowTextMet: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    color: '#86EFAC',
  },
  targetDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },

  // -------------------------------------------------------------
  // CONFIRMATION DIALOG MODAL FOR DELETE
  // -------------------------------------------------------------
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.lg,
  },
  dialogTitle: {
    fontFamily: FONTS.titleSemiBold,
    fontSize: 17,
    color: '#1E293B',
    marginBottom: 8,
  },
  dialogMessage: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 20,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dialogCancelBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: '#475569',
  },
  dialogDeleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  dialogDeleteBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // -------------------------------------------------------------
  // DROPDOWN POPOVER MODAL
  // -------------------------------------------------------------
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#1E60D5',
  },
  dropdownItemText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#1E293B',
  },
  dropdownItemTextSelected: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
