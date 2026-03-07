import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  Project,
  getProjects, createProject, updateProject, deleteProject,
} from '@/services/resumeService';
import AccordionSection from '@/components/ui/AccordionSection';
import ModalSheet from '@/components/ui/ModalSheet';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import CardActions from '@/components/ui/CardActions';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import SectionLabel from '@/components/ui/SectionLabel';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const PROJ_COLOR = '#a78bfa';

const STATUS_OPTIONS: Array<{ value: Project['status']; label: string; color: string }> = [
  { value: 'completed',   label: 'Completed',   color: '#34d399' },
  { value: 'in-progress', label: 'In Progress', color: '#fbbf24' },
  { value: 'planned',     label: 'Planned',     color: '#94a3b8' },
];

export default function ProjectsSection() {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [status, setStatus] = useState<Project['status']>('completed');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      setItems(await getProjects());
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
    setTitle(''); setDescription(''); setLiveUrl(''); setRepoUrl('');
    setTechnologies(''); setStatus('completed'); setStartDate(''); setEndDate('');
    setModalOpen(true);
  };

  const openEdit = (item: Project) => {
    setEditItem(item);
    setTitle(item.title ?? '');
    setDescription(item.description ?? '');
    setLiveUrl(item.liveUrl ?? '');
    setRepoUrl(item.repoUrl ?? '');
    setTechnologies((item.technologies ?? []).join(', '));
    setStatus(item.status ?? 'completed');
    setStartDate(item.startDate?.slice(0, 10) ?? '');
    setEndDate(item.endDate?.slice(0, 10) ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Project title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<Project, '_id'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        technologies: technologies.split(',').map(t => t.trim()).filter(Boolean),
        status,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      };
      if (editItem) {
        const updated = await updateProject(editItem._id, payload);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      } else {
        const created = await createProject(payload);
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
      await deleteProject(deleteId);
      setItems(prev => prev.filter(i => i._id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const statusMeta = (s: Project['status']) => STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0];

  return (
    <>
      <AccordionSection
        icon="folder-open-outline" iconColor={PROJ_COLOR} iconBg={PROJ_COLOR + '20'}
        title="Projects" count={items.length}
        isOpen={open} onToggle={handleToggle} onAdd={openAdd} loading={loading}
      >
        {loading ? (
          <View className="py-8 items-center"><ActivityIndicator color={GOLD} /></View>
        ) : items.length === 0 ? (
          <EmptyState icon="folder-open-outline" message="No projects added yet." onAdd={openAdd} />
        ) : (
          <View className="px-3 pb-3 pt-2">
            {items.map((item) => {
              const meta = statusMeta(item.status);
              return (
                <View key={item._id} className="mb-3 rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: t.cardInner,
                    borderWidth: 1, borderColor: t.borderSub,
                    borderLeftWidth: 3, borderLeftColor: PROJ_COLOR,
                  }}>
                  <View className="p-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: PROJ_COLOR + '20' }}>
                          <Ionicons name="folder-open" size={18} color={PROJ_COLOR} />
                        </View>
                        <View className="px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: meta.color + '18', borderWidth: 1, borderColor: meta.color + '35' }}>
                          <Text className="text-[10px] font-bold tracking-wide" style={{ color: meta.color }}>
                            {meta.label.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <CardActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item._id)} />
                    </View>
                    <Text className="font-bold text-[15px]" style={{ color: t.text }}>{item.title}</Text>
                    {item.description ? (
                      <Text className="text-xs mt-1.5 leading-[18px]" style={{ color: t.textMuted }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    {item.technologies.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5 mt-3">
                        {item.technologies.slice(0, 5).map(tech => (
                          <View key={tech} className="px-2 py-1 rounded-lg"
                            style={{ backgroundColor: PROJ_COLOR + '18', borderWidth: 1, borderColor: PROJ_COLOR + '30' }}>
                            <Text className="text-[10px] font-medium" style={{ color: PROJ_COLOR }}>{tech}</Text>
                          </View>
                        ))}
                        {item.technologies.length > 5 && (
                          <View className="px-2 py-1 rounded-lg"
                            style={{ backgroundColor: PROJ_COLOR + '18', borderWidth: 1, borderColor: PROJ_COLOR + '30' }}>
                            <Text className="text-[10px] font-medium" style={{ color: PROJ_COLOR + '99' }}>
                              +{item.technologies.length - 5}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    {(item.liveUrl || item.repoUrl) && (
                      <View className="flex-row gap-3 mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: PROJ_COLOR + '20' }}>
                        {item.liveUrl ? (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="globe-outline" size={12} color={PROJ_COLOR + '80'} />
                            <Text className="text-[11px]" style={{ color: PROJ_COLOR + '80' }}>Live</Text>
                          </View>
                        ) : null}
                        {item.repoUrl ? (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="logo-github" size={12} color={PROJ_COLOR + '80'} />
                            <Text className="text-[11px]" style={{ color: PROJ_COLOR + '80' }}>Repo</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </AccordionSection>

      <ModalSheet
        visible={modalOpen}
        title={editItem ? 'Edit Project' : 'Add Project'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      >
        <View
          className="rounded-2xl overflow-hidden mt-4"
          style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card }}
        >
          <FormField icon="folder-outline" label="Project Title" value={title}
            onChangeText={setTitle} placeholder="e.g. ResuCraft" />
          <FormField icon="document-text-outline" label="Description (optional)" value={description}
            onChangeText={setDescription} multiline />
          <FormField icon="code-outline" label="Technologies (comma-separated)" value={technologies}
            onChangeText={setTechnologies} placeholder="React, Node.js, MongoDB" autoCapitalize="none" />
          <FormField icon="link-outline" label="Live URL (optional)" value={liveUrl}
            onChangeText={setLiveUrl} keyboardType="url" autoCapitalize="none" />
          <FormField icon="logo-github" label="Repo URL (optional)" value={repoUrl}
            onChangeText={setRepoUrl} keyboardType="url" autoCapitalize="none" />
          <FormField icon="calendar-outline" label="Start Date (optional)" value={startDate}
            onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <FormField icon="calendar-outline" label="End Date (optional)" value={endDate}
            onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" isLast />
        </View>
        <SectionLabel title="Status" />
        <View className="flex-row gap-2">
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setStatus(opt.value)}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{
                backgroundColor: status === opt.value ? opt.color + '20' : t.card,
                borderWidth: 1,
                borderColor: status === opt.value ? opt.color + '60' : t.borderSub,
              }}
            >
              <Text className="text-xs font-semibold"
                style={{ color: status === opt.value ? opt.color : t.textFaint }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ModalSheet>

      <ConfirmDeleteModal
        visible={!!deleteId}
        message="Delete this project?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
