import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import {
  changePassword,
  getSessions,
  revokeSession,
  logoutAll,
  updateAccountInfo,
  Session,
} from '@/services/authService';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (s <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (s <= 3) return { score: 3, label: 'Good', color: '#eab308' };
  if (s <= 4) return { score: 4, label: 'Strong', color: '#22c55e' };
  return { score: 5, label: 'Very Strong', color: '#10b981' };
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader({ icon, iconColor, iconBg, index, title, description }: {
  icon: IoniconName; iconColor: string; iconBg: string;
  index: string; title: string; description: string;
}) {
  const t = useThemeColors();
  return (
    <View className="flex-row items-start gap-3 px-5 py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: t.borderSub }}>
      <View className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-bold text-[15px]" style={{ color: t.text }}>{title}</Text>
          <Text className="text-[10px] font-mono" style={{ color: t.textFaint }}>{index}</Text>
        </View>
        <Text className="text-xs mt-0.5 leading-4" style={{ color: t.textMuted }}>{description}</Text>
      </View>
    </View>
  );
}

function PasswordInput({ label, value, onChangeText, placeholder, secure, onToggleSecure, isLast }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secure: boolean; onToggleSecure: () => void;
  isLast?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const t = useThemeColors();
  return (
    <View className="px-5 py-3.5"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: t.borderSub } : undefined}>
      <Text className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: t.textMuted }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Ionicons name="key-outline" size={16} color={focused ? GOLD : t.iconMuted} style={{ marginTop: 1 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={t.placeholder}
          secureTextEntry={secure}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-[15px]"
          style={{ color: t.text }}
        />
        <TouchableOpacity onPress={onToggleSecure} activeOpacity={0.6}>
          <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={16} color={t.iconMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TextField({ label, value, onChangeText, placeholder, readOnly, icon, isLast }: {
  label: string; value: string; onChangeText?: (t: string) => void;
  placeholder?: string; readOnly?: boolean; icon: IoniconName; isLast?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const t = useThemeColors();
  return (
    <View className="px-5 py-3.5"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: t.borderSub } : undefined}>
      <Text className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: t.textMuted }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={16} color={focused && !readOnly ? GOLD : t.iconMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.placeholder}
          editable={!readOnly}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-[15px]"
          style={{ color: readOnly ? t.textMuted : t.text }}
        />
        {readOnly && (
          <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: t.borderSub }}>
            <Text className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: t.textFaint }}>Locked</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onRevoke, revoking }: {
  session: Session; onRevoke: () => void; revoking: boolean;
}) {
  const t = useThemeColors();
  const isCurrentDevice = session.isCurrent;
  const deviceLabel = session.device ?? 'Unknown Device';
  const lastUsed = session.lastUsed
    ? new Date(session.lastUsed).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const deviceIcon: IoniconName = deviceLabel.toLowerCase().includes('mobile') || deviceLabel.toLowerCase().includes('android') || deviceLabel.toLowerCase().includes('iphone')
    ? 'phone-portrait-outline'
    : deviceLabel.toLowerCase().includes('tablet') || deviceLabel.toLowerCase().includes('ipad')
    ? 'tablet-portrait-outline'
    : 'desktop-outline';

  return (
    <View className="mx-3 mb-3 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: t.cardInner,
        borderWidth: 1,
        borderColor: isCurrentDevice ? '#22c55e25' : t.borderSub,
        borderLeftWidth: 3,
        borderLeftColor: isCurrentDevice ? '#22c55e' : t.border,
      }}>
      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: isCurrentDevice ? '#052e1666' : t.borderSub }}>
              <Ionicons name={deviceIcon} size={18}
                color={isCurrentDevice ? '#22c55e' : t.iconMuted} />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-sm" numberOfLines={1} style={{ color: t.text }}>{deviceLabel}</Text>
                {isCurrentDevice && (
                  <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: '#052e1640', borderWidth: 1, borderColor: '#22c55e40' }}>
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    <Text className="text-[9px] font-bold" style={{ color: '#22c55e' }}>THIS DEVICE</Text>
                  </View>
                )}
              </View>
              {session.ip && (
                <Text className="text-[11px] mt-0.5" style={{ color: t.textFaint }}>{session.ip}</Text>
              )}
            </View>
          </View>

          {/* Revoke button — hidden for current device */}
          {!isCurrentDevice && (
            <TouchableOpacity onPress={onRevoke} disabled={revoking}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: t.deleteBg, opacity: revoking ? 0.5 : 1 }}>
              {revoking
                ? <ActivityIndicator size="small" color="#f87171" />
                : <>
                    <Ionicons name="log-out-outline" size={12} color="#f87171" />
                    <Text className="text-[11px] font-semibold" style={{ color: '#f87171' }}>Revoke</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Last active */}
        {lastUsed && (
          <View className="flex-row items-center gap-1.5 mt-3">
            <Ionicons name="time-outline" size={11} color={t.border} />
            <Text className="text-[11px]" style={{ color: t.textFaint }}>Last active: {lastUsed}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const t = useThemeColors();

  // ── Account Info ──────────────────────────────────────────────────────────
  const [username, setUsername] = useState(user?.username ?? '');
  const [savingAccount, setSavingAccount] = useState(false);

  // ── Change Password ───────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [currentPwVisible, setCurrentPwVisible] = useState(false);
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const strength = getStrength(newPw);
  const pwMatch = confirmPw ? newPw === confirmPw : null;

  // ── Sessions ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllModal, setLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const loadSessions = useCallback(async () => {
    if (sessionsLoaded) return;
    setSessionsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data.sessions);
      setSessionsLoaded(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsLoaded]);

  useEffect(() => { loadSessions(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveAccount = async () => {
    if (!username.trim()) {
      Alert.alert('Required', 'Username cannot be empty.');
      return;
    }
    setSavingAccount(true);
    try {
      const updated = await updateAccountInfo({ username: username.trim() });
      updateUser(updated);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Username updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Too Short', 'New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Updated', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAll();
      // logoutAll clears the token, AuthContext will pick up the logout state
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setLoggingOutAll(false);
      setLogoutAllModal(false);
    }
  };

  const isLocalAccount = user?.provider === 'local';

  return (
    <KeyboardAvoidingView className="flex-1"
      style={{ backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Top bar */}
      <View className="flex-row items-center px-5"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: t.borderSub,
          backgroundColor: t.bg,
        }}>
        <TouchableOpacity onPress={() => router.back()}
          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          activeOpacity={0.7}
          style={{ borderWidth: 1, borderColor: t.border }}>
          <Ionicons name="chevron-back" size={20} color={t.textSub} />
        </TouchableOpacity>
        <Text className="font-bold text-base flex-1" style={{ color: t.text }}>Security</Text>
        <View className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: '#22c55e15', borderWidth: 1, borderColor: '#22c55e25' }}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, paddingTop: 12 }}>

        {/* ── ACCOUNT INFORMATION ─────────────────────────────────────────── */}
        <View className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
          <SectionHeader
            icon="person-outline" iconColor={GOLD} iconBg={GOLD + '20'}
            index="01" title="Account Information"
            description="Update your public username." />

          <TextField
            icon="at-outline" label="Username"
            value={username} onChangeText={setUsername}
            placeholder="your_username" />
          <TextField
            icon="mail-outline" label="Email Address"
            value={user?.email ?? ''} readOnly isLast />

          <View className="px-5 py-4">
            <TouchableOpacity onPress={handleSaveAccount} disabled={savingAccount}
              className="h-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: savingAccount ? t.savingBg : GOLD, opacity: savingAccount ? 0.7 : 1 }}>
              {savingAccount
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text className="text-white font-bold text-[14px]">Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHANGE PASSWORD ─────────────────────────────────────────────── */}
        {isLocalAccount ? (
          <View className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
            <SectionHeader
              icon="lock-closed-outline" iconColor="#60a5fa" iconBg="#60a5fa15"
              index="02" title="Change Password"
              description="Use a strong password you don't reuse elsewhere." />

            <PasswordInput
              label="Current Password" value={currentPw} onChangeText={setCurrentPw}
              placeholder="Enter current password"
              secure={!currentPwVisible} onToggleSecure={() => setCurrentPwVisible(p => !p)} />
            <PasswordInput
              label="New Password" value={newPw} onChangeText={setNewPw}
              placeholder="At least 8 characters"
              secure={!newPwVisible} onToggleSecure={() => setNewPwVisible(p => !p)} />

            {/* Strength meter */}
            {newPw.length > 0 && (
              <View className="px-5 pb-3">
                <View className="flex-row gap-1 mb-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <View key={i} className="flex-1 h-1 rounded-full"
                      style={{ backgroundColor: i <= strength.score ? strength.color : t.borderSub }} />
                  ))}
                </View>
                <Text className="text-xs font-semibold" style={{ color: strength.color }}>
                  {strength.label}
                </Text>
              </View>
            )}

            <PasswordInput
              label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw}
              placeholder="Repeat new password"
              secure={!confirmPwVisible} onToggleSecure={() => setConfirmPwVisible(p => !p)}
              isLast />

            {/* Match hint */}
            {pwMatch !== null && (
              <View className="px-5 pb-2 flex-row items-center gap-1.5">
                <Ionicons
                  name={pwMatch ? 'checkmark-circle' : 'close-circle'}
                  size={13}
                  color={pwMatch ? '#22c55e' : '#ef4444'} />
                <Text className="text-xs font-medium" style={{ color: pwMatch ? '#22c55e' : '#ef4444' }}>
                  {pwMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}

            <View className="px-5 py-4">
              <TouchableOpacity onPress={handleChangePassword} disabled={savingPw}
                className="h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: savingPw ? t.savingBg : t.editBg, opacity: savingPw ? 0.7 : 1 }}>
                {savingPw
                  ? <ActivityIndicator color="#60a5fa" size="small" />
                  : <Text className="font-bold text-[14px]" style={{ color: '#60a5fa' }}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Google OAuth — no password change */
          <View className="rounded-2xl overflow-hidden mb-4 px-5 py-5"
            style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
            <View className="flex-row items-center gap-3">
              <Ionicons name="logo-google" size={20} color="#60a5fa" />
              <View className="flex-1">
                <Text className="font-semibold text-sm" style={{ color: t.text }}>Signed in with Google</Text>
                <Text className="text-xs mt-0.5" style={{ color: t.textMuted }}>Password management is handled by your Google account.</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── ACTIVE SESSIONS ─────────────────────────────────────────────── */}
        <View className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
          <View className="flex-row items-center justify-between pr-4">
            <SectionHeader
              icon="phone-portrait-outline" iconColor="#a78bfa" iconBg="#a78bfa15"
              index="03" title="Active Sessions"
              description="Devices currently logged into your account." />
          </View>

          {sessionsLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color={GOLD} />
              <Text className="text-xs mt-3" style={{ color: t.textFaint }}>Loading sessions...</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View className="py-10 items-center px-6">
              <Ionicons name="desktop-outline" size={28} color={t.border} />
              <Text className="text-sm mt-2 text-center" style={{ color: t.textMuted }}>No active sessions found.</Text>
            </View>
          ) : (
            <View className="pt-3 pb-1">
              {sessions.map(session => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onRevoke={() => handleRevoke(session._id)}
                  revoking={revokingId === session._id}
                />
              ))}
            </View>
          )}

          {/* Logout all */}
          {sessions.length > 1 && (
            <View className="px-3 pb-4">
              <TouchableOpacity onPress={() => setLogoutAllModal(true)}
                className="h-11 rounded-xl flex-row items-center justify-center gap-2"
                style={{ backgroundColor: '#f8717110', borderWidth: 1, borderColor: '#f8717140' }}>
                <Ionicons name="log-out-outline" size={16} color="#f87171" />
                <Text className="font-semibold text-sm" style={{ color: '#f87171' }}>Logout All Other Devices</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── DANGER ZONE ─────────────────────────────────────────────────── */}
        <View className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: t.dangerZoneBg, borderWidth: 1, borderColor: '#ef444420' }}>
          <View className="px-5 py-4 flex-row items-center gap-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#ef444420' }}>
            <View className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: '#ef444415' }}>
              <Ionicons name="warning-outline" size={15} color="#ef4444" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-bold text-[15px]" style={{ color: '#ef4444' }}>Danger Zone</Text>
                <Text className="text-[10px] font-mono" style={{ color: t.textFaint }}>04</Text>
              </View>
              <Text className="text-xs mt-0.5 leading-4" style={{ color: t.textMuted }}>Irreversible and destructive actions.</Text>
            </View>
          </View>

          <View className="px-5 py-4">
            <View className="rounded-xl p-4" style={{ backgroundColor: '#ef444408', borderWidth: 1, borderColor: '#ef444420' }}>
              <Text className="font-semibold text-sm mb-1" style={{ color: t.text }}>Delete Account</Text>
              <Text className="text-xs leading-4 mb-4" style={{ color: t.textMuted }}>
                Once deleted, all your resumes and data will be permanently removed. This cannot be undone.
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Delete Account', 'This feature requires additional verification. Please contact support or use the web app to delete your account.')}
                className="flex-row items-center gap-2 self-start px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444430' }}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text className="text-[13px] font-semibold" style={{ color: '#ef4444' }}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ── Logout All Confirm Modal ── */}
      <Modal visible={logoutAllModal} transparent animationType="fade"
        onRequestClose={() => !loggingOutAll && setLogoutAllModal(false)}>
        <Pressable className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: '#00000080' }}
          onPress={() => !loggingOutAll && setLogoutAllModal(false)}>
          <Pressable className="w-full rounded-2xl p-6"
            style={{ backgroundColor: t.confirmBg, borderWidth: 1, borderColor: t.border }}
            onPress={() => {}}>
            <View className="w-12 h-12 rounded-full items-center justify-center self-center mb-4"
              style={{ backgroundColor: '#ef444420', borderWidth: 2, borderColor: '#ef444430' }}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </View>
            <Text className="font-bold text-base text-center mb-2" style={{ color: t.text }}>Logout All Devices</Text>
            <Text className="text-sm text-center mb-6 leading-5" style={{ color: t.textSub }}>
              You will be logged out from all devices including this one.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setLogoutAllModal(false)}
                disabled={loggingOutAll}
                className="flex-1 h-11 rounded-xl items-center justify-center"
                style={{ borderWidth: 1, borderColor: t.border }}>
                <Text className="font-semibold" style={{ color: t.textSub }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogoutAll}
                disabled={loggingOutAll}
                className="flex-1 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: '#ef4444' }}>
                {loggingOutAll
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text className="text-white font-bold">Logout All</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
