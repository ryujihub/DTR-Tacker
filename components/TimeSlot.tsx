import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/utils/SettingsContext';
import { formatTime } from '@/utils/time';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface TimeSlotProps {
    label: string;
    icon: string;
    timeIn: string | null | undefined;
    timeOut: string | null | undefined;
    colors: readonly [string, string, ...string[]];
    isActive?: boolean;
}

export function TimeSlot({ label, icon, timeIn, timeOut, colors, isActive }: TimeSlotProps) {
    const { settings } = useSettings();
    const hasIn = !!timeIn;
    const hasOut = !!timeOut;

    const bgColor = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'background');
    const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
    const activeBg = useThemeColor({ light: '#F0F7FF', dark: '#2C2C2E' }, 'background');
    const textColor = useThemeColor({}, 'text');

    return (
        <View style={[
            styles.container,
            { backgroundColor: bgColor, borderColor: borderCol },
            isActive && { ...styles.activeContainer, backgroundColor: activeBg, borderColor: '#007AFF' }
        ]}>
            <LinearGradient
                colors={isActive || hasIn || hasOut ? colors : ['#E5E5EA', '#F2F2F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientIcon, !(isActive || hasIn || hasOut) && styles.inactiveIcon]}
            >
                <IconSymbol name={icon as any} size={16} color={isActive || hasIn || hasOut ? "#FFF" : "#8E8E93"} />
            </LinearGradient>

            <View style={styles.content}>
                <ThemedText style={[styles.label, isActive && styles.activeLabel]}>{label}</ThemedText>
                <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                        <ThemedText style={styles.type}>IN</ThemedText>
                        <ThemedText style={[styles.time, { color: textColor }, !hasIn && styles.emptyTime]}>
                            {hasIn ? formatTime(timeIn, settings.use24Hour) : '--:--'}
                        </ThemedText>
                    </View>
                    <View style={[styles.separator, { backgroundColor: borderCol }]} />
                    <View style={styles.timeBlock}>
                        <ThemedText style={styles.type}>OUT</ThemedText>
                        <ThemedText style={[styles.time, { color: textColor }, !hasOut && styles.emptyTime]}>
                            {hasOut ? formatTime(timeOut, settings.use24Hour) : '--:--'}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {isActive && <View style={styles.activeIndicator} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        gap: 16,
        flex: 1,
    },
    activeContainer: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    gradientIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inactiveIcon: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 4,
    },
    activeLabel: {
        color: '#007AFF',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeBlock: {
        gap: 2,
    },
    type: {
        fontSize: 8,
        fontWeight: '700',
        color: '#C7C7CC',
    },
    time: {
        fontSize: 15,
        fontWeight: '700',
    },
    emptyTime: {
        color: '#C7C7CC',
        fontWeight: '500',
    },
    separator: {
        width: 1,
        height: 20,
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
    }
});
