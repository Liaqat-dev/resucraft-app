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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { verifyEmail, resendVerificationCode } from '@/services/authService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = '#C09A3A';
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
    if (code.length < CODE_LENGTH) { setServerError('Please enter the full 6-digit code.'); return; }
    if (!email) { setServerError('Email address is missing. Please go back and try again.'); return; }
    setIsVerifying(true);
    try {
      await verifyEmail(email, code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Email Verified!', 'Your account is verified. You can now sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ Visual Header Zone (green-accented) ═════════════════════════════ */}
        <View style={{ backgroundColor: SURFACE, paddingTop: insets.top + 14, paddingBottom: 36, paddingHorizontal: 24, overflow: 'hidden', alignItems: 'center' }}>
          {/* Ambient radial glow — green tint */}
          <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: GREEN, opacity: 0.04, top: -80, alignSelf: 'center' }} />
          <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: GOLD, opacity: 0.03, bottom: -60, right: -60 }} />

          {/* Back button */}
          <View style={{ width: '100%', marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER_MED }}
            >
              <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center' }}>
            {/* Envelope icon with green concentric ring halos */}
            <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <View style={{ position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: GREEN_BORDER, opacity: 0.35 }} />
              <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: GREEN_BORDER, opacity: 0.6 }} />
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: GREEN_BG, borderWidth: 1.5, borderColor: GREEN_BORDER, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mail-open-outline" size={26} color={GREEN} />
              </View>
            </View>

            {/* Gold badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: GREEN_BG, borderWidth: 1, borderColor: GREEN_BORDER, marginBottom: 16 }}>
              <Ionicons name="shield-checkmark-outline" size={11} color={GREEN} />
              <Text style={{ color: GREEN, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Verify Email · Step 2
              </Text>
            </View>

            <Text style={{ fontFamily: SERIF, fontSize: 34, fontWeight: '600', color: TEXT, textAlign: 'center', letterSpacing: -0.6, lineHeight: 42, marginBottom: 10 }}>
              Check your{'\n'}
              <Text style={{ color: '#4ade80', fontStyle: 'italic' }}>inbox</Text>
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
              We sent a 6-digit code to
            </Text>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
              {email ?? 'your email'}
            </Text>
          </Animated.View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: BORDER }} />

        {/* ══ OTP Section ═════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInUp.delay(80).duration(500).springify()} style={{ paddingHorizontal: 24, paddingTop: 28 }}>

          {/* Error banner */}
          {!!serverError && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#f8717112', borderWidth: 1, borderColor: '#f8717130', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 }}>
              <Ionicons name="alert-circle" size={17} color="#f87171" style={{ marginTop: 1 }} />
              <Text style={{ color: '#f87171', fontSize: 13, flex: 1, lineHeight: 19 }}>{serverError}</Text>
            </View>
          )}

          {/* OTP card */}
          <View style={{ backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, gap: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 30, elevation: 12 }}>

            {/* Hint row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GOLD_BG, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: GOLD_BORDER }}>
              <Ionicons name="information-circle-outline" size={16} color={GOLD} />
              <Text style={{ color: TEXT_MUTED, fontSize: 12, flex: 1, lineHeight: 18 }}>
                Enter the 6-digit code below. Check spam if you don't see it.
              </Text>
            </View>

            {/* Digit boxes */}
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={r => { inputRefs.current[i] = r; }}
                  style={{
                    flex: 1,
                    height: 58,
                    textAlign: 'center',
                    fontSize: 24,
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

            {/* Verify button — pill */}
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={isVerifying || !isReady}
              style={{ height: 54, borderRadius: 100, backgroundColor: isReady ? GREEN : BORDER, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: isVerifying ? 0.7 : 1 }}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 0.3, color: isReady ? '#fff' : TEXT_DIM }}>
                    Verify Email
                  </Text>
                  {isReady && <Ionicons name="checkmark" size={17} color="#fff" />}
                </>
              )}
            </TouchableOpacity>

            {/* Resend row */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 13 }}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || isResending} activeOpacity={0.7}>
                {isResending ? (
                  <ActivityIndicator size="small" color={GOLD} style={{ marginLeft: 6 }} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', marginLeft: 4, color: resendCooldown > 0 ? BORDER_MED : GOLD }}>
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
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, marginBottom: 8 }}
          >
            <Ionicons name="arrow-back-outline" size={15} color={TEXT_DIM} />
            <Text style={{ color: TEXT_DIM, fontSize: 13 }}>Back to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}