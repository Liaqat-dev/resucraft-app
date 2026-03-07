import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Skill, getSkills, createSkills, deleteSkill } from '@/services/resumeService';
import AccordionSection from '@/components/ui/AccordionSection';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const SKILL_CATEGORIES: Array<{ id: 'Technical' | 'Soft' | 'Other'; label: string; color: string }> = [
  { id: 'Technical', label: 'Technical', color: '#60a5fa' },
  { id: 'Soft',      label: 'Soft',      color: '#34d399' },
  { id: 'Other',     label: 'Other',     color: GOLD      },
];

export default function SkillsSection() {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'Technical' | 'Soft' | 'Other' | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [savingCat, setSavingCat] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      setSkills(await getSkills());
      setLoaded(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) load();
  };

  const handleAddSkill = async (category: 'Technical' | 'Soft' | 'Other') => {
    const names = newSkillInput.split(',').map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    setSavingCat(category);
    try {
      const created = await createSkills(names.map(name => ({ name, category })));
      setSkills(prev => [...prev, ...created]);
      setNewSkillInput('');
      setActiveCategory(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingCat(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSkill(deleteId);
      setSkills(prev => prev.filter(s => s._id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      <AccordionSection
        icon="code-slash-outline" iconColor={GOLD} iconBg={GOLD + '20'}
        title="Skills" count={skills.length}
        isOpen={open} onToggle={handleToggle} loading={loading}
      >
        {loading ? (
          <View className="py-8 items-center"><ActivityIndicator color={GOLD} /></View>
        ) : (
          <View className="px-4 py-3">
            {SKILL_CATEGORIES.map(cat => {
              const catSkills = skills.filter(s => s.category === cat.id);
              const isAdding = activeCategory === cat.id;
              return (
                <View key={cat.id} className="mb-5">
                  {/* Category header */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <Text className="text-sm font-semibold" style={{ color: cat.color }}>
                        {cat.label} Skills
                      </Text>
                      <Text className="text-xs" style={{ color: t.textMuted }}>({catSkills.length})</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setActiveCategory(isAdding ? null : cat.id);
                        setNewSkillInput('');
                      }}
                      className="flex-row items-center gap-1"
                    >
                      <Ionicons name={isAdding ? 'close' : 'add'} size={14} color={cat.color} />
                      <Text className="text-xs font-medium" style={{ color: cat.color }}>
                        {isAdding ? 'Cancel' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Chips */}
                  {catSkills.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {catSkills.map(s => (
                        <TouchableOpacity
                          key={s._id}
                          onPress={() => setDeleteId(s._id)}
                          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                          style={{ backgroundColor: cat.color + '18', borderWidth: 1, borderColor: cat.color + '35' }}
                        >
                          <Text className="text-xs font-medium" style={{ color: cat.color }}>{s.name}</Text>
                          <Ionicons name="close" size={10} color={cat.color} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : !isAdding ? (
                    <Text className="text-xs italic" style={{ color: t.textMuted }}>
                      No {cat.label.toLowerCase()} skills yet.
                    </Text>
                  ) : null}

                  {/* Inline add input */}
                  {isAdding && (
                    <View className="mt-2.5 flex-row gap-2">
                      <TextInput
                        value={newSkillInput}
                        onChangeText={setNewSkillInput}
                        placeholder="React, Node.js, ... (comma-separated)"
                        placeholderTextColor={t.placeholder}
                        className="flex-1 text-sm px-3 py-2.5 rounded-lg"
                        style={{
                          color: t.text,
                          backgroundColor: t.inputBg,
                          borderWidth: 1,
                          borderColor: t.border,
                        }}
                        autoFocus
                        onSubmitEditing={() => handleAddSkill(cat.id)}
                      />
                      <TouchableOpacity
                        onPress={() => handleAddSkill(cat.id)}
                        disabled={savingCat === cat.id}
                        className="px-3 rounded-lg items-center justify-center"
                        style={{ backgroundColor: GOLD }}
                      >
                        {savingCat === cat.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name="checkmark" size={16} color="#fff" />}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </AccordionSection>

      <ConfirmDeleteModal
        visible={!!deleteId}
        message="Delete this skill?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
