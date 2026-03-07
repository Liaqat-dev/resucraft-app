import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { verifyEmail, resendVerificationCode } from '@/services/authService';

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
const GREEN       = '#22c55e';
const GREEN_BG    = '#22c55e14';
const GREEN_BORDER = '#22c55e30';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [digits,         setDigits]         = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying,    setIsVerifying]    = useState(false);
  const [isResending,    setIsResending]    = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [serverError,    setServerError]    = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const code = digits.join('');

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDigitChange = (value: string, index: number) => {
    if (value.length === CODE_LENGTH && /^\d+$/.test(value)) {
      setDigits(value.slice(0, CODE_LENGTH).split(''));
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setServerError('');
    if (code.length < CODE_LENGTH) {
      setServerError('Please enter the full 6-digit code.');
      return;
    }
    if (!email) {
      setServerError('Email address is missing. Please go back and try again.');
      return;
    }
    setIsVerifying(true);
    try {
      await verifyEmail(email, code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Email Verified!',
        'Your account is verified. You can now sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setServerError(err.message ?? 'Invalid or expired code. Please try again.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await resendVerificationCode(email);
      startCooldown();
      Alert.alert('Code Sent', `A new code was sent to ${email}.`);
    } catch (err: any) {
      Alert.alert('Failed', err.message ?? 'Could not resend code. Try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const isReady = code.length === CODE_LENGTH;

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
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          {/* Envelope icon with halo */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
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
              <Ionicons name="mail-open-outline" size={30} color={GREEN} />
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
              marginBottom: 10,
            }}
          >
            Check your email
          </Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
            We sent a 6-digit code to
          </Text>
          <Text
            style={{ color: GOLD, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 3 }}
            numberOfLines={1}
          >
            {email ?? 'your email'}
          </Text>
        </View>

        {/* Error banner */}
        {!!serverError && (
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
            <Text style={{ color: '#f87171', fontSize: 13, flex: 1, lineHeight: 19 }}>{serverError}</Text>
          </View>
        )}

        {/* OTP card */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: BORDER,
            gap: 22,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 28,
            elevation: 10,
          }}
        >
          {/* Digit boxes */}
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={r => { inputRefs.current[i] = r; }}
                style={{
                  flex: 1,
                  height: 60,
                  textAlign: 'center',
                  fontSize: 26,
                  fontWeight: '700',
                  color: digit ? TEXT : TEXT_DIM,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: digit ? GOLD : BORDER,
                  backgroundColor: digit ? GOLD_BG : INPUT_BG,
                  fontFamily: SERIF,
                }}
                value={digit}
                onChangeText={v => handleDigitChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                selectTextOnFocus
                editable={!isVerifying}
              />
            ))}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={isVerifying || !isReady}
            style={{
              height: 54,
              borderRadius: 14,
              backgroundColor: isReady ? GOLD : BORDER,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isVerifying ? 0.7 : 1,
            }}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                  color: isReady ? '#fff' : TEXT_DIM,
                }}
              >
                Verify Email
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: TEXT_DIM, fontSize: 13 }}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || isResending}
              activeOpacity={0.7}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={GOLD} style={{ marginLeft: 6 }} />
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    marginLeft: 4,
                    color: resendCooldown > 0 ? BORDER_MED : GOLD,
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Back to login */}
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
