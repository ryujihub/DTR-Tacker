import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DailyRecord } from '@/utils/storage';
import { calculateDailyTotalMinutes, formatDate, formatDurationFromMinutes, formatTime } from '@/utils/time';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LogCardProps {
    item: DailyRecord;
}

export function LogCard({ item }: LogCardProps) {
    const totalMin = calculateDailyTotalMinutes(item);

    return (
        <ThemedView style={styles.recordCard}>
            <View style={styles.cardHeader}>
                <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
                <ThemedView style={styles.durationBadge}>
                    <ThemedText style={styles.durationText}>{formatDurationFromMinutes(totalMin)}</ThemedText>
                </ThemedView>
            </View>

            <View style={styles.grid}>
                <View style={styles.column}>
                    <ThemedText style={styles.slotLabel}>MORNING</ThemedText>
                    <ThemedText style={styles.timeText}>{formatTime(item.morningIn)} - {formatTime(item.morningOut)}</ThemedText>
                </View>
                <View style={styles.column}>
                    <ThemedText style={styles.slotLabel}>AFTERNOON</ThemedText>
                    <ThemedText style={styles.timeText}>{formatTime(item.afternoonIn)} - {formatTime(item.afternoonOut)}</ThemedText>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    recordCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 10,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
    },
    durationBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4ADE80',
    },
    grid: {
        flexDirection: 'row',
        gap: 10,
    },
    column: {
        flex: 1,
    },
    slotLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        opacity: 0.4,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
    }
});
