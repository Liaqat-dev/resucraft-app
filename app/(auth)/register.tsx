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

import { signup } from '@/services/authService';
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

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8,          label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p),         label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p),         label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p),         label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

const STRENGTH_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e'];

const registerSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'At least 3 characters')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
  email: Yup.string().required('Email is required').email('Invalid email address'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'At least 8 characters')
    .matches(/[A-Z]/, 'One uppercase letter')
    .matches(/[a-z]/, 'One lowercase letter')
    .matches(/[0-9]/, 'One number')
    .matches(/[^A-Za-z0-9]/, 'One special character'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
});

// ── Field helpers ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: TEXT_DIM,
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const form = useAppFormik({
    initialValues: { username: '', email: '', password: '', confirmPassword: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      await signup(values.username.trim(), values.email.trim().toLowerCase(), values.password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: values.email.trim().toLowerCase() },
      });
    },
  });

  const passStrength  = PASSWORD_RULES.filter(r => r.test(form.values.password)).length;
  const strengthColor = STRENGTH_COLORS[passStrength] ?? '#ef4444';
  const strengthPct   = (passStrength / PASSWORD_RULES.length) * 100;

  const hasErr = (name: keyof typeof form.errors) => form.touched[name] && !!form.errors[name];
  const inputBorderColor = (name: keyof typeof form.errors) =>
    hasErr(name) ? '#f8717160' : BORDER;

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
            Create your account
          </Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
            Join thousands crafting{'\n'}standout resumes.
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
          {/* Username */}
          <View style={{ gap: 8 }}>
            <FieldLabel>Username</FieldLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: inputBorderColor('username'),
              }}
            >
              <Ionicons
                name="at"
                size={17}
                color={hasErr('username') ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="your_username"
                placeholderTextColor={BORDER_MED}
                value={form.values.username}
                onChangeText={t => form.setFieldValue('username', t.toLowerCase().replace(/\s/g, ''))}
                onBlur={form.handleBlur('username')}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!form.isSubmitting}
              />
            </View>
            {hasErr('username') && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.username}</Text>
            )}
          </View>

          {/* Email */}
          <View style={{ gap: 8 }}>
            <FieldLabel>Email Address</FieldLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: inputBorderColor('email'),
              }}
            >
              <Ionicons
                name="mail-outline"
                size={17}
                color={hasErr('email') ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={emailRef}
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="you@example.com"
                placeholderTextColor={BORDER_MED}
                value={form.values.email}
                onChangeText={form.handleChange('email')}
                onBlur={form.handleBlur('email')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!form.isSubmitting}
              />
            </View>
            {hasErr('email') && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={{ gap: 8 }}>
            <FieldLabel>Password</FieldLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: inputBorderColor('password'),
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={hasErr('password') ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={passwordRef}
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="Create a strong password"
                placeholderTextColor={BORDER_MED}
                value={form.values.password}
                onChangeText={form.handleChange('password')}
                onBlur={form.handleBlur('password')}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
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

            {/* Strength bar + rules */}
            {form.values.password.length > 0 && (
              <View style={{ gap: 10, marginTop: 2 }}>
                {/* Bar */}
                <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: 4,
                      width: `${strengthPct}%` as any,
                      backgroundColor: strengthColor,
                      borderRadius: 2,
                    }}
                  />
                </View>
                {/* Rules */}
                <View style={{ gap: 5 }}>
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(form.values.password);
                    return (
                      <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons
                          name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                          size={13}
                          color={ok ? '#22c55e' : BORDER_MED}
                        />
                        <Text style={{ fontSize: 12, color: ok ? '#22c55e' : TEXT_DIM }}>{rule.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {hasErr('password') && !form.values.password.length && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.password}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={{ gap: 8 }}>
            <FieldLabel>Confirm Password</FieldLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: INPUT_BG,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 52,
                borderWidth: 1,
                borderColor: inputBorderColor('confirmPassword'),
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={hasErr('confirmPassword') ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={confirmRef}
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="Repeat your password"
                placeholderTextColor={BORDER_MED}
                value={form.values.confirmPassword}
                onChangeText={form.handleChange('confirmPassword')}
                onBlur={form.handleBlur('confirmPassword')}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                onSubmitEditing={() => form.handleSubmit()}
                editable={!form.isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(v => !v)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={TEXT_DIM}
                />
              </TouchableOpacity>
            </View>
            {hasErr('confirmPassword') && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.confirmPassword}</Text>
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
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text
          style={{
            color: TEXT_DIM,
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 18,
            marginTop: 18,
          }}
        >
          By signing up you agree to our{' '}
          <Text style={{ color: TEXT_MUTED }}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: TEXT_MUTED }}>Privacy Policy</Text>.
        </Text>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginLeft: 5 }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
