import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '@/components/ui/SettingsCard';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

export type ThemeOption = 'system' | 'light' | 'dark';

const OPTIONS: Array<{
  value: ThemeOption;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
}> = [
  { value: 'system', label: 'System',  icon: 'phone-portrait-outline', description: 'Follow device setting' },
  { value: 'light',  label: 'Light',   icon: 'sunny-outline',           description: 'Always light mode'    },
  { value: 'dark',   label: 'Dark',    icon: 'moon-outline',            description: 'Always dark mode'     },
];

interface ThemeCardProps {
  selected: ThemeOption;
  onChange: (value: ThemeOption) => void;
}

export default function ThemeCard({ selected, onChange }: ThemeCardProps) {
  const t = useThemeColors();
  return (
    <SettingsCard
      headerIcon="contrast-outline"
      headerIconColor={GOLD}
      headerIconBg={GOLD + '20'}
      headerTitle="Theme"
      headerSubtitle="Choose how ResuCraft looks"
    >
      {OPTIONS.map((opt, i) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            className="flex-row items-center px-5 py-4 gap-4"
            style={i < OPTIONS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: t.borderSub } : undefined}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: active ? GOLD + '20' : t.borderSub }}
            >
              <Ionicons name={opt.icon} size={18} color={active ? GOLD : t.textFaint} />
            </View>

            <View className="flex-1">
              <Text className="font-semibold text-[15px]" style={{ color: active ? t.text : t.textSub }}>
                {opt.label}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: active ? t.textMuted : t.border }}>
                {opt.description}
              </Text>
            </View>

            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: active ? GOLD : t.border,
                backgroundColor: active ? GOLD : 'transparent',
              }}
            >
              {active && <Ionicons name="checkmark" size={11} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </SettingsCard>
  );
}
