import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GOLD, ThemeColors } from '@/hooks/useThemeColors';
import { ProfileCompletion } from '@/services/authService';

interface Props {
  data: ProfileCompletion;
  t: ThemeColors;
}

export default function ProfileCompletionBar({ data, t }: Props) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: data.percentage,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [data.percentage]);

  const barColor = data.percentage >= 60 ? GOLD : '#e09020';

  const incomplete = data.sections.filter((s) => !s.isComplete);
  const required = incomplete.filter((s) => !s.isOptional);
  const optional = incomplete.filter((s) => s.isOptional);
  const displayed = [...required, ...optional].slice(0, 5);

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="stats-chart" size={15} color={GOLD} />
          <Text className="font-semibold text-sm" style={{ color: t.text }}>
            Profile Completion
          </Text>
        </View>
        <Text className="font-bold text-base" style={{ color: data.percentage >= 60 ? GOLD : t.textSub }}>
          {data.percentage}%
        </Text>
      </View>

      {/* Animated bar */}
      <View
        className="h-2.5 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: t.borderSub }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={{
            width: animWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: barColor,
          }}
        />
      </View>

      {/* Completion count */}
      <Text className="text-xs mb-1" style={{ color: t.textMuted }}>
        {data.completedCount} of {data.totalCount} sections complete
        {data.isReady ? ' · Ready to build your resume!' : ''}
      </Text>

      {/* Incomplete sections */}
      {displayed.length > 0 && (
        <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: t.borderSub }}>
          <Text className="text-xs font-semibold mb-2" style={{ color: t.textSub }}>
            {required.length > 0 ? 'Still needed:' : 'Optional additions:'}
          </Text>
          {displayed.map((s) => (
            <View key={s.id} className="flex-row items-start mb-2">
              <Ionicons
                name={s.isOptional ? 'ellipse-outline' : 'alert-circle-outline'}
                size={13}
                color={s.isOptional ? t.textFaint : GOLD}
                style={{ marginTop: 1, marginRight: 7 }}
              />
              <Text className="flex-1 text-xs leading-4" style={{ color: s.isOptional ? t.textFaint : t.textSub }}>
                <Text className="font-medium">{s.label}</Text>
                {'  '}
                {s.hint}
              </Text>
            </View>
          ))}
        </View>
      )}

      {data.percentage === 100 && (
        <View className="flex-row items-center mt-1">
          <Ionicons name="checkmark-circle" size={15} color={GOLD} />
          <Text className="text-xs font-semibold ml-1.5" style={{ color: GOLD }}>
            Profile complete — you're all set!
          </Text>
        </View>
      )}
    </View>
  );
}