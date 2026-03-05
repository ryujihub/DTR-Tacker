import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    buildRecordMap,
    DayStatus,
    getAverageDailyHours,
    getDayStatus,
    getMonthMatrix,
    getTotalHours,
    predictCompletionDate,
    toDateKey,
} from '@/utils/prediction';
import { DailyRecord, getDailyRecords, getSettings, SystemSettings } from '@/utils/storage';
import { formatDurationFromMinutes } from '@/utils/time';
import { addMonths, format, isSameDay, isSameMonth, subMonths } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
// 5 weekday columns (Mon–Fri), 4 gaps of 6px between them
const CELL_SIZE = Math.floor((width - 48 - 4 * 6) / 5);

// Mon–Fri only (indices 1–5 in the 0=Sun…6=Sat matrix)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKDAY_COLS = [1, 2, 3, 4, 5]; // columns to keep from 7-col matrix

const DOT_COLORS: Record<DayStatus, string | null> = {
    done: '#34C759',
    partial: '#FF9500',
    none: null,
};

export default function CalendarScreen() {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [viewDate, setViewDate] = useState(new Date()); // currently visible month

    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
    const subText = useThemeColor({ light: '#8E8E93', dark: '#636366' }, 'icon');

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const [recs, sett] = await Promise.all([getDailyRecords(), getSettings()]);
                setRecords(recs);
                setSettings(sett);
            })();
        }, [])
    );

    const recordMap = buildRecordMap(records);
    const today = new Date();

    // --- Prediction logic ---
    const goalHours = settings?.goalHours ?? null;
    const totalHours = getTotalHours(records);
    const avgHours = getAverageDailyHours(records);
    const remaining = goalHours !== null ? Math.max(goalHours - totalHours, 0) : null;
    const predictedDate =
        goalHours !== null && records.length > 0
            ? predictCompletionDate(records, goalHours)
            : null;
    const daysLogged = records.filter(r => r.totalHours > 0).length;

    // --- Calendar grid ---
    const matrix = getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth());

    const prevMonth = () => setViewDate(d => subMonths(d, 1));
    const nextMonth = () => setViewDate(d => addMonths(d, 1));

    const renderDot = (status: DayStatus) => {
        const color = DOT_COLORS[status];
        if (!color) return <View style={styles.dotPlaceholder} />;
        return <View style={[styles.dot, { backgroundColor: color }]} />;
    };

    const renderDayCell = (date: Date | null, colIdx: number) => {
        if (!date) {
            return <View key={`empty-${colIdx}`} style={styles.cell} />;
        }
        const key = toDateKey(date);
        const record = recordMap.get(key);
        const status = getDayStatus(record);
        const isToday = isSameDay(date, today);
        const isPredicted = predictedDate ? isSameDay(date, predictedDate) : false;
        const isCurrentMonth = isSameMonth(date, viewDate);
        const isFuture = date > today;

        return (
            <View
                key={key}
                style={[
                    styles.cell,
                    isToday && styles.cellToday,
                    isPredicted && !isToday && styles.cellPredicted,
                ]}
            >
                <ThemedText
                    style={[
                        styles.cellNumber,
                        !isCurrentMonth && { opacity: 0.3 },
                        isToday && styles.cellNumberToday,
                        isFuture && !isPredicted && { opacity: 0.4 },
                        isPredicted && styles.cellNumberPredicted,
                    ]}
                >
                    {format(date, 'd')}
                </ThemedText>
                {!isFuture && renderDot(status)}
                {isPredicted && isFuture && (
                    <View style={[styles.dot, { backgroundColor: '#AF52DE', opacity: 0.7 }]} />
                )}
                {!isPredicted && isFuture && <View style={styles.dotPlaceholder} />}
            </View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: bgColor }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ─── Header ────────────────────────────────────────── */}
                <View style={styles.topBar}>
                    <ThemedText style={[styles.screenTitle, { color: textColor }]}>Calendar</ThemedText>
                    <ThemedText style={[styles.screenSub, { color: subText }]}>OJT Progress Tracker</ThemedText>
                </View>

                {/* ─── Prediction Banner ─────────────────────────────── */}
                {goalHours !== null ? (
                    <View style={[styles.banner, { backgroundColor: cardBg, borderColor: borderCol }]}>
                        <View style={[styles.bannerAccent, { backgroundColor: totalHours >= goalHours ? '#34C759' : '#007AFF' }]} />
                        <View style={styles.bannerBody}>
                            <ThemedText style={[styles.bannerLabel, { color: subText }]}>
                                {totalHours >= goalHours ? '🎉 OJT GOAL COMPLETE!' : 'PREDICTED OJT END DATE'}
                            </ThemedText>
                            {totalHours >= goalHours ? (
                                <ThemedText style={[styles.bannerDate, { color: '#34C759' }]}>
                                    Congratulations! All {Math.round(goalHours)}h logged.
                                </ThemedText>
                            ) : predictedDate ? (
                                <>
                                    <ThemedText style={[styles.bannerDate, { color: textColor }]}>
                                        {format(predictedDate, 'MMMM dd, yyyy')}
                                    </ThemedText>
                                    <ThemedText style={[styles.bannerMeta, { color: subText }]}>
                                        {formatDurationFromMinutes(remaining! * 60)} left · {avgHours.toFixed(1)}h avg/day
                                    </ThemedText>
                                </>
                            ) : (
                                <ThemedText style={[styles.bannerMeta, { color: subText }]}>
                                    Log some hours first to get a prediction.
                                </ThemedText>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={[styles.banner, styles.bannerNeutral, { backgroundColor: cardBg, borderColor: borderCol }]}>
                        <View style={[styles.bannerAccent, { backgroundColor: '#FF9500' }]} />
                        <View style={styles.bannerBody}>
                            <ThemedText style={[styles.bannerLabel, { color: subText }]}>NO GOAL SET</ThemedText>
                            <ThemedText style={[styles.bannerMeta, { color: subText }]}>
                                Go to Settings → Set a goal to enable prediction.
                            </ThemedText>
                        </View>
                    </View>
                )}

                {/* ─── Quick Stats ───────────────────────────────────── */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'DAYS LOGGED', value: String(daysLogged) },
                        { label: 'TOTAL HRS', value: `${totalHours.toFixed(1)}h` },
                        { label: 'GOAL HRS', value: goalHours !== null ? `${Math.round(goalHours)}h` : '—' },
                        { label: 'AVG/DAY', value: avgHours > 0 ? `${avgHours.toFixed(1)}h` : '—' },
                    ].map(stat => (
                        <View key={stat.label} style={[styles.statPill, { backgroundColor: cardBg, borderColor: borderCol }]}>
                            <ThemedText style={[styles.pillLabel, { color: subText }]}>{stat.label}</ThemedText>
                            <ThemedText style={[styles.pillValue, { color: textColor }]}>{stat.value}</ThemedText>
                        </View>
                    ))}
                </View>

                {/* ─── Calendar Card ─────────────────────────────────── */}
                <View style={[styles.calCard, { backgroundColor: cardBg, borderColor: borderCol }]}>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
                            <ThemedText style={styles.navArrow}>‹</ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={[styles.monthTitle, { color: textColor }]}>
                            {format(viewDate, 'MMMM yyyy')}
                        </ThemedText>
                        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
                            <ThemedText style={styles.navArrow}>›</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Day Labels */}
                    <View style={styles.dayLabelRow}>
                        {DAY_LABELS.map(d => (
                            <ThemedText key={d} style={[styles.dayLabel, { color: subText }]}>{d}</ThemedText>
                        ))}
                    </View>

                    {/* Grid — Mon–Fri only */}
                    {matrix.map((week, rowIdx) => (
                        <View key={rowIdx} style={styles.weekRow}>
                            {WEEKDAY_COLS.map(colIdx => renderDayCell(week[colIdx] ?? null, colIdx))}
                        </View>
                    ))}

                    {/* Legend */}
                    <View style={[styles.legend, { borderTopColor: borderCol }]}>
                        {[
                            { color: '#34C759', label: 'Full Day' },
                            { color: '#FF9500', label: 'Partial' },
                            { color: '#AF52DE', label: 'Predicted End' },
                        ].map(item => (
                            <View key={item.label} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <ThemedText style={[styles.legendLabel, { color: subText }]}>{item.label}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },

    topBar: { marginBottom: 20 },
    screenTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    screenSub: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginTop: 2,
        textTransform: 'uppercase',
    },

    // Prediction banner
    banner: {
        flexDirection: 'row',
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 16,
        minHeight: 80,
    },
    bannerNeutral: {},
    bannerAccent: { width: 5 },
    bannerBody: { flex: 1, padding: 16 },
    bannerLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    bannerDate: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    bannerMeta: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },

    // Quick stats
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    statPill: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    pillLabel: {
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign: 'center',
    },
    pillValue: {
        fontSize: 14,
        fontWeight: '900',
        textAlign: 'center',
    },

    // Calendar card
    calCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        overflow: 'hidden',
    },

    // Month nav
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    navBtn: {
        padding: 8,
        borderRadius: 12,
    },
    navArrow: {
        fontSize: 24,
        fontWeight: '300',
        color: '#007AFF',
    },
    monthTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    },

    // Day labels
    dayLabelRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    dayLabel: {
        width: CELL_SIZE,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginHorizontal: 3,
    },

    // Week row & cells
    weekRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: CELL_SIZE / 2,
        marginHorizontal: 3,
    },
    cellToday: {
        borderWidth: 1.5,
        borderColor: '#007AFF',
        backgroundColor: '#007AFF0D',
    },
    cellPredicted: {
        borderWidth: 1.5,
        borderColor: '#AF52DE',
        backgroundColor: '#AF52DE0D',
    },
    cellNumber: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    cellNumberToday: {
        color: '#007AFF',
        fontWeight: '900',
    },
    cellNumberPredicted: {
        color: '#AF52DE',
        fontWeight: '900',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    dotPlaceholder: {
        width: 5,
        height: 5,
    },

    // Legend
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    legendLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
});
