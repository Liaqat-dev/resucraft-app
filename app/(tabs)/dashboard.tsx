import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Previewer from '@/components/Previewer';
import {
  listGeneratedResumes,
  deleteGeneratedResume,
  GeneratedResume,
  ResumeCategory,
} from '@/services/resumeService';

// ─── Layout constants (mirrors templates.tsx) ─────────────────────────────────

const GOLD = '#C09A3A';
const TINT = '#0a7ea4';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const COL_GAP = 10;
const COLUMN_W = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const PREVIEW_H = COLUMN_W * (297 / 210); // A4 ratio

const RESUME_CATEGORIES: ResumeCategory[] = [
  'Modern', 'Classic', 'Creative', 'Minimal', 'Professional', 'Other',
];

// ─── Full-screen Preview Modal ────────────────────────────────────────────────

interface PreviewModalProps {
  resume: GeneratedResume | null;
  isDark: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function PreviewModal({ resume, isDark, insets, onClose, onDelete }: PreviewModalProps) {
  const overlayBg = isDark ? '#0c0e1a' : '#f5f3ee';
  const headerBg = isDark ? '#141625' : '#ffffff';
  const borderClr = isDark ? '#232539' : '#e5e7eb';
  const labelClr = isDark ? '#f0edf8' : '#111827';
  const subClr = isDark ? '#6b6885' : '#9ca3af';

  // Preview fills the screen width minus padding
  const previewW = SCREEN_W - H_PAD * 2;

  const handleDelete = () => {
    if (!resume) return;
    Alert.alert(
      'Delete Resume',
      `Delete "${resume.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(resume._id);
            onClose();
          },
        },
      ],
    );
  };

  const date = resume
    ? new Date(resume.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Modal
      visible={!!resume}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={headerBg}
      />
      <View style={{ flex: 1, backgroundColor: overlayBg }}>

        {/* ── Header bar ── */}
        <View
          style={{
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 6),
            paddingBottom: 12,
            paddingHorizontal: H_PAD,
            backgroundColor: headerBg,
            borderBottomWidth: 1,
            borderBottomColor: borderClr,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? '#1e2133' : '#f0ede8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={20} color={labelClr} />
          </TouchableOpacity>

          {/* Title */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: labelClr, letterSpacing: -0.2 }}
              numberOfLines={1}
            >
              {resume?.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: TINT + '20',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: TINT, letterSpacing: 0.4 }}>
                  {resume?.category}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: subClr }}>{date}</Text>
            </View>
          </View>

          {/* Print / Web preview */}
          <TouchableOpacity
            onPress={() => {
              if (resume) {
                void Linking.openURL(`https://resucraft-client.vercel.app/preview/${resume._id}`);
              }
            }}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? '#0e1a1f' : '#e8f5fb',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="print-outline" size={18} color={TINT} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? '#1a0a0a' : '#fff1f1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable preview ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: H_PAD,
            paddingTop: 20,
            paddingBottom: insets.bottom + 32,
            alignItems: 'center',
          }}
          bounces
        >
          {resume && (
            <Previewer data={resume.data} width={previewW} />
          )}
        </ScrollView>

      </View>
    </Modal>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const shimmer = isDark ? '#282c3d' : '#e0ddd8';
  const bg = isDark ? '#141625' : '#ffffff';
  const previewBg = isDark ? '#1a1e30' : '#f0ede8';

  return (
    <View
      style={{
        width: COLUMN_W,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: isDark ? '#232539' : '#e5e7eb',
      }}
    >
      <View style={{ width: COLUMN_W, height: PREVIEW_H, backgroundColor: previewBg }}>
        {[0.08, 0.18, 0.30, 0.42, 0.54, 0.66, 0.76].map((pct, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: PREVIEW_H * pct,
              left: 10,
              width: `${[68, 50, 72, 42, 60, 48, 55][i]}%`,
              height: 3,
              borderRadius: 2,
              backgroundColor: shimmer,
            }}
          />
        ))}
      </View>
      <View style={{ padding: 10, gap: 7 }}>
        <View style={{ height: 9, width: '58%', borderRadius: 5, backgroundColor: shimmer }} />
        <View style={{ height: 7, width: '36%', borderRadius: 4, backgroundColor: shimmer }} />
        <View style={{ height: 30, borderRadius: 8, backgroundColor: shimmer, marginTop: 2 }} />
      </View>
    </View>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

interface CardProps {
  resume: GeneratedResume;
  isDark: boolean;
  onOpen: (resume: GeneratedResume) => void;
  onDelete: (id: string) => void;
}

function ResumeCard({ resume, isDark, onOpen, onDelete }: CardProps) {
  const labelClr = isDark ? '#f0edf8' : '#111827';
  const subClr = isDark ? '#6b6885' : '#9ca3af';

  const date = new Date(resume.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hasContent =
    (resume.data?.sections?.length ?? 0) > 0 ||
    (resume.data?.elements?.length ?? 0) > 0;

  const handleDelete = () => {
    Alert.alert(
      'Delete Resume',
      `Delete "${resume.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(resume._id) },
      ],
    );
  };

  return (
    <View
      style={{
        width: COLUMN_W,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: isDark ? '#141625' : '#ffffff',
        borderWidth: 1,
        borderColor: isDark ? '#232539' : '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Tappable preview thumbnail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onOpen(resume)}
        style={{ width: COLUMN_W, height: PREVIEW_H, overflow: 'hidden' }}
      >
        {hasContent ? (
          <View pointerEvents="none">
            <Previewer data={resume.data} width={COLUMN_W} />
          </View>
        ) : (
          <View
            style={{
              width: COLUMN_W,
              height: PREVIEW_H,
              backgroundColor: isDark ? '#1a1e30' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="document-text-outline" size={28} color="#9ca3af" />
            <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>No preview</Text>
          </View>
        )}

        {/* Category badge */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.50)',
            borderRadius: 20,
            paddingHorizontal: 7,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700', letterSpacing: 0.4 }}>
            {resume.category}
          </Text>
        </View>

        {/* Expand hint */}
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="expand-outline" size={12} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Info strip */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ fontSize: 12, fontWeight: '700', color: labelClr, marginBottom: 2 }}
          numberOfLines={1}
        >
          {resume.name}
        </Text>
        <Text style={{ fontSize: 10, color: subClr, marginBottom: 8 }}>{date}</Text>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => onOpen(resume)}
            activeOpacity={0.75}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 7,
              backgroundColor: TINT + '18',
              borderRadius: 8,
            }}
          >
            <Ionicons name="open-outline" size={11} color={TINT} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: TINT }}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.7}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 11,
              backgroundColor: '#fee2e2',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={12} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Two-column grid ──────────────────────────────────────────────────────────

function renderGrid(
  items: GeneratedResume[],
  isDark: boolean,
  onOpen: (resume: GeneratedResume) => void,
  onDelete: (id: string) => void,
) {
  const rows: GeneratedResume[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows.map((row, ri) => (
    <View key={ri} style={{ flexDirection: 'row', gap: COL_GAP, paddingHorizontal: H_PAD, marginBottom: COL_GAP }}>
      {row.map((item) => (
        <ResumeCard key={item._id} resume={item} isDark={isDark} onOpen={onOpen} onDelete={onDelete} />
      ))}
      {row.length === 1 && <View style={{ width: COLUMN_W }} />}
    </View>
  ));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResumesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResumeCategory | 'All'>('All');
  const [previewResume, setPreviewResume] = useState<GeneratedResume | null>(null);

  const bgColor = isDark ? '#0c0e1a' : '#f5f3ee';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor = isDark ? '#5a5878' : '#a8a49e';
  const inputBg = isDark ? '#181b2a' : '#ffffff';
  const borderClr = isDark ? '#232539' : '#ede9e3';
  const sectionLabelColor = isDark ? '#6b6885' : '#b0aca6';
  const dividerColor = isDark ? '#1e2133' : '#eae6e0';

  const fetchResumes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listGeneratedResumes();
      setResumes(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load resumes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteGeneratedResume(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete resume');
    }
  }, []);

  const applyFilter = (list: GeneratedResume[]) =>
    list.filter((r) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || (r.category || 'Other') === activeCategory;
      return matchSearch && matchCat;
    });

  const filtered = applyFilter(resumes);

  const countFor = (cat: ResumeCategory | 'All') =>
    cat === 'All'
      ? resumes.length
      : resumes.filter((r) => (r.category || 'Other') === cat).length;

  const topPad = insets.top + (Platform.OS === 'android' ? 16 : 8);

  // ── Error state ───────────────────────────────────────────────────────────

  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: H_PAD }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#1e2130' : '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={32} color="#ef4444" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: labelColor, textAlign: 'center' }}>Could not load resumes</Text>
        <Text style={{ fontSize: 13, color: subColor, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity onPress={() => fetchResumes()} style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 11, backgroundColor: TINT, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────

  const Header = (
    <View style={{ paddingTop: topPad }}>
      <View style={{ paddingHorizontal: H_PAD, marginBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: labelColor, letterSpacing: -0.5 }}>
          My Resumes
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          {resumes.length} resume{resumes.length !== 1 ? 's' : ''} generated by AI
        </Text>

        {/* Search bar */}
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: borderClr, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.25 : 0.05, shadowRadius: 6, elevation: 2, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color={subColor} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resumes…"
            placeholderTextColor={subColor}
            style={{ flex: 1, fontSize: 14, color: labelColor }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={subColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 7, paddingBottom: 2 }}
        style={{ marginBottom: 14 }}
      >
        {(['All', ...RESUME_CATEGORIES] as (ResumeCategory | 'All')[]).map((cat) => {
          const count = countFor(cat);
          if (count === 0 && cat !== 'All') return null;
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.72}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active ? TINT : 'transparent',
                borderWidth: 1.5,
                borderColor: active ? TINT : (isDark ? '#232539' : '#e0ddd8'),
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : subColor }}>{cat}</Text>
              <View style={{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? 'rgba(255,255,255,0.25)' : (isDark ? '#232539' : '#e8e4de') }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: active ? '#fff' : subColor }}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Loading skeletons ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {Header}
        <View style={{ flexDirection: 'row', gap: COL_GAP, paddingHorizontal: H_PAD }}>
          <SkeletonCard isDark={isDark} />
          <SkeletonCard isDark={isDark} />
        </View>
      </View>
    );
  }

  // ── Section label ─────────────────────────────────────────────────────────

  const SectionRow = ({ title, count }: { title: string; count: number }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD, marginBottom: 10, gap: 8 }}>
      <Text style={{ fontSize: 10, color: TINT, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' }}>
        ✦ {title}
      </Text>
      <View style={{ height: 1, flex: 1, backgroundColor: dividerColor }} />
      <Text style={{ fontSize: 10, color: sectionLabelColor, fontWeight: '600' }}>{count}</Text>
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────

  const EmptySection = ({ label }: { label: string }) => (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: H_PAD }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#181b2a' : '#ede9e3', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Ionicons name="document-text-outline" size={32} color={sectionLabelColor} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: labelColor }}>No resumes found</Text>
      <Text style={{ fontSize: 13, color: subColor, marginTop: 4, textAlign: 'center', maxWidth: 260, lineHeight: 19 }}>
        {label}
      </Text>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Full-screen preview modal */}
      <PreviewModal
        resume={previewResume}
        isDark={isDark}
        insets={insets}
        onClose={() => setPreviewResume(null)}
        onDelete={(id) => {
          handleDelete(id);
          setPreviewResume(null);
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { void fetchResumes(true); }}
            tintColor={TINT}
          />
        }
      >
        {Header}

        <SectionRow title="Generated Resumes" count={filtered.length} />

        {filtered.length === 0 ? (
          <EmptySection
            label={
              search || activeCategory !== 'All'
                ? 'No resumes match your search or filter'
                : 'Use the Home tab to generate your first AI-tailored resume'
            }
          />
        ) : (
          renderGrid(filtered, isDark, setPreviewResume, handleDelete)
        )}

        {/* Clear filters */}
        {(search.length > 0 || activeCategory !== 'All') && filtered.length === 0 && (
          <TouchableOpacity
            onPress={() => { setSearch(''); setActiveCategory('All'); }}
            style={{ alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: TINT }}>Clear filters</Text>
          </TouchableOpacity>
        )}

        {/* Info tip */}
        {resumes.length > 0 && filtered.length > 0 && (
          <View style={{ marginHorizontal: H_PAD, marginTop: 24 }}>
            <View
              style={{
                backgroundColor: isDark ? GOLD + '12' : GOLD + '15',
                borderRadius: 16,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderWidth: 1,
                borderColor: GOLD + '40',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: GOLD + '25', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sparkles-outline" size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? GOLD : '#92700a' }}>
                  AI-Generated Resumes
                </Text>
                <Text style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 17 }}>
                  Open the web builder to edit or export as PDF.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}