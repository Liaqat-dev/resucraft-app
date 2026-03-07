import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  Experience,
  getExperience, createExperience, updateExperience, deleteExperience,
} from '@/services/resumeService';
import AccordionSection from '@/components/ui/AccordionSection';
import ModalSheet from '@/components/ui/ModalSheet';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import CardActions from '@/components/ui/CardActions';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const EXP_COLOR = '#60a5fa';
const NOW_COLOR = '#34d399';

export default function ExperienceSection() {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Experience | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      setItems(await getExperience());
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
    setCompany(''); setRole(''); setStartDate('');
    setEndDate(''); setCurrentlyWorking(false); setDescription('');
    setModalOpen(true);
  };

  const openEdit = (item: Experience) => {
    setEditItem(item);
    setCompany(item.company ?? '');
    setRole(item.role ?? '');
    setStartDate(item.startDate?.slice(0, 10) ?? '');
    setEndDate(item.endDate?.slice(0, 10) ?? '');
    setCurrentlyWorking(item.currentlyWorking ?? false);
    setDescription(item.description ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!company.trim() || !role.trim() || !startDate.trim()) {
      Alert.alert('Required', 'Company, role, and start date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company: company.trim(), role: role.trim(),
        startDate: startDate.trim(),
        endDate: currentlyWorking ? undefined : (endDate.trim() || undefined),
        currentlyWorking,
        description: description.trim() || undefined,
      };
      if (editItem) {
        const updated = await updateExperience(editItem._id, payload);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      } else {
        const created = await createExperience(payload);
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
      await deleteExperience(deleteId);
      setItems(prev => prev.filter(i => i._id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      <AccordionSection
        icon="briefcase-outline" iconColor={EXP_COLOR} iconBg={EXP_COLOR + '20'}
        title="Work Experience" count={items.length}
        isOpen={open} onToggle={handleToggle} onAdd={openAdd} loading={loading}
      >
        {loading ? (
          <View className="py-8 items-center"><ActivityIndicator color={GOLD} /></View>
        ) : items.length === 0 ? (
          <EmptyState icon="briefcase-outline" message="No work experience added yet." onAdd={openAdd} />
        ) : (
          <View className="px-3 pb-3 pt-2">
            {items.map((item) => (
              <View key={item._id} className="mb-3 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: t.cardInner,
                  borderWidth: 1, borderColor: t.borderSub,
                  borderLeftWidth: 3, borderLeftColor: EXP_COLOR,
                }}>
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: EXP_COLOR + '20' }}>
                        <Ionicons name="briefcase" size={18} color={EXP_COLOR} />
                      </View>
                      {item.currentlyWorking && (
                        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: NOW_COLOR + '20', borderWidth: 1, borderColor: NOW_COLOR + '40' }}>
                          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NOW_COLOR }} />
                          <Text className="text-[10px] font-bold" style={{ color: NOW_COLOR }}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <CardActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item._id)} />
                  </View>
                  <Text className="font-bold text-[15px]" style={{ color: t.text }}>{item.role}</Text>
                  <View className="flex-row items-center gap-1.5 mt-1.5">
                    <Ionicons name="business-outline" size={12} color={EXP_COLOR} />
                    <Text className="text-sm font-medium" style={{ color: EXP_COLOR }}>{item.company}</Text>
                  </View>
                  <View className="flex-row mt-2.5">
                    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: EXP_COLOR + '15', borderWidth: 1, borderColor: EXP_COLOR + '30' }}>
                      <Ionicons name="time-outline" size={11} color={EXP_COLOR + '99'} />
                      <Text className="text-[11px] font-medium" style={{ color: EXP_COLOR + 'aa' }}>
                        {item.startDate?.slice(0, 7) ?? '—'}
                      </Text>
                      <Text className="text-[10px]" style={{ color: EXP_COLOR + '66' }}>→</Text>
                      <Text className="text-[11px] font-medium" style={{ color: EXP_COLOR + 'aa' }}>
                        {item.currentlyWorking ? 'Present' : (item.endDate?.slice(0, 7) ?? 'Present')}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text className="text-xs mt-2.5 leading-[18px]" style={{ color: t.textMuted }} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </AccordionSection>

      <ModalSheet
        visible={modalOpen}
        title={editItem ? 'Edit Experience' : 'Add Experience'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      >
        <View
          className="rounded-2xl overflow-hidden mt-4"
          style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card }}
        >
          <FormField icon="business-outline" label="Company" value={company}
            onChangeText={setCompany} placeholder="e.g. Google" />
          <FormField icon="briefcase-outline" label="Role / Title" value={role}
            onChangeText={setRole} placeholder="e.g. Software Engineer" />
          <FormField icon="calendar-outline" label="Start Date" value={startDate}
            onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          {!currentlyWorking && (
            <FormField icon="calendar-outline" label="End Date" value={endDate}
              onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          )}
          <View
            className="px-5 py-3.5 flex-row items-center justify-between"
            style={{ borderBottomWidth: 1, borderBottomColor: t.borderSub }}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="checkmark-circle-outline" size={16} color={t.textFaint} />
              <Text className="text-[13px]" style={{ color: t.textMuted }}>Currently working here</Text>
            </View>
            <Switch
              value={currentlyWorking}
              onValueChange={setCurrentlyWorking}
              trackColor={{ false: t.switchTrackFalse, true: GOLD + '60' }}
              thumbColor={currentlyWorking ? GOLD : t.textMuted}
            />
          </View>
          <FormField icon="document-text-outline" label="Description (optional)" value={description}
            onChangeText={setDescription} multiline isLast />
        </View>
      </ModalSheet>

      <ConfirmDeleteModal
        visible={!!deleteId}
        message="Delete this experience entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
