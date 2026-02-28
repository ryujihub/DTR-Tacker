import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DailyRecord, saveDailyRecord } from '@/utils/storage';
import { calculateDailyTotalMinutes, formatTime } from '@/utils/time';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ManualEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ManualEntryModal({ visible, onClose, onSave }: ManualEntryModalProps) {
    const [date, setDate] = useState(new Date());
    const [morningIn, setMorningIn] = useState<Date | null>(null);
    const [morningOut, setMorningOut] = useState<Date | null>(null);
    const [afternoonIn, setAfternoonIn] = useState<Date | null>(null);
    const [afternoonOut, setAfternoonOut] = useState<Date | null>(null);

    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [activeSlot, setActiveSlot] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    const handlePickerChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (!selectedDate) return;

        if (pickerMode === 'date') {
            setDate(selectedDate);
        } else {
            switch (activeSlot) {
                case 'morningIn': setMorningIn(selectedDate); break;
                case 'morningOut': setMorningOut(selectedDate); break;
                case 'afternoonIn': setAfternoonIn(selectedDate); break;
                case 'afternoonOut': setAfternoonOut(selectedDate); break;
            }
        }
    };

    const openPicker = (mode: 'date' | 'time', slot?: string) => {
        setPickerMode(mode);
        setActiveSlot(slot || null);
        setShowPicker(true);
    };

    const handleSave = async () => {
        const dailyRecord: DailyRecord = {
            date: format(date, 'yyyy-MM-dd'),
            morningIn: morningIn?.toISOString() || null,
            morningOut: morningOut?.toISOString() || null,
            afternoonIn: afternoonIn?.toISOString() || null,
            afternoonOut: afternoonOut?.toISOString() || null,
            overtimeIn: null,
            overtimeOut: null,
            totalHours: 0,
        };

        dailyRecord.totalHours = calculateDailyTotalMinutes(dailyRecord) / 60;
        await saveDailyRecord(dailyRecord);
        onSave();
        onClose();
    };

    const renderSlot = (label: string, value: Date | null, slotName: string) => (
        <View style={styles.slotRow}>
            <ThemedText style={styles.slotLabel}>{label}</ThemedText>
            <TouchableOpacity style={styles.timeButton} onPress={() => openPicker('time', slotName)}>
                <ThemedText style={styles.timeText}>{value ? formatTime(value) : '--:-- --'}</ThemedText>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <ThemedView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View>
                            <ThemedText style={styles.preTitle}>ENTRY FORM</ThemedText>
                            <ThemedText type="subtitle" style={styles.mainTitle}>Add Record</ThemedText>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <IconSymbol name="plus.app.fill" size={24} color="#8E8E93" style={{ transform: [{ rotate: '45deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>DATE</ThemedText>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => openPicker('date')}>
                                <View style={styles.dateInfo}>
                                    <IconSymbol name="calendar" size={18} color="#007AFF" />
                                    <ThemedText style={styles.dateText}>{format(date, 'MMMM dd, yyyy')}</ThemedText>
                                </View>
                                <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>MORNING</ThemedText>
                            <View style={styles.formGroup}>
                                {renderSlot('Clock In', morningIn, 'morningIn')}
                                <View style={styles.divider} />
                                {renderSlot('Clock Out', morningOut, 'morningOut')}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>AFTERNOON</ThemedText>
                            <View style={styles.formGroup}>
                                {renderSlot('Clock In', afternoonIn, 'afternoonIn')}
                                <View style={styles.divider} />
                                {renderSlot('Clock Out', afternoonOut, 'afternoonOut')}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <ThemedText style={styles.saveButtonText}>Save Log</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {Platform.OS === 'web' && showPicker ? (
                        <View style={styles.webPickerContainer}>
                            <input
                                type={pickerMode}
                                value={pickerMode === 'date' ? format(date, 'yyyy-MM-dd') : format(activeSlot?.includes('In') ? (morningIn || afternoonIn || new Date()) : (morningOut || afternoonOut || new Date()), 'HH:mm')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (pickerMode === 'date') {
                                        handlePickerChange({}, new Date(val));
                                    } else {
                                        const [h, m] = val.split(':');
                                        const d = new Date(date);
                                        d.setHours(parseInt(h), parseInt(m));
                                        handlePickerChange({}, d);
                                    }
                                }}
                                style={{
                                    fontSize: '16px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #007AFF',
                                    backgroundColor: '#FFFFFF',
                                    color: '#1C1C1E',
                                    width: '100%',
                                    outline: 'none'
                                }}
                                autoFocus
                                onBlur={() => setShowPicker(false)}
                            />
                        </View>
                    ) : (
                        showPicker && (
                            <DateTimePicker
                                value={pickerMode === 'time' && activeSlot ? (morningIn || afternoonIn || date) : date}
                                mode={pickerMode}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                is24Hour={false}
                                onChange={handlePickerChange}
                            />
                        )
                    )}
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '80%',
        backgroundColor: '#F2F2F7',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    preTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 2,
        marginBottom: 4,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        gap: 24,
        paddingBottom: 20,
    },
    section: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    formGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        overflow: 'hidden',
    },
    slotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginHorizontal: 18,
    },
    slotLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    timeButton: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#007AFF',
    },
    footer: {
        marginTop: 20,
        paddingBottom: 10,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
    webPickerContainer: {
        marginTop: 15,
        padding: 10,
    },
});
