import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/utils/SettingsContext';
import { SystemSettings } from '@/utils/storage';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const { settings, updateSettings } = useSettings();
    const cardBg = useThemeColor({}, 'background');
    const cardBorder = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
    const rowHover = useThemeColor({ light: '#F0F7FF', dark: '#1C1C1E' }, 'background');

    const toggle24Hour = async () => {
        await updateSettings({ use24Hour: !settings.use24Hour });
    };

    const setTheme = async (theme: SystemSettings['theme']) => {
        await updateSettings({ theme });
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
                <ThemedText style={styles.title}>Settings</ThemedText>
                <ThemedText style={styles.subtitle}>Customize your experience</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>TIME & DISPLAY</ThemedText>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <View style={styles.row}>
                            <View style={styles.rowLabelGroup}>
                                <IconSymbol name="clock.fill" size={20} color="#007AFF" />
                                <View>
                                    <ThemedText style={styles.rowTitle}>24-Hour Clock</ThemedText>
                                    <ThemedText style={styles.rowDesc}>{settings.use24Hour ? 'Using 24h format' : 'Using 12h format'}</ThemedText>
                                </View>
                            </View>
                            <Switch
                                value={settings.use24Hour}
                                onValueChange={toggle24Hour}
                                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.use24Hour ? '#FFFFFF' : '#F2F2F7')}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>APPEARANCE</ThemedText>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <TouchableOpacity
                            style={[styles.themeOption, settings.theme === 'light' && { backgroundColor: rowHover }]}
                            onPress={() => setTheme('light')}
                        >
                            <IconSymbol name="sun.max.fill" size={20} color={settings.theme === 'light' ? '#007AFF' : '#8E8E93'} />
                            <ThemedText style={[styles.themeLabel, settings.theme === 'light' && styles.activeThemeLabel]}>Light</ThemedText>
                            {settings.theme === 'light' && <IconSymbol name="checkmark.circle.fill" size={18} color="#007AFF" />}
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                        <TouchableOpacity
                            style={[styles.themeOption, settings.theme === 'dark' && { backgroundColor: rowHover }]}
                            onPress={() => setTheme('dark')}
                        >
                            <IconSymbol name="moon.fill" size={20} color={settings.theme === 'dark' ? '#007AFF' : '#8E8E93'} />
                            <ThemedText style={[styles.themeLabel, settings.theme === 'dark' && styles.activeThemeLabel]}>Dark</ThemedText>
                            {settings.theme === 'dark' && <IconSymbol name="checkmark.circle.fill" size={18} color="#007AFF" />}
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                        <TouchableOpacity
                            style={[styles.themeOption, settings.theme === 'system' && { backgroundColor: rowHover }]}
                            onPress={() => setTheme('system')}
                        >
                            <IconSymbol name="iphone" size={20} color={settings.theme === 'system' ? '#007AFF' : '#8E8E93'} />
                            <ThemedText style={[styles.themeLabel, settings.theme === 'system' && styles.activeThemeLabel]}>System</ThemedText>
                            {settings.theme === 'system' && <IconSymbol name="checkmark.circle.fill" size={18} color="#007AFF" />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>HELP & SUPPORT</ThemedText>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={async () => {
                                await updateSettings({ hasSeenOnboarding: false });
                                router.replace('/onboarding');
                            }}
                        >
                            <View style={styles.rowLabelGroup}>
                                <IconSymbol name="questionmark.circle.fill" size={20} color="#007AFF" />
                                <View>
                                    <ThemedText style={styles.rowTitle}>Show Tutorial</ThemedText>
                                    <ThemedText style={styles.rowDesc}>Replay the app guide</ThemedText>
                                </View>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color="#C7C7CC" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <ThemedText style={styles.footerText}>DTR Tracker v2.2 Premium</ThemedText>
                    <ThemedText style={styles.footerText}>{"© 2026 Andrey\u2019s Dev Studio"}</ThemedText>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginTop: 4,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    rowLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    rowDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    activeOption: {
        backgroundColor: '#F0F7FF',
    },
    themeLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    activeThemeLabel: {
        color: '#007AFF',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 48,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 11,
        color: '#AEAeb2',
    }
});
