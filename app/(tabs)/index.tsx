import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/utils/SettingsContext';
import {
  DailyRecord,
  getDailyRecords,
  getProfile,
  getSettings,
  saveDailyRecord,
  SystemSettings,
  UserProfile,
} from '@/utils/storage';
import {
  calculateDailyTotalMinutes,
  formatDurationFromMinutes,
  formatTime,
  getTimeGreeting,
} from '@/utils/time';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Shift config ─────────────────────────────────────────────────────────────
const SHIFTS = [
  { key: 'morning', label: 'Morning', inKey: 'morningIn', outKey: 'morningOut', emoji: '🌅', grad: ['#FF9500', '#FFCC00'] as const },
  { key: 'afternoon', label: 'Afternoon', inKey: 'afternoonIn', outKey: 'afternoonOut', emoji: '☀️', grad: ['#007AFF', '#5AC8FA'] as const },
  { key: 'overtime', label: 'Overtime', inKey: 'overtimeIn', outKey: 'overtimeOut', emoji: '🌙', grad: ['#7B61FF', '#AF52DE'] as const },
] as const;

export default function DashboardScreen() {
  const [now, setNow] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const { updateSettings } = useSettings();
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  // ─── Clock tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Load data on focus ─────────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    loadAll();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []));

  const loadAll = async () => {
    const [records, prof, sett] = await Promise.all([getDailyRecords(), getProfile(), getSettings()]);
    setProfile(prof);
    setSettings(sett);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = records.find(r => r.date === todayStr);
    if (today) {
      setTodayRecord(today);
    } else {
      setTodayRecord({ date: todayStr, morningIn: null, morningOut: null, afternoonIn: null, afternoonOut: null, overtimeIn: null, overtimeOut: null, totalHours: 0 });
    }
  };

  // ─── Status logic ────────────────────────────────────────────────────────────
  const currentStatus = () => {
    if (!todayRecord) return { label: 'Loading…', sublabel: '', color: '#8E8E93', action: null, active: false, finished: false };
    if (!todayRecord.morningIn) return { label: 'CLOCK IN', sublabel: 'MORNING', color: '#007AFF', action: 'morningIn', active: false, finished: false };
    if (!todayRecord.morningOut) return { label: 'CLOCK OUT', sublabel: 'MORNING', color: '#34C759', action: 'morningOut', active: true, finished: false };
    if (!todayRecord.afternoonIn) return { label: 'CLOCK IN', sublabel: 'AFTERNOON', color: '#007AFF', action: 'afternoonIn', active: false, finished: false };
    if (!todayRecord.afternoonOut) return { label: 'CLOCK OUT', sublabel: 'AFTERNOON', color: '#34C759', action: 'afternoonOut', active: true, finished: false };
    if (!todayRecord.overtimeIn) return { label: 'CLOCK IN', sublabel: 'OVERTIME', color: '#AF52DE', action: 'overtimeIn', active: false, finished: false };
    if (!todayRecord.overtimeOut) return { label: 'CLOCK OUT', sublabel: 'OVERTIME', color: '#AF52DE', action: 'overtimeOut', active: true, finished: false };
    return { label: 'ALL DONE', sublabel: 'GREAT JOB!', color: '#FF9500', action: null, active: false, finished: true };
  };
  const status = currentStatus();

  // ─── Pulse when active ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status.active) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [status.active]);

  // ─── Progress bar animation ──────────────────────────────────────────────────
  const totalMin = todayRecord ? calculateDailyTotalMinutes(todayRecord) : 0;
  const goalMin = settings?.goalHours ? settings.goalHours * 60 : 480;
  const progress = Math.min(totalMin / goalMin, 1);

  useEffect(() => {
    Animated.timing(barAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress]);

  // ─── Clock action ────────────────────────────────────────────────────────────
  const handleClockAction = async () => {
    if (!todayRecord || !status.action) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const updated = { ...todayRecord, [status.action]: new Date().toISOString() };
    updated.totalHours = calculateDailyTotalMinutes(updated) / 60;
    setTodayRecord(updated);
    await saveDailyRecord(updated);
    if (status.action.includes('Out')) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Goal modal ──────────────────────────────────────────────────────────────
  const openGoal = () => { setGoalInput(settings?.goalHours ? String(Math.round(settings.goalHours)) : ''); setGoalModalVisible(true); };
  const saveGoal = async () => {
    const parsed = Number(goalInput);
    const goal = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    await updateSettings({ goalHours: goal });
    setSettings(prev => prev ? { ...prev, goalHours: goal } : prev);
    setGoalModalVisible(false);
  };

  // ─── Theme ───────────────────────────────────────────────────────────────────
  const bgColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const subColor = useThemeColor({ light: '#8E8E93', dark: '#636366' }, 'icon');
  const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#2C2C2E' }, 'icon');

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const use24 = settings?.use24Hour !== false;

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ═══ HERO HEADER ════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={['#0A0E1A', '#0D1B3E', '#1A1060']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Top row: greeting + date */}
          <Animated.View style={[styles.heroTop, { opacity: fadeAnim }]}>
            <View>
              <ThemedText style={styles.greeting}>{getTimeGreeting()}</ThemedText>
              <ThemedText style={styles.heroName}>{profile?.name || 'OJT Trainee'}</ThemedText>
            </View>
            <View style={styles.datePill}>
              <ThemedText style={styles.datePillText}>{format(now, 'MMM d')}</ThemedText>
            </View>
          </Animated.View>

          {/* Live clock */}
          <View style={styles.clockRow}>
            <ThemedText style={styles.clockHM}>
              {format(now, use24 ? 'HH:mm' : 'hh:mm')}
            </ThemedText>
            <View style={styles.clockRight}>
              <ThemedText style={styles.clockSec}>{format(now, 'ss')}</ThemedText>
              {!use24 && <ThemedText style={styles.clockAmPm}>{format(now, 'a')}</ThemedText>}
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: barWidth, backgroundColor: status.color }]} />
            </View>
            <View style={styles.progressLabels}>
              <ThemedText style={styles.progressText}>{formatDurationFromMinutes(totalMin)} logged</ThemedText>
              <ThemedText style={styles.progressText}>{Math.round(progress * 100)}%</ThemedText>
            </View>
          </View>

          {/* CTA Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: status.finished ? '#1C1C1E' : status.color }]}
              onPress={handleClockAction}
              disabled={status.finished}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.ctaBtnLabel}>{status.label}</ThemedText>
              {!!status.sublabel && <ThemedText style={styles.ctaBtnSub}>{status.sublabel}</ThemedText>}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* ═══ STATS STRIP ════════════════════════════════════════════════════ */}
        <View style={styles.statsStrip}>
          {[
            { label: 'TODAY', value: formatDurationFromMinutes(totalMin) },
            { label: 'GOAL', value: settings?.goalHours ? `${Math.round(settings.goalHours)}h` : '—' },
            { label: 'LEFT', value: formatDurationFromMinutes(Math.max(goalMin - totalMin, 0)) },
          ].map(s => (
            <View key={s.label} style={[styles.statCell, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <ThemedText style={[styles.statCellLabel, { color: subColor }]}>{s.label}</ThemedText>
              <ThemedText style={[styles.statCellValue, { color: textColor }]}>{s.value}</ThemedText>
            </View>
          ))}
        </View>

        {/* ═══ SHIFT CARDS ════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: subColor }]}>TODAY'S SHIFTS</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: borderCol }]} />
          </View>

          {SHIFTS.map(shift => {
            const timeIn = todayRecord?.[shift.inKey] ?? null;
            const timeOut = todayRecord?.[shift.outKey] ?? null;
            const isActiveShift = status.action?.startsWith(shift.key);
            const isDone = !!timeIn && !!timeOut;
            const isLive = !!timeIn && !timeOut;

            return (
              <View key={shift.key} style={[styles.shiftCard, { backgroundColor: cardBg, borderColor: isActiveShift ? status.color : borderCol }]}>
                {/* Left accent bar */}
                <LinearGradient colors={shift.grad} style={styles.shiftAccent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

                <View style={styles.shiftBody}>
                  <View style={styles.shiftLeft}>
                    <ThemedText style={styles.shiftEmoji}>{shift.emoji}</ThemedText>
                    <View>
                      <ThemedText style={[styles.shiftLabel, { color: textColor }]}>{shift.label}</ThemedText>
                      {isLive && (
                        <View style={styles.liveBadge}>
                          <View style={[styles.liveDot, { backgroundColor: status.color }]} />
                          <ThemedText style={[styles.liveText, { color: status.color }]}>LIVE</ThemedText>
                        </View>
                      )}
                      {isDone && <ThemedText style={[styles.doneText, { color: subColor }]}>Completed</ThemedText>}
                    </View>
                  </View>

                  <View style={styles.shiftTimes}>
                    <TimeChip label="IN" time={formatTime(timeIn, use24)} filled={!!timeIn} color={shift.grad[0]} cardBg={cardBg} borderCol={borderCol} textColor={textColor} subColor={subColor} />
                    <View style={[styles.shiftArrow, { backgroundColor: borderCol }]} />
                    <TimeChip label="OUT" time={formatTime(timeOut, use24)} filled={!!timeOut} color={shift.grad[1]} cardBg={cardBg} borderCol={borderCol} textColor={textColor} subColor={subColor} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ═══ GOAL CARD ══════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: subColor }]}>OJT GOAL</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: borderCol }]} />
          </View>
          <View style={[styles.goalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <LinearGradient colors={['#007AFF', '#5856D6']} style={styles.goalAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={styles.goalBody}>
              <View style={styles.goalLeft}>
                <ThemedText style={[styles.goalHours, { color: textColor }]}>
                  {settings?.goalHours ? `${Math.round(settings.goalHours)}h` : 'No goal'}
                </ThemedText>
                <ThemedText style={[styles.goalSub, { color: subColor }]}>
                  {settings?.goalHours
                    ? `${formatDurationFromMinutes(Math.max(goalMin - totalMin, 0))} remaining`
                    : 'Tap to set your OJT goal'}
                </ThemedText>
              </View>
              <TouchableOpacity style={[styles.goalEditBtn, { borderColor: '#007AFF' }]} onPress={openGoal}>
                <ThemedText style={styles.goalEditLabel}>{settings?.goalHours ? 'Edit' : 'Set'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══ GOAL MODAL ═════════════════════════════════════════════════════ */}
      <Modal visible={goalModalVisible} transparent animationType="fade" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Set OJT Goal Hours</ThemedText>
            <ThemedText style={[styles.modalSub, { color: subColor }]}>e.g. 486 for a 486-hour internship</ThemedText>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Enter hours…"
              placeholderTextColor={subColor}
              keyboardType="number-pad"
              style={[styles.modalInput, { borderColor: borderCol, color: textColor }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setGoalModalVisible(false)} style={styles.modalCancel}>
                <ThemedText style={[styles.modalCancelText, { color: subColor }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={saveGoal} style={[styles.modalSave, { backgroundColor: '#007AFF' }]}>
                <ThemedText style={styles.modalSaveText}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-component: time chip ─────────────────────────────────────────────────
function TimeChip({ label, time, filled, color, cardBg, borderCol, textColor, subColor }: {
  label: string; time: string; filled: boolean; color: string;
  cardBg: string; borderCol: string; textColor: string; subColor: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: filled ? color + '18' : 'transparent', borderColor: filled ? color : borderCol }]}>
      <ThemedText style={[styles.chipLabel, { color: filled ? color : subColor }]}>{label}</ThemedText>
      <ThemedText style={[styles.chipTime, { color: filled ? textColor : subColor }]}>{time}</ThemedText>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 24 },

  // Hero
  hero: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  datePillText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Clock
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 8,
  },
  clockHM: {
    fontSize: 64,
    fontWeight: '200',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -4,
    lineHeight: 68,
  },
  clockRight: {
    paddingBottom: 8,
    gap: 2,
  },
  clockSec: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clockAmPm: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5AC8FA',
    letterSpacing: 1,
  },

  // Progress
  progressWrap: { marginBottom: 20 },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // CTA Button
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  ctaBtnSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
  },
  statCell: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statCellLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statCellValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // Section
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionLine: { flex: 1, height: 1 },

  // Shift card
  shiftCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  shiftAccent: { width: 4 },
  shiftBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingLeft: 12,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shiftEmoji: { fontSize: 22 },
  shiftLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  doneText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  shiftTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftArrow: {
    width: 16,
    height: 1,
  },

  // Time chip
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
  },
  chipLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  chipTime: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Goal card
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  goalAccent: { width: 5 },
  goalBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  goalLeft: { flex: 1 },
  goalHours: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  goalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  goalEditBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goalEditLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007AFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
