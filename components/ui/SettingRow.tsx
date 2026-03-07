import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingRowProps {
  icon: IoniconName;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  valueText?: string;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}

export default function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  valueText,
  rightElement,
  showChevron = true,
  onPress,
  isLast = false,
}: SettingRowProps) {
  const t = useThemeColors();

  const Inner = (
    <View
      className="flex-row items-center px-5 py-4 gap-4"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: t.borderSub } : undefined}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-[15px]" style={{ color: t.text }}>{label}</Text>
        {subtitle ? (
          <Text className="text-xs mt-0.5" style={{ color: t.textMuted }}>{subtitle}</Text>
        ) : null}
      </View>

      {rightElement ?? (
        <>
          {valueText ? (
            <Text className="text-sm mr-1" style={{ color: t.textMuted }}>{valueText}</Text>
          ) : null}
          {showChevron && onPress ? (
            <Ionicons name="chevron-forward" size={16} color={t.border} />
          ) : null}
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Inner}
      </TouchableOpacity>
    );
  }

  return Inner;
}
