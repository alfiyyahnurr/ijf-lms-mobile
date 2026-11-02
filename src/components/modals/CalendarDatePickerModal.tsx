import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING, FONTS } from '../../constants/theme';

export interface CalendarDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
  initialDate?: string; // Formatted YYYY-MM-DD or DD/MM/YYYY
  title?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Date',
}) => {
  // Parse initial date or default to 2026-09-21 (Term 1 demo time)
  const parseInitialDate = (str?: string): Date => {
    if (!str) return new Date(2026, 8, 21); // Sep 21, 2026
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(2026, 8, 21) : d;
  };

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => parseInitialDate(initialDate));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => (initialDate ? parseInitialDate(initialDate) : null));

  useEffect(() => {
    if (visible) {
      const parsed = parseInitialDate(initialDate);
      setCurrentMonthDate(parsed);
      setSelectedDate(initialDate ? parsed : null);
    }
  }, [visible, initialDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarGrid = useMemo(() => {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      date: Date;
    }[] = [];

    // Leading days from prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Trailing days to complete weeks (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return cells;
  }, [year, month]);

  const formatDateToString = (d: Date): string => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const isSameDay = (d1: Date, d2: Date | null): boolean => {
    if (!d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handleDayPress = (cellDate: Date) => {
    setSelectedDate(cellDate);
    const formatted = formatDateToString(cellDate);
    onSelectDate(formatted);
    onClose();
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonthDate(today);
    onSelectDate(formatDateToString(today));
    onClose();
  };

  const handleClearPress = () => {
    setSelectedDate(null);
    onSelectDate('');
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              {/* Modal Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navArrowBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous Month"
                >
                  <Ionicons name="chevron-back" size={18} color="#0F172A" />
                </TouchableOpacity>

                <Text style={styles.monthLabel}>
                  {MONTH_NAMES[month]} {year}
                </Text>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navArrowBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Next Month"
                >
                  <Ionicons name="chevron-forward" size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Day Labels Row (Mo, Tu, We, ...) */}
              <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((label, index) => (
                  <View key={index} style={styles.dayLabelCell}>
                    <Text style={styles.dayLabelText}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.gridContainer}>
                {calendarGrid.map((cell, idx) => {
                  const isSelected = isSameDay(cell.date, selectedDate);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => handleDayPress(cell.date)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          !cell.isCurrentMonth && styles.dayCellMutedText,
                          isSelected && styles.dayCellSelectedText,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer Quick Action Buttons */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={handleClearPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnSecondaryText}>Clear</Text>
                </TouchableOpacity>

                <View style={styles.footerRightActions}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={handleTodayPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnOutlineText}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnPrimaryText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  monthLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabelText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
  },
  dayCellText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#0F172A',
  },
  dayCellMutedText: {
    color: '#CBD5E1',
  },
  dayCellSelectedText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  actionBtnSecondary: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionBtnSecondaryText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#DC2626',
  },
  footerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  actionBtnOutlineText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#475569',
  },
  actionBtnPrimary: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  actionBtnPrimaryText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});

export default CalendarDatePickerModal;
