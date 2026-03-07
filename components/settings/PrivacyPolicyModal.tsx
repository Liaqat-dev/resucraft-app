import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Information We Collect',
    body:
      'We collect information you provide directly to us, such as your name, email address, profile photo, and resume content including education, work experience, skills, projects, and certifications. We also collect device information and usage data to improve the app experience.',
  },
  {
    title: '2. How We Use Your Information',
    body:
      'We use the information we collect to provide, maintain, and improve ResuCraft — including generating PDF resumes, syncing your data across devices, and authenticating your account. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Data Storage & Security',
    body:
      'Your data is stored securely on MongoDB Atlas servers. Access tokens are stored in your device\'s secure enclave via expo-secure-store. We use HTTPS for all network communication and JWT-based authentication with short-lived tokens and refresh token rotation.',
  },
  {
    title: '4. Third-Party Services',
    body:
      'We use the following third-party services: Google OAuth for social login, ImgBB for profile photo hosting, and Puppeteer for PDF generation on our servers. Each service has its own privacy policy governing data use.',
  },
  {
    title: '5. Your Rights',
    body:
      'You have the right to access, correct, or delete your personal data at any time. You can update your profile information within the app, or contact us to request full account deletion. Upon deletion, all your resumes and associated data are permanently removed.',
  },
  {
    title: '6. Cookies & Tracking',
    body:
      'We use HttpOnly cookies solely for refresh token management. We do not use advertising trackers or analytics cookies. No data is shared with advertising networks.',
  },
  {
    title: '7. Changes to This Policy',
    body:
      'We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or by email. Continued use of ResuCraft after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '8. Contact Us',
    body:
      'If you have any questions about this Privacy Policy or your data, please contact us at support@resucraft.app. We aim to respond within 48 hours.',
  },
];

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
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
            style={{ backgroundColor: '#60a5fa15', borderWidth: 1, borderColor: '#60a5fa25' }}>
            <Ionicons name="shield-outline" size={15} color="#60a5fa" />
          </View>
          <Text className="font-bold text-base" style={{ color: t.text }}>Privacy Policy</Text>
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
          {/* Effective date */}
          <View className="flex-row items-center gap-2 mb-6">
            <Ionicons name="calendar-outline" size={13} color={t.textFaint} />
            <Text className="text-xs" style={{ color: t.textMuted }}>Effective date: January 1, 2025</Text>
          </View>

          {/* Intro */}
          <Text className="text-sm leading-6 mb-6" style={{ color: t.textSub }}>
            ResuCraft ("we", "our", or "us") is committed to protecting your privacy. This policy
            explains what data we collect, how we use it, and your rights regarding that data.
          </Text>

          {/* Sections */}
          {SECTIONS.map((section, i) => (
            <View key={i} className="mb-5">
              <View className="flex-row items-start gap-3 mb-2">
                <View
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: GOLD }}
                />
                <Text className="font-bold text-[14px] flex-1" style={{ color: t.text }}>{section.title}</Text>
              </View>
              <Text className="text-sm leading-6 pl-4" style={{ color: t.textSub }}>{section.body}</Text>
            </View>
          ))}

          {/* Footer */}
          <View
            className="rounded-2xl px-5 py-4 mt-4"
            style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.borderSub }}
          >
            <Text className="text-xs text-center leading-5" style={{ color: t.textMuted }}>
              By using ResuCraft, you agree to this Privacy Policy.{'\n'}
              Last updated: March 2025
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
