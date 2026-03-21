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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Yup from 'yup';

import { signup } from '@/services/authService';
import { useAppFormik } from '@/hooks/useAppFormik';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = '#C09A3A';
const GOLD_LIGHT  = '#D4B06A';
const GOLD_BG     = '#C09A3A16';
const GOLD_BORDER = '#C09A3A44';
const BG          = '#080E1A';
const SURFACE     = '#0C1220';
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

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, icon }: { label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
      gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
      backgroundColor: GOLD_BG, borderWidth: 1, borderColor: GOLD_BORDER, marginBottom: 16,
    }}>
      {icon && <Ionicons name={icon} size={11} color={GOLD} />}
      <Text style={{ color: GOLD, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

export default function RegisterScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const form = useAppFormik({
    initialValues: { username: '', email: '', password: '', confirmPassword: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      await signup(values.username.trim(), values.email.trim().toLowerCase(), values.password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/(auth)/verify-email', params: { email: values.email.trim().toLowerCase() } });
    },
  });

  const passStrength  = PASSWORD_RULES.filter(r => r.test(form.values.password)).length;
  const strengthColor = STRENGTH_COLORS[passStrength] ?? '#ef4444';
  const strengthPct   = (passStrength / PASSWORD_RULES.length) * 100;

  const hasErr = (name: keyof typeof form.errors) => form.touched[name] && !!form.errors[name];

  const inputBorderColor = (field: string, errField: keyof typeof form.errors) =>
    hasErr(errField) ? '#f8717160' : focusedField === field ? GOLD + '99' : BORDER;

  const inputIconColor = (field: string, errField: keyof typeof form.errors) =>
    hasErr(errField) ? '#f87171' : focusedField === field ? GOLD : TEXT_DIM;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ Visual Header Zone ══════════════════════════════════════════════ */}
        <View style={{ backgroundColor: SURFACE, paddingTop: insets.top + 14,  paddingHorizontal: 24, overflow: 'hidden' }}>
          {/* Ambient radial glows */}
          <View style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: GOLD, opacity: 0.05, top: -100, alignSelf: 'center' }} />
          <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: GOLD, opacity: 0.04, bottom: -50, left: -40 }} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER_MED, marginBottom: 18 }}
          >
            <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(500).springify()}>


            <Badge label="Create Account · Free" icon="sparkles" />

            <Text style={{ fontFamily: SERIF, fontSize: 38, fontWeight: '600', color: TEXT, letterSpacing: -0.8, lineHeight: 46, marginBottom: 10 }}>
              Join{' '}
              <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>ResuCraft</Text>
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
              Build a resume that gets you hired — in under 60 seconds.
            </Text>
          </Animated.View>

        {/* Separator */}
        {/*<View style={{ height: 1, backgroundColor: BORDER }} />*/}

        {/* ══ Form Section ════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInUp.delay(80).duration(500).springify()} style={{ paddingTop: 8 }}>

          {/* Server error */}
          {form.serverError && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#f8717112', borderWidth: 1, borderColor: '#f8717130', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 }}>
              <Ionicons name="alert-circle" size={17} color="#f87171" style={{ marginTop: 1 }} />
              <Text style={{ color: '#f87171', fontSize: 13, flex: 1, lineHeight: 19 }}>{form.serverError}</Text>
              <TouchableOpacity onPress={form.clearError} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={16} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}

          {/* Form card */}
          <View style={{ backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, gap: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 30, elevation: 12 }}>

            {/* Username */}
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Username</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('username', 'username') }}>
                <Ionicons name="at" size={17} color={inputIconColor('username', 'username')} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="your_username"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.username}
                  onChangeText={t => form.setFieldValue('username', t.toLowerCase().replace(/\s/g, ''))}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('username'); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  editable={!form.isSubmitting}
                />
              </View>
              {hasErr('username') && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.username}</Text>}
            </View>

            {/* Email */}
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Email Address</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('email', 'email') }}>
                <Ionicons name="mail-outline" size={17} color={inputIconColor('email', 'email')} style={{ marginRight: 10 }} />
                <TextInput
                  ref={emailRef}
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="you@example.com"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.email}
                  onChangeText={form.handleChange('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('email'); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!form.isSubmitting}
                />
              </View>
              {hasErr('email') && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('password', 'password') }}>
                <Ionicons name="lock-closed-outline" size={17} color={inputIconColor('password', 'password')} style={{ marginRight: 10 }} />
                <TextInput
                  ref={passwordRef}
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="Create a strong password"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.password}
                  onChangeText={form.handleChange('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('password'); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  editable={!form.isSubmitting}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={TEXT_DIM} />
                </TouchableOpacity>
              </View>

              {/* Strength bar + rules */}
              {form.values.password.length > 0 && (
                <View style={{ gap: 10, marginTop: 2 }}>
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ color: TEXT_DIM, fontSize: 11, fontWeight: '600' }}>Strength</Text>
                      <Text style={{ color: strengthColor, fontSize: 11, fontWeight: '700' }}>
                        {passStrength < 2 ? 'Weak' : passStrength < 4 ? 'Fair' : 'Strong'}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: 4, width: `${strengthPct}%` as any, backgroundColor: strengthColor, borderRadius: 2 }} />
                    </View>
                  </View>
                  <View style={{ gap: 5 }}>
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(form.values.password);
                      return (
                        <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={ok ? '#22c55e' : BORDER_MED} />
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
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Confirm Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('confirm', 'confirmPassword') }}>
                <Ionicons name="shield-checkmark-outline" size={17} color={inputIconColor('confirm', 'confirmPassword')} style={{ marginRight: 10 }} />
                <TextInput
                  ref={confirmRef}
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="Repeat your password"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.confirmPassword}
                  onChangeText={form.handleChange('confirmPassword')}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('confirmPassword'); }}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={() => form.handleSubmit()}
                  editable={!form.isSubmitting}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={TEXT_DIM} />
                </TouchableOpacity>
              </View>
              {hasErr('confirmPassword') && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.confirmPassword}</Text>}
            </View>

            {/* Submit — pill CTA */}
            <TouchableOpacity
              onPress={() => form.handleSubmit()}
              activeOpacity={0.85}
              disabled={form.isSubmitting}
              style={{ height: 44, borderRadius: 100, backgroundColor: form.isSubmitting ? BORDER_MED : GOLD, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 }}
            >
              {form.isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={{ color: TEXT_DIM, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 16 }}>
            By signing up you agree to our{' '}
            <Text style={{ color: TEXT_MUTED }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: TEXT_MUTED }}>Privacy Policy</Text>.
          </Text>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
              <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginLeft: 5 }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
