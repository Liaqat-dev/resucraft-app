import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardActions({ onEdit, onDelete }: CardActionsProps) {
  const t = useThemeColors();
  return (
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.75}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: t.editBg }}
      >
        <Ionicons name="pencil" size={13} color="#60a5fa" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.75}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: t.deleteBg }}
      >
        <Ionicons name="trash" size={13} color="#f87171" />
      </TouchableOpacity>
    </View>
  );
}
