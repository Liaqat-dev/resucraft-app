import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  Education,
  getEducation, createEducation, updateEducation, deleteEducation,
} from '@/services/resumeService';
import AccordionSection from '@/components/ui/AccordionSection';
import ModalSheet from '@/components/ui/ModalSheet';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import CardActions from '@/components/ui/CardActions';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const EDU_COLOR = '#34d399';

export default function EducationSection() {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Education | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [field, setField] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      setItems(await getEducation());
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

  const openAdd = () => {
    setEditItem(null);
    setSchool(''); setDegree(''); setField('');
    setStartDate(''); setEndDate(''); setDescription('');
    setModalOpen(true);
  };

  const openEdit = (item: Education) => {
    setEditItem(item);
    setSchool(item.school ?? '');
    setDegree(item.degree ?? '');
    setField(item.fieldOfStudy ?? '');
    setStartDate(item.startDate?.slice(0, 10) ?? '');
    setEndDate(item.endDate?.slice(0, 10) ?? '');
    setDescription(item.description ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!school.trim() || !degree.trim() || !startDate.trim()) {
      Alert.alert('Required', 'School, degree, and start date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        school: school.trim(), degree: degree.trim(),
        fieldOfStudy: field.trim() || undefined,
        startDate: startDate.trim(),
        endDate: endDate.trim() || undefined,
        description: description.trim() || undefined,
      };
      if (editItem) {
        const updated = await updateEducation(editItem._id, payload);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      } else {
        const created = await createEducation(payload);
        setItems(prev => [created, ...prev]);
      }
      setModalOpen(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEducation(deleteId);
      setItems(prev => prev.filter(i => i._id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      <AccordionSection
        icon="school-outline" iconColor={EDU_COLOR} iconBg={EDU_COLOR + '20'}
        title="Education" count={items.length}
        isOpen={open} onToggle={handleToggle} onAdd={openAdd} loading={loading}
      >
        {loading ? (
          <View className="py-8 items-center"><ActivityIndicator color={GOLD} /></View>
        ) : items.length === 0 ? (
          <EmptyState icon="school-outline" message="No education added yet." onAdd={openAdd} />
        ) : (
          <View className="px-3 pb-3 pt-2">
            {items.map((item) => (
              <View key={item._id} className="mb-3 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: t.cardInner,
                  borderWidth: 1, borderColor: t.borderSub,
                  borderLeftWidth: 3, borderLeftColor: EDU_COLOR,
                }}>
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: EDU_COLOR + '20' }}>
                      <Ionicons name="school" size={19} color={EDU_COLOR} />
                    </View>
                    <CardActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item._id)} />
                  </View>
                  <Text className="font-bold text-[15px] leading-5" style={{ color: t.text }}>{item.degree}</Text>
                  <View className="flex-row items-center gap-1.5 mt-1.5">
                    <Ionicons name="location-outline" size={12} color={EDU_COLOR} />
                    <Text className="text-sm font-medium" style={{ color: EDU_COLOR }}>{item.school}</Text>
                  </View>
                  {item.fieldOfStudy ? (
                    <Text className="text-xs mt-1" style={{ color: t.textMuted }}>{item.fieldOfStudy}</Text>
                  ) : null}
                  <View className="flex-row mt-3">
                    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: EDU_COLOR + '15', borderWidth: 1, borderColor: EDU_COLOR + '30' }}>
                      <Ionicons name="calendar-outline" size={11} color={EDU_COLOR + '99'} />
                      <Text className="text-[11px] font-medium" style={{ color: EDU_COLOR + 'aa' }}>
                        {item.startDate?.slice(0, 7) ?? '—'}
                      </Text>
                      <Text className="text-[10px]" style={{ color: EDU_COLOR + '66' }}>→</Text>
                      <Text className="text-[11px] font-medium" style={{ color: EDU_COLOR + 'aa' }}>
                        {item.endDate?.slice(0, 7) ?? 'Present'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </AccordionSection>

      <ModalSheet
        visible={modalOpen}
        title={editItem ? 'Edit Education' : 'Add Education'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      >
        <View
          className="rounded-2xl overflow-hidden mt-4"
          style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card }}
        >
          <FormField icon="school-outline" label="School / Institution" value={school}
            onChangeText={setSchool} placeholder="e.g. MIT" />
          <FormField icon="ribbon-outline" label="Degree" value={degree}
            onChangeText={setDegree} placeholder="e.g. Bachelor of Science" />
          <FormField icon="book-outline" label="Field of Study" value={field}
            onChangeText={setField} placeholder="e.g. Computer Science" />
          <FormField icon="calendar-outline" label="Start Date" value={startDate}
            onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <FormField icon="calendar-outline" label="End Date (optional)" value={endDate}
            onChangeText={setEndDate} placeholder="YYYY-MM-DD or leave blank" autoCapitalize="none" />
          <FormField icon="document-text-outline" label="Description (optional)" value={description}
            onChangeText={setDescription} multiline isLast />
        </View>
      </ModalSheet>

      <ConfirmDeleteModal
        visible={!!deleteId}
        message="Delete this education entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
