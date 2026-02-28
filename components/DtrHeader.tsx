import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProfile, saveProfile, UserProfile } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function DtrHeader() {
    const [profile, setProfile] = useState<UserProfile>({ name: '', position: '', dept: '' });
    const cardBg = useThemeColor({ light: '#FFF', dark: '#1C1C1E' }, 'background');
    const borderCol = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({ light: '#C7C7CC', dark: '#8E8E93' }, 'icon');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const data = await getProfile();
        setProfile(data);
    };

    const updateProfileLocal = (field: keyof UserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = () => {
        saveProfile(profile);
    };

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.headerTop}>
                    <View style={styles.titleGroup}>
                        <IconSymbol name="person.crop.circle.fill" size={12} color="#007AFF" />
                        <ThemedText style={styles.badgeText}>USER PROFILE</ThemedText>
                    </View>
                    <ThemedText style={styles.versionText}>V2.2 PREMIUM</ThemedText>
                </View>

                <View style={styles.form}>
                    <View style={styles.mainField}>
                        <ThemedText style={styles.label}>FULL NAME</ThemedText>
                        <TextInput
                            style={[styles.nameInput, { color: textColor }]}
                            value={profile.name}
                            onChangeText={(v) => updateProfileLocal('name', v)}
                            onBlur={handleBlur}
                            placeholder="Enter Name"
                            placeholderTextColor={mutedColor}
                        />
                    </View>

                    <View style={styles.subFields}>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>POSITION</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={profile.position}
                                onChangeText={(v) => updateProfileLocal('position', v)}
                                onBlur={handleBlur}
                                placeholder="Position"
                                placeholderTextColor={mutedColor}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: borderCol }]} />
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>DEPT/OFFICE</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={profile.dept}
                                onChangeText={(v) => updateProfileLocal('dept', v)}
                                onBlur={handleBlur}
                                placeholder="Dept"
                                placeholderTextColor={mutedColor}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 12,
    },
    container: {
        borderRadius: 20,
        padding: 16,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    versionText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#C7C7CC',
    },
    form: {
        gap: 10,
    },
    mainField: {
        gap: 2,
    },
    subFields: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 2,
    },
    field: {
        flex: 1,
        gap: 2,
    },
    label: {
        fontSize: 8,
        fontWeight: '800',
        color: '#C7C7CC',
        letterSpacing: 0.8,
    },
    nameInput: {
        fontSize: 15,
        fontWeight: '700',
        paddingVertical: 0,
    },
    input: {
        fontSize: 13,
        fontWeight: '600',
        paddingVertical: 0,
    },
    divider: {
        width: 1,
        height: 12,
        marginTop: 8,
    },
});
