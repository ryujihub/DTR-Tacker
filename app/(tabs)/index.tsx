
import DtrHeader from '@/components/DtrHeader';
import { ThemedText } from '@/components/themed-text';
import { TimeSlot } from '@/components/TimeSlot';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/utils/SettingsContext';
import {
  DailyRecord,
  getDailyRecords,
  getProfile,
  getSettings,
  saveDailyRecord,
  SystemSettings,
  UserProfile
} from '@/utils/storage';
import {
  calculateDailyTotalMinutes,
  formatDate,
  formatDurationFromMinutes,
  getTimeGreeting
} from '@/utils/time';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const ACTION_SIZE = width * 0.58;

export default function DashboardScreen() {
  const [now, setNow] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const { updateSettings } = useSettings();
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState<string>('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
      loadProfileData();
      loadSettingsData();
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();
    }, [slideAnim])
  );

  const loadSettingsData = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const openEditGoal = () => {
    setGoalInput(settings?.goalHours ? String(settings.goalHours) : '');
    setGoalModalVisible(true);
  };

  const saveGoal = async () => {
    const parsed = Number(goalInput);
    const goal = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    await updateSettings({ goalHours: goal });
    setSettings(prev => prev ? { ...prev, goalHours: goal } : prev);
    setGoalModalVisible(false);
  };

  const loadProfileData = async () => {
    const data = await getProfile();
    setProfile(data);
  };

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
    if (!todayRecord) return { label: 'Syncing...', color: '#8E8E93', active: false };

    if (!todayRecord.morningIn) return { label: 'CLOCK IN', subLabel: 'MORNING', color: '#007AFF', action: 'morningIn', active: false };
    if (!todayRecord.morningOut) return { label: 'CLOCK OUT', subLabel: 'MORNING', color: '#34C759', action: 'morningOut', active: true };
    if (!todayRecord.afternoonIn) return { label: 'CLOCK IN', subLabel: 'AFTERNOON', color: '#007AFF', action: 'afternoonIn', active: false };
    if (!todayRecord.afternoonOut) return { label: 'CLOCK OUT', subLabel: 'AFTERNOON', color: '#34C759', action: 'afternoonOut', active: true };
    if (!todayRecord.overtimeIn) return { label: 'CLOCK IN', subLabel: 'OVERTIME', color: '#AF52DE', action: 'overtimeIn', active: false };
    if (!todayRecord.overtimeOut) return { label: 'CLOCK OUT', subLabel: 'OVERTIME', color: '#AF52DE', action: 'overtimeOut', active: true };

    return { label: 'WORK DONE', subLabel: 'FOR TODAY', color: '#FF9500', active: false, finished: true };
  };

  const status = currentStatus();
  const bgColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');

  useEffect(() => {
    if (status.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status.active, pulseAnim]);

  const handleClockAction = async () => {
    if (!todayRecord || !status.action) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const updated = { ...todayRecord, [status.action]: new Date().toISOString() };
    updated.totalHours = calculateDailyTotalMinutes(updated) / 60;
    setTodayRecord(updated);
    await saveDailyRecord(updated);
    if (status.action.includes('Out')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const totalMin = todayRecord ? calculateDailyTotalMinutes(todayRecord) : 0;
  const goalMin = settings?.goalHours ? settings.goalHours * 60 : 480;
  const progress = Math.min(totalMin / goalMin, 1);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.headerSection, { opacity: slideAnim }]}>
          <DtrHeader />
        </Animated.View>

        <View style={styles.heroSection}>
          <View style={styles.greetingGroup}>
            <ThemedText style={styles.greeting}>{getTimeGreeting()},</ThemedText>
            <ThemedText style={[styles.userName, { color: textColor }]}>{profile?.name || 'User'}</ThemedText>
            <ThemedText style={styles.dateBadge}>{formatDate(now).toUpperCase()}</ThemedText>
          </View>

          <View style={styles.actionCenter}>
            <View style={styles.ringContainer}>
              {/* Progress Ring Background */}
              <View style={[styles.ringBg, { borderColor: borderCol }]} />

              {/* Progress Ring Simulation */}
              <View style={[styles.ringFill, {
                transform: [{ rotate: `${progress * 360}deg` }],
                borderColor: status.color,
                opacity: progress > 0 ? 1 : 0
              }]} />

              <TouchableOpacity
                style={[styles.mainButton, { shadowColor: status.color, backgroundColor: cardBg }]}
                onPress={handleClockAction}
                disabled={status.finished}
                activeOpacity={0.9}
              >
                <Animated.View style={[styles.buttonInner, { transform: [{ scale: pulseAnim }], backgroundColor: status.finished ? bgColor : cardBg, borderColor: borderCol }]}>
                  <ThemedText style={[styles.clockTime, { color: textColor }]}>{format(now, settings?.use24Hour === false ? 'hh:mm' : 'HH:mm')}</ThemedText>
                  {settings?.use24Hour === false && <ThemedText style={styles.clockAmPm}>{format(now, 'a')}</ThemedText>}
                  <ThemedText style={styles.clockSeconds}>{format(now, 'ss')}</ThemedText>

                  <View style={[styles.statusTag, { backgroundColor: status.color + '15' }]}>
                    <ThemedText style={[styles.statusLabel, { color: status.color }]}>{status.label}</ThemedText>
                    <ThemedText style={[styles.statusSubLabel, { color: status.color }]}>{status.subLabel}</ThemedText>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>

            <View style={styles.quickStats}>
              <View style={[styles.statItem, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <ThemedText style={styles.statLabel}>GOAL PROGRESS</ThemedText>
                <View style={styles.statValueRow}>
                  <ThemedText style={[styles.statValue, { color: textColor }]}>{formatDurationFromMinutes(totalMin)}</ThemedText>
                  <View style={[styles.statDivider, { backgroundColor: borderCol }]} />
                  <ThemedText style={styles.statPercentage}>{Math.round(progress * 100)}%</ThemedText>
                </View>
              </View>
            </View>
            {/* Goal Hours Card */}
            {settings?.goalHours ? (
              <View style={[styles.goalBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.statLabel}>GOAL</ThemedText>
                  <TouchableOpacity onPress={openEditGoal}>
                    <ThemedText style={styles.editLink}>Edit</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={[styles.statValue, { color: textColor }]}>{Math.round(settings.goalHours)}h</ThemedText>
                <ThemedText style={styles.statSub}>{formatDurationFromMinutes(totalMin)} logged • {formatDurationFromMinutes(Math.max(goalMin - totalMin, 0))} remaining</ThemedText>
              </View>
            ) : (
              <View style={[styles.goalBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.statLabel}>GOAL</ThemedText>
                  <TouchableOpacity onPress={openEditGoal}>
                    <ThemedText style={styles.editLink}>Set</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.statSub}>No goal set</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.logsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>SHIFTS & LOGS</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: borderCol }]} />
          </View>

          <View style={styles.logsGrid}>
            <TimeSlot
              label="MORNING"
              icon="sun.max.fill"
              timeIn={todayRecord?.morningIn}
              timeOut={todayRecord?.morningOut}
              colors={['#FF9500', '#FFCC00']}
              isActive={status.action?.startsWith('morning')}
            />
            <TimeSlot
              label="AFTERNOON"
              icon="cloud.sun.fill"
              timeIn={todayRecord?.afternoonIn}
              timeOut={todayRecord?.afternoonOut}
              colors={['#007AFF', '#5AC8FA']}
              isActive={status.action?.startsWith('afternoon')}
            />
            <TimeSlot
              label="OVERTIME"
              icon="moon.stars.fill"
              timeIn={todayRecord?.overtimeIn}
              timeOut={todayRecord?.overtimeOut}
              colors={['#5856D6', '#AF52DE']}
              isActive={status.action?.startsWith('overtime')}
            />
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' }}>
          <View style={{ width: '90%', backgroundColor: cardBg, borderRadius: 12, padding: 16 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Set Goal Hours</ThemedText>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="e.g. 486"
              keyboardType="number-pad"
              style={{ borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 10, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Pressable onPress={() => setGoalModalVisible(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <ThemedText style={{ color: '#8E8E93' }}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={saveGoal} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <ThemedText style={{ color: '#007AFF', fontWeight: '700' }}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  headerSection: {
    paddingTop: 50,
  },
  heroSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  greetingGroup: {
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
    marginTop: 2,
  },
  dateBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 2,
    marginTop: 8,
    backgroundColor: '#007AFF10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionCenter: {
    width: '100%',
    alignItems: 'center',
  },
  ringContainer: {
    width: ACTION_SIZE + 32,
    height: ACTION_SIZE + 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    width: ACTION_SIZE + 24,
    height: ACTION_SIZE + 24,
    borderRadius: (ACTION_SIZE + 24) / 2,
    borderWidth: 8,
    borderColor: '#EFEFF4',
  },
  ringFill: {
    position: 'absolute',
    width: ACTION_SIZE + 24,
    height: ACTION_SIZE + 24,
    borderRadius: (ACTION_SIZE + 24) / 2,
    borderWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  mainButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: '#FFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    padding: 10,
  },
  buttonInner: {
    flex: 1,
    borderRadius: ACTION_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  clockTime: {
    fontSize: 33,
    fontWeight: '200',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -2,
  },
  clockAmPm: {
    position: 'absolute',
    top: '30%',
    right: '25%',
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
  },
  clockSeconds: {
    position: 'absolute',
    top: '56%',
    right: '28%',
    fontSize: 12,
    fontWeight: '700',
    color: '#C7C7CC',
  },
  statusTag: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusSubLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
    opacity: 0.7,
  },
  quickStats: {
    marginTop: 40,
    width: '100%',
  },
  statItem: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
  },
  statPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  goalBox: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
  },
  statSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
  },
  logsSection: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E8E93',
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  logsGrid: {
    gap: 12,
  },
});
