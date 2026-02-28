import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { getSettings, saveSettings, SystemSettings } from './storage';

interface SettingsContextType {
    settings: SystemSettings;
    updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
    colorScheme: 'light' | 'dark';
    isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useSystemColorScheme() ?? 'light';
    const [settings, setSettings] = useState<SystemSettings>({ use24Hour: true, theme: 'system', hasSeenOnboarding: false });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getSettings();
        setSettings(data);
        setIsLoaded(true);
    };

    const updateSettings = async (newSettings: Partial<SystemSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await saveSettings(updated);
    };

    const colorScheme = settings.theme === 'system' ? systemColorScheme : settings.theme as 'light' | 'dark';

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, colorScheme, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
