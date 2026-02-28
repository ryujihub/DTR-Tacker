import { useSettings } from '@/utils/SettingsContext';

export function useColorScheme() {
    return useSettings().colorScheme;
}
