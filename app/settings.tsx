import React, { useEffect, useState } from 'react';
import { Appearance, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

import ScreenHeader from '@/components/ui/ScreenHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import ThemeCard, { ThemeOption } from '@/components/settings/ThemeCard';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const THEME_KEY = 'resucraft_theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeColors();
  const [theme, setTheme] = useState<ThemeOption>('system');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setTheme(saved);
        Appearance.setColorScheme(saved === 'system' ? null : saved);
      }
    });
  }, []);

  const handleThemeChange = async (value: ThemeOption) => {
    setTheme(value);
    Appearance.setColorScheme(value === 'system' ? null : value);
    await SecureStore.setItemAsync(THEME_KEY, value);
    await Haptics.selectionAsync();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: t.bg }}>
      <ScreenHeader
        title="Settings"
        rightIcon="settings-outline"
        rightIconColor={GOLD}
        rightIconBg={GOLD + '15'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          paddingTop: 16,
        }}
      >
        <SectionLabel title="Appearance" className="mt-0" />
        <ThemeCard selected={theme} onChange={handleThemeChange} />
      </ScrollView>
    </View>
  );
}
