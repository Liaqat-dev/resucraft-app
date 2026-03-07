import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface AccordionSectionProps {
  icon: IoniconName;
  iconColor: string;
  iconBg: string;
  title: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export default function AccordionSection({
  icon, iconColor, iconBg, title, count, isOpen, onToggle, onAdd, loading, children,
}: AccordionSectionProps) {
  const t = useThemeColors();
  return (
    <View
      className="rounded-2xl overflow-hidden mb-4"
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
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="flex-row items-center px-4 py-4">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text className="font-semibold text-[15px] flex-1" style={{ color: t.text }}>
          {title}
          {count !== undefined && count > 0 && (
            <Text className="font-normal text-xs" style={{ color: t.textMuted }}> ({count})</Text>
          )}
        </Text>
        {loading && <ActivityIndicator size="small" color={GOLD} style={{ marginRight: 8 }} />}
        {onAdd && isOpen && !loading && (
          <TouchableOpacity
            onPress={onAdd}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg mr-2"
            style={{ backgroundColor: GOLD + '20', borderWidth: 1, borderColor: GOLD + '40' }}
          >
            <Ionicons name="add" size={14} color={GOLD} />
            <Text className="text-xs font-semibold" style={{ color: GOLD }}>Add</Text>
          </TouchableOpacity>
        )}
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={t.textFaint} />
      </TouchableOpacity>

      {isOpen && (
        <View style={{ borderTopWidth: 1, borderTopColor: t.borderSub }}>
          {children}
        </View>
      )}
    </View>
  );
}
