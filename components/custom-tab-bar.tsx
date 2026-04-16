import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── constants ────────────────────────────────────────────────────────────────
const H_MARGIN = 20;
const BAR_HEIGHT = 45;
const INACTIVE_W = 52;
const GOLD = '#C09A3A';
const TEAL = '#0a7ea4';

const WIDTH_SPRING = { damping: 22, stiffness: 220, mass: 0.9 };

type TabDef = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: TabDef[] = [
  { label: 'Home',      icon: 'home-outline',          activeIcon: 'home'          },
  { label: 'Templates', icon: 'layers-outline',         activeIcon: 'layers'         },
  { label: 'Resumes',   icon: 'document-text-outline',  activeIcon: 'document-text'  },
  { label: 'Profile',   icon: 'id-card-outline',        activeIcon: 'id-card'        },
  { label: 'Account',   icon: 'person-outline',         activeIcon: 'person'         },
];

// ─── single tab item ──────────────────────────────────────────────────────────
type TabItemProps = {
  tab: TabDef;
  isFocused: boolean;
  activeWidth: number;
  accent: string;
  pillBg: string;
  pillBorder: string;
  muted: string;
  onPress: () => void;
};

function TabItem({
  tab,
  isFocused,
  activeWidth,
  accent,
  pillBg,
  pillBorder,
  muted,
  onPress,
}: TabItemProps) {
  const width = useSharedValue(isFocused ? activeWidth : INACTIVE_W);

  useEffect(() => {
    width.value = withSpring(
      isFocused ? activeWidth : INACTIVE_W,
      WIDTH_SPRING,
    );
  }, [isFocused, activeWidth]);

  const outerStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View style={[styles.tabOuter, outerStyle]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'transparent' }}
        style={[
          styles.pill,
          {
            backgroundColor: isFocused ? pillBg : 'transparent',
            borderColor: isFocused ? pillBorder : 'transparent',
          },
        ]}
      >
        <Ionicons
          name={isFocused ? tab.activeIcon : tab.icon}
          size={22}
          color={isFocused ? accent : muted}
        />

        {/* label is only mounted when focused — never affects inactive layout */}
        {isFocused && (
          <Text style={[styles.label, { color: accent }]} numberOfLines={1}>
            {tab.label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── bar ──────────────────────────────────────────────────────────────────────
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const barWidth = screenWidth - H_MARGIN * 2;
  const activeWidth = barWidth - (TABS.length - 1) * INACTIVE_W - 8;

  const accent      = isDark ? GOLD  : TEAL;
  const pillBg      = isDark ? 'rgba(192,154,58,0.15)' : 'rgba(10,126,164,0.11)';
  const pillBorder  = isDark ? 'rgba(192,154,58,0.35)' : 'rgba(10,126,164,0.28)';
  const muted       = isDark ? '#374151' : '#94A3B8';
  const bg          = isDark ? 'rgba(10,15,30,0.78)' : 'rgba(255,255,255,0.78)';
  const barBorder   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)';

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            backgroundColor: bg,
            borderColor: barBorder,
            shadowColor: isDark ? '#000' : TEAL,
          },
        ]}
      >
        {TABS.map((tab, idx) => {
          const route = state.routes[idx];
          if (!route) return null;

          const isFocused = state.index === idx;

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={idx}
              tab={tab}
              isFocused={isFocused}
              activeWidth={activeWidth}
              accent={accent}
              pillBg={pillBg}
              pillBorder={pillBorder}
              muted={muted}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderWidth: 1,
    paddingHorizontal: 0,
    marginBottom: 3,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  tabOuter: {
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: BAR_HEIGHT - 16,
    borderRadius: (BAR_HEIGHT - 16) / 2,
    borderWidth: 1,
    paddingHorizontal: 7,
    minWidth: INACTIVE_W - 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
});