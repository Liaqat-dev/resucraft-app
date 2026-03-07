import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PersonalInfo, updatePersonalInfo } from '@/services/profileService';
import FormField from '@/components/ui/FormField';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

interface PersonalInfoSectionProps {
  initialData: PersonalInfo | null;
  onSaved: (info: PersonalInfo) => void;
}

export default function PersonalInfoSection({ initialData, onSaved }: PersonalInfoSectionProps) {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [profession, setProfession] = useState(initialData?.profession ?? '');
  const [bio, setBio] = useState(initialData?.bio ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [linkedin, setLinkedin] = useState(initialData?.linkedin ?? '');
  const [github, setGithub] = useState(initialData?.github ?? '');
  const [dob, setDob] = useState(initialData?.dob?.slice(0, 10) ?? '');

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName ?? '');
      setLastName(initialData.lastName ?? '');
      setProfession(initialData.profession ?? '');
      setBio(initialData.bio ?? '');
      setPhone(String(initialData.phone ?? ''));
      setAddress(initialData.address ?? '');
      setLinkedin(initialData.linkedin ?? '');
      setGithub(initialData.github ?? '');
      setDob(initialData.dob?.slice(0, 10) ?? '');
      setDirty(false);
    }
  }, [initialData]);

  const mark = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (val: T) => { setter(val); setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePersonalInfo({
        firstName: firstName.trim(), lastName: lastName.trim(),
        profession: profession.trim(), bio: bio.trim(),
        phone: phone.trim(), address: address.trim(),
        linkedin: linkedin.trim(), github: github.trim(),
        dob: dob.trim() || undefined,
      });
      onSaved(updated);
      setDirty(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Accordion header */}
      <TouchableOpacity onPress={() => setOpen(p => !p)} activeOpacity={0.7} className="flex-row items-center px-4 py-4">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: GOLD + '20' }}>
          <Ionicons name="person-outline" size={16} color={GOLD} />
        </View>
        <Text className="font-semibold text-[15px] flex-1" style={{ color: t.text }}>Personal Info</Text>
        {dirty && open && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="h-8 px-3 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: saving ? t.savingBg : GOLD }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text className="text-white text-xs font-bold">Save</Text>}
          </TouchableOpacity>
        )}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textFaint} />
      </TouchableOpacity>

      {open && (
        <View style={{ borderTopWidth: 1, borderTopColor: t.borderSub }}>
          <FormField icon="person-outline" label="First Name" value={firstName}
            onChangeText={mark(setFirstName)} placeholder="Jane" />
          <FormField icon="person-outline" label="Last Name" value={lastName}
            onChangeText={mark(setLastName)} placeholder="Doe" />
          <FormField icon="briefcase-outline" label="Profession" value={profession}
            onChangeText={mark(setProfession)} placeholder="e.g. Software Engineer" />
          <FormField icon="document-text-outline" label="Bio" value={bio}
            onChangeText={mark(setBio)} multiline />
          <FormField icon="call-outline" label="Phone" value={phone}
            onChangeText={mark(setPhone)} keyboardType="phone-pad" autoCapitalize="none" />
          <FormField icon="location-outline" label="Address" value={address}
            onChangeText={mark(setAddress)} placeholder="City, Country" />
          <FormField icon="calendar-outline" label="Date of Birth" value={dob}
            onChangeText={mark(setDob)} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <FormField icon="logo-linkedin" label="LinkedIn" value={linkedin}
            onChangeText={mark(setLinkedin)} keyboardType="url" autoCapitalize="none" />
          <FormField icon="logo-github" label="GitHub" value={github}
            onChangeText={mark(setGithub)} keyboardType="url" autoCapitalize="none" isLast />

          {dirty && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="mx-4 mb-4 mt-2 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: saving ? t.savingBg : GOLD }}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text className="text-white text-[15px] font-bold">Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
