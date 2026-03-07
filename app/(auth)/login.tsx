import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Yup from 'yup';

import { useAuth } from '@/context/AuthContext';
import { login, getProfile } from '@/services/authService';
import { getPersonalInfo } from '@/services/profileService';
import { useAppFormik } from '@/hooks/useAppFormik';

// ── Design tokens (shared with landing) ───────────────────────────────────────
const GOLD        = '#C09A3A';
const GOLD_BG     = '#C09A3A16';
const GOLD_BORDER = '#C09A3A44';
const BG          = '#080E1A';
const CARD        = '#111827';
const BORDER      = '#1e293b';
const BORDER_MED  = '#2d3d52';
const TEXT        = '#f1f5f9';
const TEXT_MUTED  = '#94a3b8';
const TEXT_DIM    = '#4e6278';
const INPUT_BG    = '#060B14';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const loginSchema = Yup.object({
  emailOrUsername: Yup.string().required('Email or username is required'),
  password: Yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginSuccess, updatePersonalInfoState } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const form = useAppFormik({
    initialValues: { emailOrUsername: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const data = await login(values.emailOrUsername.trim(), values.password.trim());

      if ((data as any).needsVerification) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: (data as any).email ?? values.emailOrUsername },
        });
        return;
      }

      const user = await getProfile();
      loginSuccess(user);

      try {
        const info = await getPersonalInfo();
        updatePersonalInfoState(info);
      } catch {}

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    },
  });

  const emailErr = form.touched.emailOrUsername && form.errors.emailOrUsername;
  const passErr  = form.touched.password && form.errors.password;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BORDER_MED,
            marginBottom: 32,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>

        {/* Brand + heading */}
        <View style={{ marginBottom: 32 }}>
          {/* Brand icon with halo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 46, height: 46 }}>
              <View
                style={{
                  position: 'absolute',
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  borderWidth: 1,
                  borderColor: GOLD_BORDER,
                  opacity: 0.55,
                }}
              />
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: GOLD_BG,
                  borderWidth: 1.5,
                  borderColor: GOLD_BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="document-text" size={17} color={GOLD} />
              </View>
            </View>
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
              ResuCraft
            </Text>
          </View>

          <Text
            style={{
              fontFamily: SERIF,
              fontSize: 36,
              fontWeight: '600',
              color: TEXT,
              letterSpacing: -0.6,
              lineHeight: 42,
              marginBottom: 8,
            }}
          >
            Welcome back
          </Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
            Sign in to continue building{'\n'}your career story.
          </Text>
        </View>

        {/* Server error */}
        {form.serverError && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: '#f8717112',
              borderWidth: 1,
              borderColor: '#f8717130',
              borderRadius: 13,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 18,
            }}
          >
            <Ionicons name="alert-circle" size={17} color="#f87171" style={{ marginTop: 1 }} />
            <Text style={{ color: '#f87171', fontSize: 13, flex: 1, lineHeight: 19 }}>{form.serverError}</Text>
            <TouchableOpacity onPress={form.clearError} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close" size={16} color="#f87171" />
            </TouchableOpacity>
          </View>
        )}

        {/* Form card */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: BORDER,
            gap: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 28,
            elevation: 10,
          }}
        >
          {/* Email / Username */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: TEXT_DIM,
                fontSize: 10.5,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Email or Username
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: emailErr ? '#f8717160' : BORDER,
              }}
            >
              <Ionicons
                name="person-outline"
                size={17}
                color={emailErr ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="you@example.com or username"
                placeholderTextColor={BORDER_MED}
                value={form.values.emailOrUsername}
                onChangeText={form.handleChange('emailOrUsername')}
                onBlur={form.handleBlur('emailOrUsername')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!form.isSubmitting}
              />
            </View>
            {emailErr && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.emailOrUsername}</Text>
            )}
          </View>

          {/* Password */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                style={{
                  color: TEXT_DIM,
                  fontSize: 10.5,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Password
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
                <Text style={{ color: GOLD, fontSize: 12, fontWeight: '600' }}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: passErr ? '#f8717160' : BORDER,
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={passErr ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={passwordRef}
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="Your password"
                placeholderTextColor={BORDER_MED}
                value={form.values.password}
                onChangeText={form.handleChange('password')}
                onBlur={form.handleBlur('password')}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={() => form.handleSubmit()}
                editable={!form.isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={TEXT_DIM}
                />
              </TouchableOpacity>
            </View>
            {passErr && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.password}</Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={() => form.handleSubmit()}
            activeOpacity={0.85}
            disabled={form.isSubmitting}
            style={{
              height: 54,
              borderRadius: 14,
              backgroundColor: form.isSubmitting ? BORDER : GOLD,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            {form.isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')} activeOpacity={0.7}>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginLeft: 5 }}>Create one free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
