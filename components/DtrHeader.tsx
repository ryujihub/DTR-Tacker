import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getProfile, saveProfile, UserProfile } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function DtrHeader() {
    const [profile, setProfile] = useState<UserProfile>({ name: '', position: '', dept: '' });

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
            <View style={styles.container}>
                <View style={styles.headerTop}>
                    <View style={styles.profileBadge}>
                        <IconSymbol name="list.bullet" size={14} color="#007AFF" />
                        <ThemedText style={styles.badgeText}>DTR SYSTEM</ThemedText>
                    </View>
                    <ThemedText style={styles.versionText}>V2.1</ThemedText>
                </View>

                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.label}>FULL NAME</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={profile.name}
                            onChangeText={(v) => updateProfileLocal('name', v)}
                            onBlur={handleBlur}
                            placeholder="Enter your name"
                            placeholderTextColor="#C7C7CC"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1.2 }]}>
                            <ThemedText style={styles.label}>POSITION</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={profile.position}
                                onChangeText={(v) => updateProfileLocal('position', v)}
                                onBlur={handleBlur}
                                placeholder="Enter your position"
                                placeholderTextColor="#C7C7CC"
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.label}>DEPT / OFFICE</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={profile.dept}
                                onChangeText={(v) => updateProfileLocal('dept', v)}
                                onBlur={handleBlur}
                                placeholder="Enter your dept"
                                placeholderTextColor="#C7C7CC"
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
        marginTop: 10,
        marginBottom: 20,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: 0.5,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
    },
    content: {
        gap: 20,
    },
    inputGroup: {
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E5EA',
        marginTop: 18,
    },
    label: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1.2,
    },
    input: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        paddingVertical: 2,
    },
});
