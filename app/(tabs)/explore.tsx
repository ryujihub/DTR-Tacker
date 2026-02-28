import { ManualEntryModal } from '@/components/ManualEntryModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { generatePDFReport } from '@/utils/report';
import { DailyRecord, clearAllData, deleteDailyRecord, getDailyRecords, getProfile } from '@/utils/storage';
import { calculateDailyTotalMinutes, formatDurationFromMinutes, formatTime } from '@/utils/time';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

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
    <View style={styles.tableHeader}>
      <View style={[styles.cell, styles.dateCol]}><ThemedText style={styles.headerText}>DATE</ThemedText></View>
      <View style={[styles.cell, styles.morningCol]}><ThemedText style={styles.headerText}>AM ARRIVAL/DEPT</ThemedText></View>
      <View style={[styles.cell, styles.afternoonCol]}><ThemedText style={styles.headerText}>PM ARRIVAL/DEPT</ThemedText></View>
      <View style={[styles.cell, styles.totalCol]}><ThemedText style={styles.headerText}>TOTAL</ThemedText></View>
    </View>
  );

  const renderItem = ({ item }: { item: DailyRecord }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onLongPress={() => handleDeleteRecord(item.date)}
      activeOpacity={0.6}
    >
      <View style={[styles.cell, styles.dateCol]}>
        <ThemedText style={styles.rowDateText}>{item.date.split('-').slice(1).join('/')}</ThemedText>
      </View>
      <View style={[styles.cell, styles.morningCol]}>
        <View style={styles.timeCluster}>
          <ThemedText style={styles.timeValText}>{formatTime(item.morningIn)}</ThemedText>
          <IconSymbol name="chevron.right" size={8} color="#C7C7CC" />
          <ThemedText style={styles.timeValText}>{formatTime(item.morningOut)}</ThemedText>
        </View>
      </View>
      <View style={[styles.cell, styles.afternoonCol]}>
        <View style={styles.timeCluster}>
          <ThemedText style={styles.timeValText}>{formatTime(item.afternoonIn)}</ThemedText>
          <IconSymbol name="chevron.right" size={8} color="#C7C7CC" />
          <ThemedText style={styles.timeValText}>{formatTime(item.afternoonOut)}</ThemedText>
        </View>
      </View>
      <View style={[styles.cell, styles.totalCol]}>
        <ThemedText style={styles.totalValText}>
          {formatDurationFromMinutes(calculateDailyTotalMinutes(item))}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.preTitle}>ATTENDANCE LOGS</ThemedText>
          <ThemedText type="title" style={styles.title}>History</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={async () => {
              const profile = await getProfile();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              generatePDFReport(records, profile);
            }}
            style={styles.exportBtn}
          >
            <IconSymbol name="plus.app.fill" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <IconSymbol name="clock.fill" size={20} color="#007AFF" />
          </TouchableOpacity>
          {records.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.deleteBtn}>
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
          <View style={[styles.bentoBox, styles.statBox]}>
            <ThemedText style={styles.statLabel}>DAYS LOGGED</ThemedText>
            <ThemedText style={styles.statValue}>{records.length}</ThemedText>
            <ThemedText style={styles.statSub}>Current period</ThemedText>
          </View>
          {/* Average Box */}
          <View style={[styles.bentoBox, styles.statBox]}>
            <ThemedText style={styles.statLabel}>AVG. DAILY</ThemedText>
            <ThemedText style={styles.statValue}>
              {records.length > 0 ? formatDurationFromMinutes(Math.round(totalMin / records.length)) : '0h 0m'}
            </ThemedText>
            <ThemedText style={styles.statSub}>Rendered/day</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              {renderHeader()}
              <FlatList
                data={[...records].sort((a, b) => b.date.localeCompare(a.date))}
                keyExtractor={(item) => item.date}
                renderItem={renderItem}
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
    fontSize: 36,
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
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  table: {
    minWidth: 460,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
  morningCol: { width: 140 },
  afternoonCol: { width: 140 },
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
