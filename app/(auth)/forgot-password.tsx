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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Yup from 'yup';

import { useAppFormik } from '@/hooks/useAppFormik';
import api from '@/services/api';

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
const GREEN_BG    = '#22c55e14';
const GREEN_BORDER = '#22c55e30';
const GREEN       = '#22c55e';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const forgotSchema = Yup.object({
  email: Yup.string().required('Email is required').email('Invalid email address'),
});

export default function ForgotPasswordScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [sent,       setSent]       = useState(false);
  const [sentEmail,  setSentEmail]  = useState('');

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

  // ── Success state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
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

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            {/* Success icon with halo */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
              <View
                style={{
                  position: 'absolute',
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 1,
                  borderColor: GREEN_BORDER,
                  opacity: 0.4,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: 78,
                  height: 78,
                  borderRadius: 39,
                  borderWidth: 1,
                  borderColor: GREEN_BORDER,
                  opacity: 0.65,
                }}
              />
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  backgroundColor: GREEN_BG,
                  borderWidth: 1.5,
                  borderColor: GREEN_BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="paper-plane-outline" size={30} color={GREEN} />
              </View>
            </View>

            <Text
              style={{
                fontFamily: SERIF,
                fontSize: 32,
                fontWeight: '600',
                color: TEXT,
                textAlign: 'center',
                letterSpacing: -0.5,
                lineHeight: 38,
                marginBottom: 12,
              }}
            >
              Check your inbox
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 4 }}>
              If an account exists for
            </Text>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 14 }}>
              {sentEmail}
            </Text>
            <Text
              style={{
                color: TEXT_DIM,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 20,
                maxWidth: 280,
                marginBottom: 36,
              }}
            >
              you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.85}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 14,
                backgroundColor: GOLD,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
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

        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          {/* Key icon with halo */}
          <View style={{ alignItems: 'flex-start', marginBottom: 24 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 62, height: 62 }}>
              <View
                style={{
                  position: 'absolute',
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  borderWidth: 1,
                  borderColor: GOLD_BORDER,
                  opacity: 0.5,
                }}
              />
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: GOLD_BG,
                  borderWidth: 1.5,
                  borderColor: GOLD_BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="key-outline" size={24} color={GOLD} />
              </View>
            </View>
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
            Forgot password?
          </Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
            Enter your email and we'll send you a link to reset your password.
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
          {/* Email */}
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
              Email Address
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
                name="mail-outline"
                size={17}
                color={emailErr ? '#f87171' : TEXT_DIM}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={{ flex: 1, color: TEXT, fontSize: 15 }}
                placeholder="you@example.com"
                placeholderTextColor={BORDER_MED}
                value={form.values.email}
                onChangeText={form.handleChange('email')}
                onBlur={form.handleBlur('email')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={() => form.handleSubmit()}
                editable={!form.isSubmitting}
              />
            </View>
            {emailErr && (
              <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.email}</Text>
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
            }}
          >
            {form.isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back link */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }}
        >
          <Ionicons name="arrow-back-outline" size={15} color={TEXT_DIM} />
          <Text style={{ color: TEXT_DIM, fontSize: 13 }}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
