import React, { useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Yup from 'yup';

import { useAppFormik } from '@/hooks/useAppFormik';
import api from '@/services/api';

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
const GREEN       = '#22c55e';
const GREEN_BG    = '#22c55e14';
const GREEN_BORDER = '#22c55e30';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const forgotSchema = Yup.object({
  email: Yup.string().required('Email is required').email('Invalid email address'),
});

export default function ForgotPasswordScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [sent,      setSent]      = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const form = useAppFormik({
    initialValues: { email: '' },
    validationSchema: forgotSchema,
    onSubmit: async (values) => {
      await api.post('/auth/forgot-password', { email: values.email.trim().toLowerCase() });
      setSentEmail(values.email.trim().toLowerCase());
      setSent(true);
    },
  });

  const emailErr = form.touched.email && form.errors.email;

  // ── Success state ─────────────────────────────────────────────────────────
  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ══ Success Header Zone ═════════════════════════════════════════ */}
          <View style={{ backgroundColor: SURFACE, paddingTop: insets.top + 14, paddingBottom: 36, paddingHorizontal: 24, overflow: 'hidden', alignItems: 'center' }}>
            <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: GREEN, opacity: 0.04, top: -60, alignSelf: 'center' }} />

            <View style={{ width: '100%', marginBottom: 28 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER_MED }}
              >
                <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <Animated.View entering={ZoomIn.duration(500).springify()} style={{ alignItems: 'center' }}>
              {/* Plane icon with green halos */}
              <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <View style={{ position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: GREEN_BORDER, opacity: 0.35 }} />
                <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: GREEN_BORDER, opacity: 0.6 }} />
                <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: GREEN_BG, borderWidth: 1.5, borderColor: GREEN_BORDER, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="paper-plane-outline" size={26} color={GREEN} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: GREEN_BG, borderWidth: 1, borderColor: GREEN_BORDER, marginBottom: 16 }}>
                <Ionicons name="checkmark-circle-outline" size={11} color={GREEN} />
                <Text style={{ color: GREEN, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  Email Sent
                </Text>
              </View>

              <Text style={{ fontFamily: SERIF, fontSize: 34, fontWeight: '600', color: TEXT, textAlign: 'center', letterSpacing: -0.6, lineHeight: 42, marginBottom: 10 }}>
                Check your{'\n'}
                <Text style={{ color: '#4ade80', fontStyle: 'italic' }}>inbox</Text>
              </Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
                If an account exists for
              </Text>
              <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
                {sentEmail}
              </Text>
            </Animated.View>
          </View>

          <View style={{ height: 1, backgroundColor: BORDER }} />

          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={{ paddingHorizontal: 24, paddingTop: 32 }}>
            <Text style={{ color: TEXT_DIM, fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 300, alignSelf: 'center', marginBottom: 32 }}>
              You'll receive a password reset link shortly. Check your spam folder if it doesn't arrive within a few minutes.
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.85}
              style={{ height: 44, borderRadius: 100, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>Back to Sign In</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ Visual Header Zone ═══════════════════════════════════════════════ */}
        <View style={{ backgroundColor: SURFACE, paddingTop: insets.top + 14,height:'100%', paddingHorizontal: 24, overflow: 'hidden' }}>
          {/* Ambient glow */}
          <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: GOLD, opacity: 0.05, top: -80, alignSelf: 'center' }} />
          <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: GOLD, opacity: 0.04, bottom: -50, right: -30 }} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER_MED, marginBottom: 28 }}
          >
            <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(500).springify()}>

            {/* Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: GOLD_BG, borderWidth: 1, borderColor: GOLD_BORDER, marginBottom: 16 }}>
              <Ionicons name="lock-open-outline" size={11} color={GOLD} />
              <Text style={{ color: GOLD, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Reset Password
              </Text>
            </View>

            <Text style={{ fontFamily: SERIF, fontSize: 38, fontWeight: '600', color: TEXT, letterSpacing: -0.8, lineHeight: 46, marginBottom: 10 }}>
              Forgot your{'\n'}
              <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>password?</Text>
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
              Enter your email and we'll send you a reset link instantly.
            </Text>
          </Animated.View>

        {/* ══ Form Section ════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInUp.delay(80).duration(500).springify()} style={{  paddingTop: 18 }}>

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

            {/* Email */}
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Email Address
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG,
                borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1,
                borderColor: emailErr ? '#f8717160' : focusedField === 'email' ? GOLD + '99' : BORDER,
              }}>
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={emailErr ? '#f87171' : focusedField === 'email' ? GOLD : TEXT_DIM}
                  style={{ marginRight: 10 }}
                />
                <TextInput
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
                  returnKeyType="done"
                  onSubmitEditing={() => form.handleSubmit()}
                  editable={!form.isSubmitting}
                />
              </View>
              {emailErr && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.email}</Text>}
            </View>

            {/* Submit — pill CTA */}
            <TouchableOpacity
              onPress={() => form.handleSubmit()}
              activeOpacity={0.85}
              disabled={form.isSubmitting}
              style={{ height: 54, borderRadius: 100, backgroundColor: form.isSubmitting ? BORDER_MED : GOLD, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 }}
            >
              {form.isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>Send Reset Link</Text>
                  <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Back link */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, marginBottom: 8 }}
          >
            <Ionicons name="arrow-back-outline" size={15} color={TEXT_DIM} />
            <Text style={{ color: TEXT_DIM, fontSize: 13 }}>Back to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
