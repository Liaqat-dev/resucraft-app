import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ConfirmDeleteModalProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({ visible, message, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const t = useThemeColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: '#00000080' }}
        onPress={onCancel}
      >
        <Pressable
          className="w-full rounded-2xl p-6"
          style={{ backgroundColor: t.confirmBg, borderWidth: 1, borderColor: t.border }}
          onPress={() => {}}
        >
          <Text className="font-bold text-base mb-2 text-center" style={{ color: t.text }}>Are you sure?</Text>
          <Text className="text-sm text-center mb-6" style={{ color: t.textSub }}>{message}</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 h-11 rounded-xl items-center justify-center"
              style={{ borderWidth: 1, borderColor: t.border }}
            >
              <Text className="font-semibold" style={{ color: t.textSub }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 h-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: '#ef4444' }}
            >
              <Text className="text-white font-bold">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
