import DtrHeader from '@/components/DtrHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  DailyRecord,
  getDailyRecords,
  saveDailyRecord
} from '@/utils/storage';
import {
  calculateDailyTotalMinutes,
  formatDate,
  formatDurationFromMinutes,
  formatTime
} from '@/utils/time';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [now, setNow] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();
    }, [])
  );

  const loadTodayData = async () => {
    const records = await getDailyRecords();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = records.find(r => r.date === todayStr);

    if (today) {
      setTodayRecord(today);
    } else {
      const newRecord: DailyRecord = {
        date: todayStr,
        morningIn: null, morningOut: null,
        afternoonIn: null, afternoonOut: null,
        overtimeIn: null, overtimeOut: null,
        totalHours: 0
      };
      setTodayRecord(newRecord);
    }
  };

  const currentStatus = () => {
    if (!todayRecord) return { label: 'Syncing', color: '#8E8E93', active: false };

    if (!todayRecord.morningIn) return { label: 'AM IN', color: '#007AFF', action: 'morningIn', active: false };
    if (!todayRecord.morningOut) return { label: 'AM OUT', color: '#34C759', action: 'morningOut', active: true };
    if (!todayRecord.afternoonIn) return { label: 'PM IN', color: '#007AFF', action: 'afternoonIn', active: false };
    if (!todayRecord.afternoonOut) return { label: 'PM OUT', color: '#34C759', action: 'afternoonOut', active: true };
    if (!todayRecord.overtimeIn) return { label: 'OT IN', color: '#AF52DE', action: 'overtimeIn', active: false };
    if (!todayRecord.overtimeOut) return { label: 'OT OUT', color: '#AF52DE', action: 'overtimeOut', active: true };

    return { label: 'DONE', color: '#FF9500', active: false, finished: true };
  };

  const status = currentStatus();

  useEffect(() => {
    if (status.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status.active]);

  const handleClockAction = async () => {
    if (!todayRecord || !status.action) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = { ...todayRecord, [status.action]: new Date().toISOString() };
    updated.totalHours = calculateDailyTotalMinutes(updated) / 60;
    setTodayRecord(updated);
    await saveDailyRecord(updated);
    if (status.action.includes('Out')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const totalMin = todayRecord ? calculateDailyTotalMinutes(todayRecord) : 0;
  const progress = Math.min(totalMin / 480, 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], opacity: slideAnim }}>
        <DtrHeader />
      </Animated.View>

      <View style={styles.bentoGrid}>
        {/* Row 1: Clock (Main Bento Box) */}
        <View style={[styles.bentoBox, styles.largeBox]}>
          <ThemedText style={styles.dateLabel}>{formatDate(now).toUpperCase()}</ThemedText>
          <ThemedText style={styles.clockValue}>{format(now, 'HH:mm:ss')}</ThemedText>
          <View style={styles.tagRow}>
            <View style={[styles.statusTag, { backgroundColor: status.color + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <ThemedText style={[styles.statusText, { color: status.color }]}>{status.label}</ThemedText>
            </View>
          </View>
        </View>

        {/* Row 2: Action + Progress (Side by Side) */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={[styles.bentoBox, styles.actionBox, { shadowColor: status.color }]}
            onPress={handleClockAction}
            disabled={status.finished}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.btnInner, { backgroundColor: status.color }]}>
              <IconSymbol name={status.finished ? "checkmark.seal.fill" : "clock.fill"} size={28} color="#FFF" />
              <ThemedText style={styles.btnLabel}>Log Time</ThemedText>
            </Animated.View>
          </TouchableOpacity>

          <View style={[styles.bentoBox, styles.statBox]}>
            <ThemedText style={styles.statLabel}>GOAL PROGRESS</ThemedText>
            <View style={styles.progressContainer}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
              </View>
              <ThemedText style={styles.progressVal}>{Math.round(progress * 100)}%</ThemedText>
            </View>
            <ThemedText style={styles.durationValue}>{formatDurationFromMinutes(totalMin)}</ThemedText>
          </View>
        </View>

        {/* Row 3: Session Logs (Two Columns) */}
        <View style={styles.gridRow}>
          <View style={[styles.bentoBox, styles.halfBox]}>
            <View style={styles.sessionBoxHeader}>
              <IconSymbol name="sun.max.fill" size={12} color="#8E8E93" />
              <ThemedText style={styles.sessionBoxTitle}>MORNING</ThemedText>
            </View>
            <SessionRow type="IN" val={todayRecord?.morningIn} />
            <SessionRow type="OUT" val={todayRecord?.morningOut} />
          </View>

          <View style={[styles.bentoBox, styles.halfBox]}>
            <View style={styles.sessionBoxHeader}>
              <IconSymbol name="cloud.sun.fill" size={12} color="#8E8E93" />
              <ThemedText style={styles.sessionBoxTitle}>AFTERNOON</ThemedText>
            </View>
            <SessionRow type="IN" val={todayRecord?.afternoonIn} />
            <SessionRow type="OUT" val={todayRecord?.afternoonOut} />
          </View>
        </View>

        {/* Row 4: Overtime (Full Width Stats) */}
        <View style={[styles.bentoBox, styles.miniStatsBox]}>
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatItem}>
              <ThemedText style={styles.miniLabel}>OT START</ThemedText>
              <ThemedText style={styles.miniValue}>{formatTime(todayRecord?.overtimeIn)}</ThemedText>
            </View>
            <View style={styles.miniStatItem}>
              <ThemedText style={styles.miniLabel}>OT END</ThemedText>
              <ThemedText style={styles.miniValue}>{formatTime(todayRecord?.overtimeOut)}</ThemedText>
            </View>
            <View style={styles.miniStatItem}>
              <ThemedText style={styles.miniLabel}>TOTAL REND.</ThemedText>
              <ThemedText style={styles.miniValue}>{formatDurationFromMinutes(totalMin)}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SessionRow({ type, val }: { type: string, val?: string | null }) {
  return (
    <View style={styles.sessionItem}>
      <ThemedText style={styles.sessionItemType}>{type}</ThemedText>
      <ThemedText style={styles.sessionItemVal}>{formatTime(val)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  bentoGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 20,
  },
  bentoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  largeBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 2,
    marginBottom: 8,
  },
  clockValue: {
    fontSize: 52,
    fontWeight: '300',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: -1,
  },
  tagRow: {
    marginTop: 16,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBox: {
    flex: 1.2,
    padding: 8,
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  btnInner: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statBox: {
    flex: 2,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  durationValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  halfBox: {
    flex: 1,
    padding: 16,
  },
  sessionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sessionBoxTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionItemType: {
    fontSize: 8,
    fontWeight: '700',
    color: '#C7C7CC',
  },
  sessionItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  miniStatsBox: {
    padding: 16,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatItem: {
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#C7C7CC',
    marginBottom: 2,
  },
  miniValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
  }
});
