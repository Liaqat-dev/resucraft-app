import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getPersonalInfo, PersonalInfo } from '@/services/profileService';
import { getProfileCompletion, ProfileCompletion, updateAccountInfo } from '@/services/authService';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

import ProfileCompletionBar from '@/components/profile/ProfileCompletionBar';
import PersonalInfoSection from '@/components/profile/PersonalInfoSection';
import EducationSection from '@/components/profile/EducationSection';
import ExperienceSection from '@/components/profile/ExperienceSection';
import SkillsSection from '@/components/profile/SkillsSection';
import ProjectsSection from '@/components/profile/ProjectsSection';
import CertificatesSection from '@/components/profile/CertificatesSection';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeColors();
  const { user, personalInfo: ctxInfo, updatePersonalInfoState, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(ctxInfo ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfileCompletion().then(setCompletion).catch(() => {});
    }, []),
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const info = ctxInfo ?? await getPersonalInfo();
        setPersonalInfo(info);
        if (!ctxInfo) updatePersonalInfoState(info);
      } catch {
        if (ctxInfo) setPersonalInfo(ctxInfo);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePersonalInfoSaved = (info: PersonalInfo) => {
    setPersonalInfo(info);
    updatePersonalInfoState(info);
  };

  const handlePickAvatar = async () => {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const updatedUser = await updateAccountInfo({
        profilePicUri: asset.uri,
        profilePicType: asset.mimeType ?? 'image/jpeg',
        profilePicName: asset.fileName ?? 'avatar.jpg',
      });
      updateUser(updatedUser);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = user?.profilePic?.url;
  const displayName = personalInfo?.firstName && personalInfo?.lastName
    ? `${personalInfo.firstName} ${personalInfo.lastName}`
    : user?.name ?? user?.username ?? 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, paddingTop: insets.top + 8 }}
        >
          {/* Avatar */}
          <View className="items-center py-6">
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
              <View className="relative">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="rounded-full" style={{ width: 88, height: 88 }} />
                ) : (
                  <View
                    className="rounded-full items-center justify-center"
                    style={{ width: 88, height: 88, backgroundColor: GOLD + '20', borderWidth: 2, borderColor: GOLD + '40' }}
                  >
                    <Text className="font-bold text-2xl" style={{ color: GOLD }}>{initials}</Text>
                  </View>
                )}
                <View
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: uploadingAvatar ? t.borderSub : GOLD,
                    borderWidth: 2,
                    borderColor: t.bg,
                  }}
                >
                  {uploadingAvatar
                    ? <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.6 }] }} />
                    : <Ionicons name="camera" size={13} color="#fff" />}
                </View>
              </View>
            </TouchableOpacity>
            <Text className="font-bold text-lg mt-3" style={{ color: t.text }}>{displayName}</Text>
            <Text className="text-sm mt-0.5" style={{ color: t.textMuted }}>@{user?.username}</Text>
          </View>

          {/* Completion bar */}
          {completion && <ProfileCompletionBar data={completion} t={t} />}

          {/* Sections */}
          <PersonalInfoSection initialData={personalInfo} onSaved={handlePersonalInfoSaved} />
          <EducationSection />
          <ExperienceSection />
          <SkillsSection />
          <ProjectsSection />
          <CertificatesSection />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

