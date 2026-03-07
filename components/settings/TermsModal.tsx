import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading or using ResuCraft, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.',
  },
  {
    title: '2. Use of the Service',
    body: 'ResuCraft is provided for personal, non-commercial resume building purposes. You agree not to misuse the service, attempt to reverse-engineer it, or use it to generate harmful or deceptive content.',
  },
  {
    title: '3. Your Account',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use. We reserve the right to suspend accounts that violate these terms.',
  },
  {
    title: '4. Content Ownership',
    body: 'You retain full ownership of all resume content you create. By using ResuCraft, you grant us a limited license to store and process your content solely to provide the service.',
  },
  {
    title: '5. Service Availability',
    body: 'We strive for high availability but do not guarantee uninterrupted service. We may modify, suspend, or discontinue any part of ResuCraft at any time with reasonable notice.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'ResuCraft is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the app.',
  },
  {
    title: '7. Governing Law',
    body: 'These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration or in courts of competent jurisdiction.',
  },
];

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
  const insets = useSafeAreaInsets();
  const t = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: t.bg }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5"
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.borderSub,
            backgroundColor: t.bg,
          }}
        >
          <View className="w-8 h-8 rounded-xl items-center justify-center"
            style={{ backgroundColor: '#34d39915', borderWidth: 1, borderColor: '#34d39925' }}>
            <Ionicons name="document-text-outline" size={15} color="#34d399" />
          </View>
          <Text className="font-bold text-base" style={{ color: t.text }}>Terms of Service</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-xl items-center justify-center"
            activeOpacity={0.7}
            style={{ borderWidth: 1, borderColor: t.border }}
          >
            <Ionicons name="close" size={18} color={t.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, paddingTop: 20 }}
        >
          <View className="flex-row items-center gap-2 mb-6">
            <Ionicons name="calendar-outline" size={13} color={t.textFaint} />
            <Text className="text-xs" style={{ color: t.textMuted }}>Effective date: January 1, 2025</Text>
          </View>

          <Text className="text-sm leading-6 mb-6" style={{ color: t.textSub }}>
            Please read these Terms of Service carefully before using ResuCraft. These terms govern
            your access to and use of our resume building application.
          </Text>

          {SECTIONS.map((section, i) => (
            <View key={i} className="mb-5">
              <View className="flex-row items-start gap-3 mb-2">
                <View
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: '#34d399' }}
                />
                <Text className="font-bold text-[14px] flex-1" style={{ color: t.text }}>{section.title}</Text>
              </View>
              <Text className="text-sm leading-6 pl-4" style={{ color: t.textSub }}>{section.body}</Text>
            </View>
          ))}

          <View
            className="rounded-2xl px-5 py-4 mt-4"
            style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.borderSub }}
          >
            <Text className="text-xs text-center leading-5" style={{ color: t.textMuted }}>
              By using ResuCraft, you agree to these Terms of Service.{'\n'}
              Last updated: March 2025
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
