import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface FormFieldProps {
  icon: IoniconName;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  isLast?: boolean;
  inputRef?: React.RefObject<TextInput>;
  onSubmitEditing?: () => void;
}

export default function FormField({
  icon, label, value, onChangeText, placeholder,
  keyboardType = 'default', multiline = false, autoCapitalize = 'words',
  isLast = false, inputRef, onSubmitEditing,
}: FormFieldProps) {
  const t = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className="px-5 py-3.5"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: t.borderSub } : undefined}
    >
      <Text className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: t.textMuted }}>
        {label}
      </Text>
      <View className="flex-row items-start gap-3">
        <Ionicons
          name={icon}
          size={16}
          color={focused ? GOLD : t.textFaint}
          style={{ marginTop: multiline ? 2 : 3 }}
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={t.placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          autoCapitalize={autoCapitalize}
          returnKeyType={isLast ? 'done' : 'next'}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-[15px] leading-5"
          style={{
            color: t.text,
            minHeight: multiline ? 60 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      </View>
    </View>
  );
}
