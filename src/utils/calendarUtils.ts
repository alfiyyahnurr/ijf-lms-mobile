export interface SchoolDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  dayShort: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  dayNumber: number;
  monthName: string;
  year: number;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
}

export interface SchoolWeek {
  monday: Date;
  friday: Date;
  weekStartIso: string; // YYYY-MM-DD
  rangeLabel: string; // e.g. "19 October – 23 October"
  yearLabel: string; // e.g. "2026"
  days: SchoolDay[];
  isCurrentWeek: boolean;
}

/**
 * Calculates a dynamic 5-day school week (Monday to Friday, excluding Saturday and Sunday).
 * @param baseDate Current reference date (defaults to today's date in October 2026)
 * @param offset Number of weeks to offset from current week (0 = current week, -1 = previous week)
 */
export function getSchoolWeek(baseDate: Date = new Date(), offset: number = 0): SchoolWeek {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);

  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday + offset * 7);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const dayNames: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  const dayShorts: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const days: SchoolDay[] = [];
  for (let i = 0; i < 5; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);

    const isToday = cur.getTime() === d.getTime();
    const isFuture = cur.getTime() > d.getTime();
    const isPast = cur.getTime() < d.getTime();

    const monthName = cur.toLocaleString('en-US', { month: 'long' });
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');

    days.push({
      date: cur,
      dateString: `${yyyy}-${mm}-${dd}`,
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      dayNumber: cur.getDate(),
      monthName,
      year: yyyy,
      isToday,
      isFuture,
      isPast,
    });
  }

  const monMonth = monday.toLocaleString('en-US', { month: 'long' });
  const friMonth = friday.toLocaleString('en-US', { month: 'long' });

  // Format: "19 October – 23 October" (or "29 September – 3 October" across month boundaries)
  const rangeLabel =
    monMonth === friMonth
      ? `${monday.getDate()} ${monMonth} – ${friday.getDate()} ${friMonth}`
      : `${monday.getDate()} ${monMonth} – ${friday.getDate()} ${friMonth}`;

  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');

  return {
    monday,
    friday,
    weekStartIso: `${yyyy}-${mm}-${dd}`,
    rangeLabel,
    yearLabel: String(monday.getFullYear()),
    days,
    isCurrentWeek: offset === 0,
  };
}
