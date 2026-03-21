import React, { useEffect, useRef, useState } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/context/AuthContext';
import { login, googleLogin, getProfile } from '@/services/authService';
import { getPersonalInfo } from '@/services/profileService';
import { useAppFormik } from '@/hooks/useAppFormik';

WebBrowser.maybeCompleteAuthSession();

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

const loginSchema = Yup.object({
  emailOrUsername: Yup.string().required('Email or username is required'),
  password: Yup.string().required('Password is required'),
});

// ── Shared badge (same as landing) ───────────────────────────────────────────
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

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { loginSuccess, updatePersonalInfoState } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const [request, googleResponse, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token =
        googleResponse.authentication?.idToken ??
        googleResponse.authentication?.accessToken;
      if (token) handleGoogleLogin(token);
    } else if (googleResponse?.type === 'error') {
      setGoogleError('Google sign-in failed. Please try again.');
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (token: string) => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const data = await googleLogin(token);
      const user = await getProfile();
      loginSuccess(user);
      try { const info = await getPersonalInfo(); updatePersonalInfoState(info); } catch {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e: any) {
      setGoogleError(e.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const form = useAppFormik({
    initialValues: { emailOrUsername: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const data = await login(values.emailOrUsername.trim(), values.password.trim());
      if ((data as any).needsVerification) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: (data as any).email ?? values.emailOrUsername } });
        return;
      }
      const user = await getProfile();
      loginSuccess(user);
      try { const info = await getPersonalInfo(); updatePersonalInfoState(info); } catch {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    },
  });

  const emailErr = form.touched.emailOrUsername && form.errors.emailOrUsername;
  const passErr  = form.touched.password && form.errors.password;

  const inputBorderColor = (field: string, hasError: any) =>
    hasError ? '#f8717160' : focusedField === field ? GOLD + '99' : BORDER;

  const inputIconColor = (field: string, hasError: any) =>
    hasError ? '#f87171' : focusedField === field ? GOLD : TEXT_DIM;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ Visual Header Zone ══════════════════════════════════════════════ */}
        <View style={{ backgroundColor: SURFACE, paddingTop: insets.top + 14 ,height:'100%', paddingHorizontal: 24, overflow: 'hidden' }}>
          {/* Ambient radial glow */}
          <View style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: GOLD, opacity: 0.05, top: -100, alignSelf: 'center' }} />
          <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: GOLD, opacity: 0.04, bottom: -40, right: -40 }} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER_MED, marginBottom: 18 }}
          >
            <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(500).springify()}>


            <Badge label="Sign In · Secure" icon="shield-checkmark-outline" />

            <Text style={{ fontFamily: SERIF, fontSize: 38, fontWeight: '600', color: TEXT, letterSpacing: -0.8, lineHeight: 46, marginBottom: 10 }}>
              Welcome{'\n'}
              <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>back</Text>
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 23 }}>
              Sign in to continue building your career story.
            </Text>
          </Animated.View>



        {/* ══ Form Section ════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInUp.delay(80).duration(500).springify()} style={{ paddingTop: 24}}>

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

            {/* Email / Username */}
            <View style={{ gap: 7 }}>
              <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Email or Username
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('email', emailErr) }}>
                <Ionicons name="person-outline" size={17} color={inputIconColor('email', emailErr)} style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="you@example.com or username"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.emailOrUsername}
                  onChangeText={form.handleChange('emailOrUsername')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('emailOrUsername'); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!form.isSubmitting}
                />
              </View>
              {emailErr && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.emailOrUsername}</Text>}
            </View>

            {/* Password */}
            <View style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
                  <Text style={{ color: GOLD, fontSize: 12, fontWeight: '600' }}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: inputBorderColor('password', passErr) }}>
                <Ionicons name="lock-closed-outline" size={17} color={inputIconColor('password', passErr)} style={{ marginRight: 10 }} />
                <TextInput
                  ref={passwordRef}
                  style={{ flex: 1, color: TEXT, fontSize: 15 }}
                  placeholder="Your password"
                  placeholderTextColor={BORDER_MED}
                  value={form.values.password}
                  onChangeText={form.handleChange('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => { setFocusedField(''); form.setFieldTouched('password'); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={() => form.handleSubmit()}
                  editable={!form.isSubmitting}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={TEXT_DIM} />
                </TouchableOpacity>
              </View>
              {passErr && <Text style={{ color: '#f87171', fontSize: 12, lineHeight: 17 }}>{form.errors.password}</Text>}
            </View>

            {/* Submit — pill shape with arrow, matches landing CTA */}
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
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 16, gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <Text style={{ color: TEXT_DIM, fontSize: 11, letterSpacing: 0.5 }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </View>

          {/* Google error */}
          {googleError ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#f8717112', borderWidth: 1, borderColor: '#f8717130', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}>
              <Ionicons name="alert-circle" size={15} color="#f87171" style={{ marginTop: 1 }} />
              <Text style={{ color: '#f87171', fontSize: 12, flex: 1 }}>{googleError}</Text>
            </View>
          ) : null}

          {/* Google sign-in button */}
          <TouchableOpacity
            onPress={() => {
              setGoogleError('');
              if (Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
                setGoogleError('Android Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to your .env file.');
                return;
              }
              promptAsync();
            }}
            activeOpacity={0.85}
            disabled={!request || googleLoading}
            style={{
              height: 44, borderRadius: 100, borderWidth: 1,
              borderColor: BORDER_MED, backgroundColor: CARD,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 10, marginBottom: 20,
              opacity: (!request || googleLoading) ? 0.5 : 1,
            }}
          >
            {googleLoading ? (
              <ActivityIndicator color={GOLD} size="small" />
            ) : (
              <>
                {/* Google "G" SVG-like icon using text */}
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#4285F4' }}>G</Text>
                </View>
                <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600' }}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/register')} activeOpacity={0.7}>
              <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginLeft: 5 }}>Create one free</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
