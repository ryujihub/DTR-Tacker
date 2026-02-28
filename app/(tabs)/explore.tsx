import { ManualEntryModal } from '@/components/ManualEntryModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { generatePDFReport } from '@/utils/report';
import { clearAllData, DailyRecord, deleteDailyRecord, getDailyRecords, getProfile, getSettings, SystemSettings } from '@/utils/storage';
import { calculateDailyTotalMinutes, formatDurationFromMinutes, formatTime, getRelativeDate } from '@/utils/time';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const bgColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
  const headerBg = useThemeColor({ light: '#F9F9F9', dark: '#2C2C2E' }, 'background');

  useFocusEffect(
    useCallback(() => {
      loadRecords();
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const loadRecords = async () => {
    const data = await getDailyRecords();
    setRecords(data);
  };

  const handleDeleteRecord = (date: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this specific log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDailyRecord(date);
            loadRecords();
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all records and profile information. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            loadRecords();
          }
        }
      ]
    );
  };

  const totalMin = records.reduce((acc, r) => acc + calculateDailyTotalMinutes(r), 0);

  const renderHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: headerBg }]}>
      <View style={[styles.cell, styles.dateCol]}><ThemedText style={styles.headerText}>DATE</ThemedText></View>
      <View style={[styles.cell, styles.morningCol]}><ThemedText style={styles.headerText}>MORNING</ThemedText></View>
      <View style={[styles.cell, styles.afternoonCol]}><ThemedText style={styles.headerText}>AFTERNOON</ThemedText></View>
      <View style={[styles.cell, styles.overtimeCol]}><ThemedText style={styles.headerText}>OVERTIME</ThemedText></View>
    </View>
  );

  

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.preTitle}>ATTENDANCE LOGS</ThemedText>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>History</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={async () => {
              const profile = await getProfile();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              generatePDFReport(records, profile);
            }}
            style={[styles.exportBtn, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#EAF5FF' }]}
          >
            <IconSymbol name="square.and.arrow.down.fill" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <IconSymbol name="clock.fill" size={20} color="#007AFF" />
          </TouchableOpacity>
          {records.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={[styles.deleteBtn, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ManualEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={loadRecords}
      />

      <View style={styles.bentoGrid}>
        {/* Main Summary Box */}
        <View style={[styles.bentoBox, styles.summaryBox]}>
          <View style={styles.boxTag}>
            <ThemedText style={styles.tagText}>MONTHLY TOTAL</ThemedText>
          </View>
          <ThemedText style={styles.mainTotalText}>{formatDurationFromMinutes(totalMin)}</ThemedText>
          <ThemedText style={styles.subTotalText}>Aggregate work time</ThemedText>
        </View>

        <View style={styles.gridRow}>
          {/* Days Logged Box */}
          <View style={[styles.bentoBox, styles.statBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <ThemedText style={styles.statLabel}>DAYS LOGGED</ThemedText>
            <ThemedText style={[styles.statValue, { color: textColor }]}>{records.length}</ThemedText>
            <ThemedText style={styles.statSub}>Current period</ThemedText>
          </View>
          {/* Average Box */}
          <View style={[styles.bentoBox, styles.statBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <ThemedText style={styles.statLabel}>AVG. DAILY</ThemedText>
            <ThemedText style={[styles.statValue, { color: textColor }]}>
              {records.length > 0 ? formatDurationFromMinutes(Math.round(totalMin / records.length)) : '0h 0m'}
            </ThemedText>
            <ThemedText style={styles.statSub}>Rendered/day</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <View style={[styles.tableCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              {renderHeader()}
              <FlatList
                data={[...records].sort((a, b) => b.date.localeCompare(a.date))}
                keyExtractor={(item) => item.date}
                renderItem={(props) => {
                  const item = props.item;
                  return (
                    <TouchableOpacity
                      style={[styles.tableRow, { borderBottomColor: borderCol }]}
                      onLongPress={() => handleDeleteRecord(item.date)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.cell, styles.dateCol]}>
                        <ThemedText style={styles.rowDateText}>{getRelativeDate(item.date)}</ThemedText>
                      </View>
                      <View style={[styles.cell, styles.morningCol]}>
                        <View style={styles.timeCluster}>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.morningIn, settings?.use24Hour)}</ThemedText>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.morningOut, settings?.use24Hour)}</ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cell, styles.afternoonCol]}>
                        <View style={styles.timeCluster}>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.afternoonIn, settings?.use24Hour)}</ThemedText>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.afternoonOut, settings?.use24Hour)}</ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cell, styles.overtimeCol]}>
                        <View style={styles.timeCluster}>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.overtimeIn, settings?.use24Hour)}</ThemedText>
                          <ThemedText style={[styles.timeValText, { color: textColor }]}>{formatTime(item.overtimeOut, settings?.use24Hour)}</ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <IconSymbol name="clock.fill" size={32} color="#E5E5EA" />
                    <ThemedText style={styles.emptyText}>No logs found</ThemedText>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  preTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  exportBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF30',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bentoGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  bentoBox: {
    backgroundColor: '#FFF',
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
  summaryBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    padding: 24,
  },
  boxTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  mainTotalText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  subTotalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#C7C7CC',
    marginTop: 2,
  },
  tableWrapper: {
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 20,
  },
  tableCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  table: {
    minWidth: 460,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#8E8E93',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateCol: { width: 70 },
  morningCol: { width: 120 },
  afternoonCol: { width: 120 },
  overtimeCol: { width: 120 },
  totalCol: { width: 90 },

  rowDateText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeValText: {
    color: '#1C1C1E',
    fontSize: 12,
    fontWeight: '600',
  },
  totalValText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#C7C7CC',
    fontSize: 14,
    fontWeight: '600',
  }
});
