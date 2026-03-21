import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useThemeColors, GOLD } from '@/hooks/useThemeColors';
import { getProfileCompletion, ProfileCompletion } from '@/services/authService';

const PROFILE_THRESHOLD = 50;

// ─── How it works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    icon: 'clipboard-outline' as const,
    title: 'Paste Job Description',
    desc: 'Copy the job posting or describe the role you want',
  },
  {
    icon: 'layers-outline' as const,
    title: 'Select a Template',
    desc: 'Choose from your saved resume templates',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI Generates Your Resume',
    desc: 'Gemini tailors your profile to match the job',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const t = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, personalInfo } = useAuth();

  const [jobDescription, setJobDescription] = useState('');
  const [profileData, setProfileData] = useState<ProfileCompletion | null>(null);

  useEffect(() => {
    getProfileCompletion()
      .then(setProfileData)
      .catch(() => {}); // non-fatal
  }, []);

  const charCount = jobDescription.trim().length;
  const isJobDescReady = charCount >= 20;
  const isProfileReady = (profileData?.percentage ?? 0) >= PROFILE_THRESHOLD;
  const canGenerate = isJobDescReady && isProfileReady;
  const canInterview = isJobDescReady;

  const handleGenerateResume = () => {
    if (!canGenerate) return;
    router.push({
      pathname: '/(tabs)/templates',
      params: { jobDescription: jobDescription.trim(), mode: 'generate' },
    });
  };

  const handlePracticeInterview = () => {
    if (!canInterview) return;
    router.push({
      pathname: '/interview',
      params: { jobDescription: jobDescription.trim() },
    });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName =
    personalInfo?.firstName || user?.username || 'there';
  const topPad = insets.top + (Platform.OS === 'android' ? 12 : 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 48,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Greeting ── */}
      <View style={{ paddingTop: topPad, marginBottom: 22 }}>
        <Text style={{ fontSize: 13, color: t.textSub, letterSpacing: 0.4 }}>
          {greeting()},
        </Text>
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: t.text,
            letterSpacing: -0.6,
            lineHeight: 36,
          }}
        >
          {displayName}
          {'  '}
          <Text style={{ color: GOLD }}>✦</Text>
        </Text>
        <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 5 }}>
          Let AI craft your perfect resume or prep for your next interview.
        </Text>
      </View>

      {/* ── Profile Completion ── */}
      {profileData && (
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          activeOpacity={0.85}
          style={{
            backgroundColor: t.card,
            borderRadius: 16,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isProfileReady ? GOLD + '50' : t.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 9,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="stats-chart" size={14} color={GOLD} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>
                Profile Completion
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: isProfileReady ? GOLD : t.textSub,
              }}
            >
              {profileData.percentage}%
            </Text>
          </View>

          {/* Animated bar */}
          <View
            style={{
              height: 7,
              backgroundColor: t.borderSub,
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${profileData.percentage}%`,
                backgroundColor: isProfileReady ? GOLD : '#e09020',
                borderRadius: 4,
              }}
            />
          </View>

          <Text style={{ fontSize: 12, color: t.textMuted }}>
            {isProfileReady
              ? '✓ Profile ready — AI can generate your resume'
              : `Complete to ${PROFILE_THRESHOLD}% to enable AI generation — tap to update`}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Main Action Card ── */}
      <View
        style={{
          backgroundColor: t.card,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 14,
          elevation: 4,
          marginBottom: 22,
        }}
      >
        {/* Title */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}
        >
          <Ionicons name="sparkles" size={18} color={GOLD} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>
            Create AI-Tailored Resume
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: t.textSub, marginBottom: 18, lineHeight: 19 }}>
          Paste a job description so AI can customise your resume and sharpen your interview prep.
        </Text>

        {/* Job description label */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: t.textSub,
            letterSpacing: 0.7,
            textTransform: 'uppercase',
            marginBottom: 7,
          }}
        >
          Job Description
        </Text>

        {/* Textarea */}
        <View
          style={{
            backgroundColor: t.inputBg,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: jobDescription.length > 0 ? GOLD + '70' : t.border,
            marginBottom: 6,
          }}
        >
          <TextInput
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder="Paste the job posting or describe the role you're applying for…"
            placeholderTextColor={t.placeholder}
            multiline
            numberOfLines={Platform.OS === 'ios' ? 0 : 7}
            style={{
              padding: 13,
              fontSize: 13,
              color: t.text,
              minHeight: 126,
              textAlignVertical: 'top',
              lineHeight: 21,
            }}
          />
        </View>

        {/* Character count */}
        <Text
          style={{
            fontSize: 11,
            color: isJobDescReady ? '#22c55e' : t.textMuted,
            textAlign: 'right',
            marginBottom: 18,
          }}
        >
          {charCount} / 20 characters minimum
        </Text>

        {/* Generate Resume button */}
        <TouchableOpacity
          onPress={handleGenerateResume}
          disabled={!canGenerate}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: canGenerate ? GOLD : t.borderSub,
            borderRadius: 13,
            paddingVertical: 15,
            marginBottom: 8,
          }}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color={canGenerate ? '#fff' : t.textFaint}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: canGenerate ? '#fff' : t.textFaint,
            }}
          >
            Generate Resume
          </Text>
        </TouchableOpacity>

        {/* Hint text under generate button */}
        {!canGenerate && (
          <Text
            style={{
              fontSize: 11,
              color: t.textMuted,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            {!isProfileReady && isJobDescReady
              ? `Profile must be ${PROFILE_THRESHOLD}%+ to generate`
              : !isJobDescReady && isProfileReady
              ? 'Enter at least 20 characters'
              : 'Complete profile & enter a job description'}
          </Text>
        )}

        {/* Divider */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 10,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: t.borderSub }} />
          <Text
            style={{ marginHorizontal: 12, fontSize: 12, color: t.textFaint }}
          >
            or
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.borderSub }} />
        </View>

        {/* Practice Interview button */}
        <TouchableOpacity
          onPress={handlePracticeInterview}
          disabled={!canInterview}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 2,
            borderColor: canInterview ? GOLD : t.border,
            borderRadius: 13,
            paddingVertical: 14,
          }}
        >
          <Ionicons
            name="mic"
            size={18}
            color={canInterview ? GOLD : t.textFaint}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: canInterview ? GOLD : t.textFaint,
            }}
          >
            Practice Interview
          </Text>
        </TouchableOpacity>

        {!canInterview && (
          <Text
            style={{
              fontSize: 11,
              color: t.textMuted,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Enter a job description to start interview practice
          </Text>
        )}
      </View>

      {/* ── How it works ── */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: GOLD,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        ✦ How it works
      </Text>

      {STEPS.map((step, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 13,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: GOLD + '20',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ionicons name={step.icon} size={18} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 2 }}
            >
              {step.title}
            </Text>
            <Text style={{ fontSize: 12, color: t.textSub, lineHeight: 18 }}>
              {step.desc}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
