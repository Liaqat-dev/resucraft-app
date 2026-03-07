import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsCardProps {
  headerIcon?: IoniconName;
  headerIconColor?: string;
  headerIconBg?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SettingsCard({
  headerIcon,
  headerIconColor = '#94a3b8',
  headerIconBg = '#1e293b',
  headerTitle,
  headerSubtitle,
  children,
  className = '',
}: SettingsCardProps) {
  const t = useThemeColors();
  return (
    <View
      className={`rounded-2xl overflow-hidden mb-4 ${className}`}
      style={{
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {headerIcon && headerTitle && (
        <View
          className="flex-row items-center gap-3 px-5 py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: t.borderSub }}
        >
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: headerIconBg }}
          >
            <Ionicons name={headerIcon} size={15} color={headerIconColor} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-[15px]" style={{ color: t.text }}>{headerTitle}</Text>
            {headerSubtitle ? (
              <Text className="text-xs mt-0.5" style={{ color: t.textMuted }}>{headerSubtitle}</Text>
            ) : null}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}
