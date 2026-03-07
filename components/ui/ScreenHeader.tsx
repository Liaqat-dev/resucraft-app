import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface ScreenHeaderProps {
  title: string;
  rightIcon?: IoniconName;
  rightIconColor?: string;
  rightIconBg?: string;
  onBack?: () => void;
}

export default function ScreenHeader({
  title,
  rightIcon,
  rightIconColor = '#94a3b8',
  rightIconBg = '#1e293b',
  onBack,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useThemeColors();

  return (
    <View
      className="flex-row items-center px-5"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: t.borderSub,
        backgroundColor: t.bg,
      }}
    >
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        activeOpacity={0.7}
        style={{ borderWidth: 1, borderColor: t.border }}
      >
        <Ionicons name="chevron-back" size={20} color={t.textSub} />
      </TouchableOpacity>

      <Text className="font-bold text-base flex-1" style={{ color: t.text }}>{title}</Text>

      {rightIcon ? (
        <View
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: rightIconBg, borderWidth: 1, borderColor: rightIconColor + '40' }}
        >
          <Ionicons name={rightIcon} size={16} color={rightIconColor} />
        </View>
      ) : (
        <View className="w-8" />
      )}
    </View>
  );
}
