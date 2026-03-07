import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  Certificate,
  getCertificates, createCertificate, updateCertificate, deleteCertificate,
} from '@/services/resumeService';
import AccordionSection from '@/components/ui/AccordionSection';
import ModalSheet from '@/components/ui/ModalSheet';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import CardActions from '@/components/ui/CardActions';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { GOLD, useThemeColors } from '@/hooks/useThemeColors';

const CERT_COLOR = '#fbbf24';

export default function CertificatesSection() {
  const t = useThemeColors();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Certificate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      setItems(await getCertificates());
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
    setName(''); setIssuer(''); setIssueDate('');
    setExpiryDate(''); setCredentialId(''); setCredentialUrl(''); setDescription('');
    setModalOpen(true);
  };

  const openEdit = (item: Certificate) => {
    setEditItem(item);
    setName(item.name ?? '');
    setIssuer(item.issuer ?? '');
    setIssueDate(item.issueDate?.slice(0, 10) ?? '');
    setExpiryDate(item.expiryDate?.slice(0, 10) ?? '');
    setCredentialId(item.credentialId ?? '');
    setCredentialUrl(item.credentialUrl ?? '');
    setDescription(item.description ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !issuer.trim() || !issueDate.trim()) {
      Alert.alert('Required', 'Name, issuer, and issue date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), issuer: issuer.trim(),
        issueDate: issueDate.trim(),
        expiryDate: expiryDate.trim() || undefined,
        credentialId: credentialId.trim() || undefined,
        credentialUrl: credentialUrl.trim() || undefined,
        description: description.trim() || undefined,
      };
      if (editItem) {
        const updated = await updateCertificate(editItem._id, payload);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      } else {
        const created = await createCertificate(payload);
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
      await deleteCertificate(deleteId);
      setItems(prev => prev.filter(i => i._id !== deleteId));
      setDeleteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      <AccordionSection
        icon="ribbon-outline" iconColor={CERT_COLOR} iconBg={CERT_COLOR + '20'}
        title="Certificates" count={items.length}
        isOpen={open} onToggle={handleToggle} onAdd={openAdd} loading={loading}
      >
        {loading ? (
          <View className="py-8 items-center"><ActivityIndicator color={GOLD} /></View>
        ) : items.length === 0 ? (
          <EmptyState icon="ribbon-outline" message="No certificates added yet." onAdd={openAdd} />
        ) : (
          <View className="px-3 pb-3 pt-2">
            {items.map((item) => (
              <View key={item._id} className="mb-3 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: t.cardInner,
                  borderWidth: 1, borderColor: t.borderSub,
                  borderLeftWidth: 3, borderLeftColor: CERT_COLOR,
                }}>
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: CERT_COLOR + '20' }}>
                        <Ionicons name="ribbon" size={19} color={CERT_COLOR} />
                      </View>
                      <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ backgroundColor: CERT_COLOR + '18', borderWidth: 1, borderColor: CERT_COLOR + '35' }}>
                        <Ionicons name="checkmark-circle" size={11} color={CERT_COLOR} />
                        <Text className="text-[10px] font-bold" style={{ color: CERT_COLOR }}>CERTIFIED</Text>
                      </View>
                    </View>
                    <CardActions onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item._id)} />
                  </View>
                  <Text className="font-bold text-[15px] leading-5" style={{ color: t.text }}>{item.name}</Text>
                  <View className="flex-row items-center gap-1.5 mt-1.5">
                    <Ionicons name="business-outline" size={12} color={CERT_COLOR} />
                    <Text className="text-sm font-medium" style={{ color: CERT_COLOR }}>{item.issuer}</Text>
                  </View>
                  <View className="flex-row gap-2 mt-3">
                    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: CERT_COLOR + '15', borderWidth: 1, borderColor: CERT_COLOR + '30' }}>
                      <Ionicons name="calendar-outline" size={11} color={CERT_COLOR + '99'} />
                      <Text className="text-[11px] font-medium" style={{ color: CERT_COLOR + 'aa' }}>
                        {item.issueDate?.slice(0, 7) ?? '—'}
                      </Text>
                    </View>
                    {item.expiryDate && (
                      <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                        style={{ backgroundColor: CERT_COLOR + '15', borderWidth: 1, borderColor: CERT_COLOR + '30' }}>
                        <Ionicons name="hourglass-outline" size={11} color={CERT_COLOR + '80'} />
                        <Text className="text-[11px] font-medium" style={{ color: CERT_COLOR + '99' }}>
                          {item.expiryDate.slice(0, 7)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.credentialId ? (
                    <View className="flex-row items-center gap-1.5 mt-2.5 pt-2.5"
                      style={{ borderTopWidth: 1, borderTopColor: CERT_COLOR + '20' }}>
                      <Ionicons name="key-outline" size={11} color={CERT_COLOR + '80'} />
                      <Text className="text-[11px]" style={{ color: CERT_COLOR + '99', fontVariant: ['tabular-nums'] }}>
                        {item.credentialId}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </AccordionSection>

      <ModalSheet
        visible={modalOpen}
        title={editItem ? 'Edit Certificate' : 'Add Certificate'}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      >
        <View
          className="rounded-2xl overflow-hidden mt-4"
          style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.card }}
        >
          <FormField icon="ribbon-outline" label="Certificate Name" value={name}
            onChangeText={setName} placeholder="e.g. AWS Solutions Architect" />
          <FormField icon="business-outline" label="Issuing Organization" value={issuer}
            onChangeText={setIssuer} placeholder="e.g. Amazon Web Services" />
          <FormField icon="calendar-outline" label="Issue Date" value={issueDate}
            onChangeText={setIssueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <FormField icon="calendar-outline" label="Expiry Date (optional)" value={expiryDate}
            onChangeText={setExpiryDate} placeholder="YYYY-MM-DD or leave blank" autoCapitalize="none" />
          <FormField icon="key-outline" label="Credential ID (optional)" value={credentialId}
            onChangeText={setCredentialId} autoCapitalize="none" />
          <FormField icon="link-outline" label="Credential URL (optional)" value={credentialUrl}
            onChangeText={setCredentialUrl} keyboardType="url" autoCapitalize="none" />
          <FormField icon="document-text-outline" label="Description (optional)" value={description}
            onChangeText={setDescription} multiline isLast />
        </View>
      </ModalSheet>

      <ConfirmDeleteModal
        visible={!!deleteId}
        message="Delete this certificate?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
