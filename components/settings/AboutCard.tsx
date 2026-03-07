import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '@/components/ui/SettingsCard';
import SettingRow from '@/components/ui/SettingRow';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const APP_VERSION = '1.0.0';
const APP_BUILD = '100';

interface AboutCardProps {
  onPrivacyPress: () => void;
  onTermsPress: () => void;
}

export default function AboutCard({ onPrivacyPress, onTermsPress }: AboutCardProps) {
  const t = useThemeColors();
  return (
    <>
      {/* App identity block */}
      {/*<SettingsCard className="mb-4">*/}
      {/*  <View className="items-center py-6 px-5">*/}
      {/*    /!* App icon placeholder *!/*/}
      {/*    <View*/}
      {/*      className="w-20 h-20 rounded-3xl items-center justify-center mb-4"*/}
      {/*      style={{*/}
      {/*        backgroundColor: GOLD + '15',*/}
      {/*        borderWidth: 1.5,*/}
      {/*        borderColor: GOLD + '35',*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      <Ionicons name="document-text" size={38} color={GOLD} />*/}
      {/*    </View>*/}
      {/*    <Text className="font-bold text-xl tracking-tight" style={{ color: t.text }}>ResuCraft</Text>*/}
      {/*    <Text className="text-sm mt-1" style={{ color: t.textMuted }}>Build resumes that get noticed.</Text>*/}

      {/*    /!* Version badge *!/*/}
      {/*    <View*/}
      {/*      className="flex-row items-center gap-2 mt-4 px-4 py-2 rounded-xl"*/}
      {/*      style={{ backgroundColor: t.borderSub, borderWidth: 1, borderColor: t.border }}*/}
      {/*    >*/}
      {/*      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />*/}
      {/*      <Text className="text-xs font-mono" style={{ color: t.textSub }}>*/}
      {/*        v{APP_VERSION} · Build {APP_BUILD}*/}
      {/*      </Text>*/}
      {/*    </View>*/}
      {/*  </View>*/}
      {/*</SettingsCard>*/}

      {/* Links */}
      <SettingsCard
        headerIcon="information-circle-outline"
        headerIconColor="#60a5fa"
        headerIconBg="#60a5fa15"
        headerTitle="About"
        headerSubtitle="Links and app information"
      >
        <SettingRow
          icon="star-outline"
          iconColor={GOLD}
          iconBg={GOLD + '18'}
          label="Rate ResuCraft"
          subtitle="Enjoying the app? Leave a review"
          onPress={() => Linking.openURL('https://play.google.com/store')}
        />
        <SettingRow
          icon="chatbubble-ellipses-outline"
          iconColor="#34d399"
          iconBg="#34d39918"
          label="Contact Support"
          subtitle="Get help or send feedback"
          onPress={() => Linking.openURL('mailto:support@resucraft.app')}
        />
        <SettingRow
          icon="logo-github"
          iconColor="#a78bfa"
          iconBg="#a78bfa18"
          label="View on GitHub"
          subtitle="Browse the source code"
          onPress={() => Linking.openURL('https://github.com')}
          isLast
        />
      </SettingsCard>

      {/* Legal */}
      <SettingsCard
        headerIcon="shield-checkmark-outline"
        headerIconColor="#fbbf24"
        headerIconBg="#fbbf2418"
        headerTitle="Legal"
        headerSubtitle="Policies and agreements"
      >
        <SettingRow
          icon="lock-closed-outline"
          iconColor="#60a5fa"
          iconBg="#60a5fa18"
          label="Privacy Policy"
          subtitle="How we handle your data"
          onPress={onPrivacyPress}
        />
        <SettingRow
          icon="document-text-outline"
          iconColor="#34d399"
          iconBg="#34d39918"
          label="Terms of Service"
          subtitle="Rules and conditions of use"
          onPress={onTermsPress}
          isLast
        />
      </SettingsCard>

      {/* Made with love */}
      <View className="items-center pt-2 pb-4">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs" style={{ color: t.textFaint }}>Made with</Text>
          <Ionicons name="heart" size={11} color="#f87171" />
          <Text className="text-xs" style={{ color: t.textFaint }}>by the ResuCraft team</Text>
        </View>
        <Text className="text-[10px] mt-1" style={{ color: t.border }}>© 2025 ResuCraft. All rights reserved.</Text>
      </View>
    </>
  );
}
