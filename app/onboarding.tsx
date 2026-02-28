import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSettings } from '@/utils/SettingsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: string;
    colors: [string, string, ...string[]];
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Welcome to DTR Tracker',
        description: 'Your premium companion for managing work attendance and attendance logs with ease.',
        icon: 'house.fill',
        colors: ['#007AFF', '#0055D4'],
    },
    {
        id: '2',
        title: 'Clock In & Out',
        description: 'Simply tap the main action button to log your time. We handle the rest.',
        icon: 'clock.fill',
        colors: ['#34C759', '#248A3D'],
    },
    {
        id: '3',
        title: 'Track Your History',
        description: 'View detailed logs of your work sessions and export them as professional PDF reports.',
        icon: 'list.bullet',
        colors: ['#5856D6', '#4341B5'],
    },
    {
        id: '4',
        title: 'Personalized for You',
        description: 'Choose your preferred clock format and theme in the settings. Premium design, tailored for you.',
        icon: 'paperplane.fill',
        colors: ['#FF9500', '#D67D00'],
    }
];

export default function OnboardingScreen() {
    const { updateSettings } = useSettings();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const bgColor = useThemeColor({ light: '#FFF', dark: '#000' }, 'background');
    

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const handleComplete = async () => {
        await updateSettings({ hasSeenOnboarding: true });
        router.replace('/(tabs)');
    };

    const nextSlide = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const skip = () => {
        handleComplete();
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <LinearGradient
                colors={item.colors}
                style={styles.iconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <IconSymbol name={item.icon as any} size={80} color="#FFF" />
            </LinearGradient>
            <View style={styles.textContainer}>
                <ThemedText type="title" style={styles.title}>{item.title}</ThemedText>
                <ThemedText style={styles.description}>{item.description}</ThemedText>
            </View>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={skip}>
                    <ThemedText style={styles.skipText}>Skip</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                { backgroundColor: currentIndex === index ? '#007AFF' : '#E5E5EA' },
                                currentIndex === index && styles.activeIndicator
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={nextSlide}>
                    <LinearGradient
                        colors={['#007AFF', '#0055D4']}
                        style={styles.gradientBtn}
                    >
                        <ThemedText style={styles.btnText}>
                            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'flex-end',
    },
    skipText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 180,
        height: 180,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 60,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingBottom: 60,
        paddingHorizontal: 40,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeIndicator: {
        width: 24,
    },
    nextBtn: {
        width: '100%',
        height: 56,
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    }
});
