import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}

export default function ModalSheet({ visible, title, onClose, children, onSave, saving }: ModalSheetProps) {
  const t = useThemeColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: t.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: t.borderSub }}
        >
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ borderWidth: 1, borderColor: t.border }}
          >
            <Ionicons name="close" size={18} color={t.textSub} />
          </TouchableOpacity>
          <Text className="font-bold text-base" style={{ color: t.text }}>{title}</Text>
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            className="h-9 px-4 rounded-xl items-center justify-center"
            style={{ backgroundColor: saving ? t.savingBg : GOLD, opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text className="text-white text-sm font-bold">Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 8 }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
