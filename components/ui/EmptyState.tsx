import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconName;
  message: string;
  onAdd: () => void;
}

export default function EmptyState({ icon, message, onAdd }: EmptyStateProps) {
  const t = useThemeColors();
  return (
    <View className="items-center py-8 px-4">
      <Ionicons name={icon} size={28} color={t.border} />
      <Text className="text-sm mt-2 mb-4 text-center" style={{ color: t.textMuted }}>{message}</Text>
      <TouchableOpacity
        onPress={onAdd}
        className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl"
        style={{ backgroundColor: GOLD + '20', borderWidth: 1, borderColor: GOLD + '40' }}
      >
        <Ionicons name="add" size={15} color={GOLD} />
        <Text className="text-sm font-semibold" style={{ color: GOLD }}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}
