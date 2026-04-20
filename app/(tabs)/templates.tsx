import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Previewer from '@/components/Previewer';
import {
  listTemplates,
  listAllTemplates,
  deleteTemplate,
  Template,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
} from '@/services/templateService';
import { useAuth } from '@/context/AuthContext';
import { generateResume } from '@/services/aiService';

const GOLD = '#C09A3A';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const TINT = '#0a7ea4';
const H_PAD = 16;
const COL_GAP = 10;
const COLUMN_W = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const PREVIEW_H = COLUMN_W * (297 / 210); // A4 ratio

// A4 canvas at 96 dpi
const CANVAS_W = (210 * 96) / 25.4;
const CANVAS_H = (297 * 96) / 25.4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stripHtml = (s: string) =>
  typeof s === 'string' ? s.replace(/<[^>]*>/g, '') : '';

function nestedToFlat(data: any): { elements: any[]; sections: any[] } {
  const elements: any[] = [...(data?.elements ?? [])];
  const sections: any[] = [];

  for (const sec of data?.sections ?? []) {
    const { 'sub-sections': subs, elements: secEls, direction, ...rest } = sec;
    sections.push(rest);
    for (const el of secEls ?? []) {
      elements.push({ ...el, x: el.x + sec.x, y: el.y + sec.y });
    }
    for (const sub of subs ?? []) {
      const { elements: subEls, direction: _d, ...subRest } = sub;
      sections.push({ ...subRest, x: subRest.x + sec.x, y: subRest.y + sec.y });
      for (const el of subEls ?? []) {
        elements.push({ ...el, x: el.x + subRest.x + sec.x, y: el.y + subRest.y + sec.y });
      }
    }
  }

  return { elements, sections };
}

// ─── Full-screen Preview Modal ────────────────────────────────────────────────

interface PreviewModalProps {
  template: Template | null;
  isDark: boolean;
  isOwn: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function PreviewModal({ template, isDark, isOwn, insets, onClose, onDelete }: PreviewModalProps) {
  const overlayBg = isDark ? '#0c0e1a' : '#f5f3ee';
  const headerBg = isDark ? '#141625' : '#ffffff';
  const borderClr = isDark ? '#232539' : '#e5e7eb';
  const labelClr = isDark ? '#f0edf8' : '#111827';
  const subClr = isDark ? '#6b6885' : '#9ca3af';

  const previewW = SCREEN_W - H_PAD * 2;

  const date = template
    ? new Date(template.updatedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  const handleDelete = () => {
    if (!template) return;
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { onDelete(template._id); onClose(); },
        },
      ],
    );
  };

  return (
    <Modal
      visible={!!template}
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
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: isDark ? '#1e2133' : '#f0ede8',
              alignItems: 'center', justifyContent: 'center',
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
              {template?.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: TINT + '20' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: TINT, letterSpacing: 0.4 }}>
                  {template?.category}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: subClr }}>{date}</Text>
            </View>
          </View>

          {/* Delete — only for owned templates */}
          {isOwn && (
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isDark ? '#1a0a0a' : '#fff1f1',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
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
          {template && (
            <Previewer data={template.data} width={previewW} />
          )}
        </ScrollView>

      </View>
    </Modal>
  );
}

// ─── Mini Document Preview (card thumbnail) ───────────────────────────────────

function MiniDocPreview({ data }: { data: any }) {
  const hasContent = data?.sections?.length || data?.elements?.length;

  if (!hasContent) {
    return (
      <View style={{ width: COLUMN_W, height: PREVIEW_H, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="document-text-outline" size={28} color="#9ca3af" />
        <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>No preview</Text>
      </View>
    );
  }

  const cw = data.canvasSettings?.width ? parseFloat(data.canvasSettings.width) * 96 / 25.4 : CANVAS_W;
  const ch = data.canvasSettings?.height ? parseFloat(data.canvasSettings.height) * 96 / 25.4 : CANVAS_H;
  const scale = COLUMN_W / cw;
  const docBg = data.canvasSettings?.background ?? '#ffffff';
  const { elements, sections } = nestedToFlat(data);

  return (
    <View style={{ width: COLUMN_W, height: PREVIEW_H, overflow: 'hidden', backgroundColor: docBg }}>
      <View
        style={{
          position: 'absolute',
          left: cw * (scale - 1) / 2,
          top: ch * (scale - 1) / 2,
          width: cw,
          height: ch,
          backgroundColor: docBg,
          transform: [{ scale }],
        }}
        pointerEvents="none"
      >
        {sections.map((sec, i) =>
          sec.backgroundColor ? (
            <View key={sec.id ?? `s${i}`} style={{ position: 'absolute', left: sec.x, top: sec.y, width: sec.width, height: sec.height, backgroundColor: sec.backgroundColor, borderWidth: sec.borderColor ? 1 : 0, borderColor: sec.borderColor ?? 'transparent' }} />
          ) : null,
        )}
        {sections.map((sec, i) =>
          sec.title && sec.headerVisible !== false ? (
            <Text key={`sh${sec.id ?? i}`} numberOfLines={1} style={{ position: 'absolute', left: sec.x + 4, top: sec.y + 2, width: sec.width - 8, fontSize: sec.headerFontSize ?? 18, fontWeight: (sec.headerFontWeight ?? '700') as any, color: sec.headerColor ?? '#1f2937', lineHeight: (sec.headerLineHeight ?? 1.2) * (sec.headerFontSize ?? 18) }}>
              {sec.title}
            </Text>
          ) : null,
        )}
        {elements.map((el, i) => {
          if (el.type === 'line-break') {
            const lw = el.width * ((el.lineBreakWidthPercent ?? 100) / 100);
            const lh = el.lineBreakThickness ?? 1;
            return <View key={el.id ?? `e${i}`} style={{ position: 'absolute', left: el.x + (el.width - lw) / 2, top: el.y + (el.height - lh) / 2, width: lw, height: lh, backgroundColor: el.lineBreakColor ?? '#d1d5db' }} />;
          }
          const fontSize = el.fontSize ?? 14;
          return (
            <Text key={el.id ?? `e${i}`} numberOfLines={0} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, fontSize, fontWeight: (el.fontWeight ?? 'normal') as any, color: el.color ?? '#000000', textAlign: (el.textAlign ?? 'left') as any, lineHeight: (el.lineHeight ?? 1.5) * fontSize, overflow: 'hidden' }}>
              {stripHtml(el.content ?? '')}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const shimmer = isDark ? '#282c3d' : '#e0ddd8';
  const bg = isDark ? '#141625' : '#ffffff';
  const previewBg = isDark ? '#1a1e30' : '#f0ede8';

  return (
    <View style={{ width: COLUMN_W, borderRadius: 14, overflow: 'hidden', backgroundColor: bg, borderWidth: 1, borderColor: isDark ? '#232539' : '#e5e7eb' }}>
      <View style={{ width: COLUMN_W, height: PREVIEW_H, backgroundColor: previewBg }}>
        {[0.08, 0.18, 0.30, 0.42, 0.54, 0.66, 0.76].map((pct, i) => (
          <View key={i} style={{ position: 'absolute', top: PREVIEW_H * pct, left: 10, width: `${[68, 50, 72, 42, 60, 48, 55][i]}%`, height: 3, borderRadius: 2, backgroundColor: shimmer }} />
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

// ─── Template Card ────────────────────────────────────────────────────────────

interface CardProps {
  template: Template;
  isDark: boolean;
  isOwn: boolean;
  onPreview: (template: Template) => void;
  onDelete: (id: string) => void;
  isGenerateMode?: boolean;
  onSelect?: (id: string) => void;
  isGenerating?: boolean;
}

function TemplateCard({
  template,
  isDark,
  isOwn,
  onPreview,
  onDelete,
  isGenerateMode,
  onSelect,
  isGenerating,
}: CardProps) {
  const labelClr = isDark ? '#f0edf8' : '#111827';
  const subClr = isDark ? '#6b6885' : '#9ca3af';

  const { elements } = nestedToFlat(template.data ?? {});
  const date = new Date(template.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(template._id) },
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
        borderWidth: isGenerateMode ? 2 : 1,
        borderColor: isGenerateMode
          ? (isDark ? GOLD + '60' : GOLD + '80')
          : (isDark ? '#232539' : '#e5e7eb'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Tappable thumbnail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => isGenerateMode ? onSelect?.(template._id) : onPreview(template)}
        disabled={isGenerating}
        style={{ overflow: 'hidden' }}
      >
        <MiniDocPreview data={template.data} />

        {/* Item count badge */}
        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.50)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700', letterSpacing: 0.4 }}>
            {elements.length} items
          </Text>
        </View>

        {/* Expand hint (normal mode only) */}
        {!isGenerateMode && (
          <View style={{ position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="expand-outline" size={12} color="#fff" />
          </View>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>Generating…</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info strip */}
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: labelClr, marginBottom: 2 }} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={{ fontSize: 10, color: subClr, marginBottom: 8 }}>{date}</Text>

        {isGenerateMode ? (
          /* ── Generate mode: "Use This Template" ── */
          <TouchableOpacity
            onPress={() => onSelect?.(template._id)}
            disabled={isGenerating}
            activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: isGenerating ? GOLD + '40' : GOLD, borderRadius: 8 }}
          >
            {isGenerating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="sparkles" size={12} color="#fff" />
            }
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
              {isGenerating ? 'Generating…' : 'Use This Template'}
            </Text>
          </TouchableOpacity>
        ) : isOwn ? (
          /* ── My template: Preview + Delete ── */
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => onPreview(template)}
              activeOpacity={0.75}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, backgroundColor: TINT + '18', borderRadius: 8 }}
            >
              <Ionicons name="open-outline" size={11} color={TINT} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: TINT }}>Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              style={{ paddingVertical: 7, paddingHorizontal: 11, backgroundColor: '#fee2e2', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="trash-outline" size={12} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Community template: Preview only ── */
          <TouchableOpacity
            onPress={() => onPreview(template)}
            activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, backgroundColor: TINT + '18', borderRadius: 8 }}
          >
            <Ionicons name="eye-outline" size={11} color={TINT} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: TINT }}>Preview</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Two-column grid renderer ─────────────────────────────────────────────────

function renderGrid(
  items: Template[],
  isDark: boolean,
  isOwn: boolean,
  onPreview: (t: Template) => void,
  onDelete: (id: string) => void,
  isGenerateMode: boolean,
  onSelect: (id: string) => void,
  generatingId: string | null,
) {
  const rows: Template[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows.map((row, ri) => (
    <View key={ri} style={{ flexDirection: 'row', gap: COL_GAP, paddingHorizontal: H_PAD, marginBottom: COL_GAP }}>
      {row.map((item) => (
        <TemplateCard
          key={item._id}
          template={item}
          isDark={isDark}
          isOwn={isOwn}
          onPreview={onPreview}
          onDelete={onDelete}
          isGenerateMode={isGenerateMode}
          onSelect={onSelect}
          isGenerating={generatingId === item._id}
        />
      ))}
      {row.length === 1 && <View style={{ width: COLUMN_W }} />}
    </View>
  ));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  const { jobDescription, mode } = useLocalSearchParams<{
    jobDescription?: string;
    mode?: string;
  }>();
  const isGenerateMode = mode === 'generate' && !!jobDescription;

  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [communityTemplates, setCommunityTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'All'>('All');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewIsOwn, setPreviewIsOwn] = useState(false);

  const bgColor = isDark ? '#0c0e1a' : '#f5f3ee';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor = isDark ? '#5a5878' : '#a8a49e';
  const inputBg = isDark ? '#181b2a' : '#ffffff';
  const borderClr = isDark ? '#232539' : '#ede9e3';
  const sectionLabelColor = isDark ? '#6b6885' : '#b0aca6';
  const dividerColor = isDark ? '#1e2133' : '#eae6e0';

  const fetchTemplates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [mine, all] = await Promise.all([listTemplates(), listAllTemplates()]);
      setMyTemplates(mine);
      const userId = user?._id;
      setCommunityTemplates(
        userId ? all.filter((t) => String(t.userId) !== String(userId)) : all,
      );
    } catch (e: any) {
      setError(e.message ?? 'Failed to load templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTemplate(id);
      setMyTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete template');
    }
  }, []);

  const handleSelect = useCallback(async (templateId: string) => {
    if (!jobDescription) return;
    setGeneratingId(templateId);
    try {
      await generateResume(templateId, jobDescription);
      Alert.alert(
        'Resume Generated!',
        'Your AI-tailored resume has been created. Open the web builder to review and export it.',
        [{ text: 'Done', onPress: () => { setGeneratingId(null); router.replace('/(tabs)'); } }],
      );
    } catch (e: any) {
      setGeneratingId(null);
      Alert.alert('Generation Failed', e.message ?? 'Could not generate resume. Try again.');
    }
  }, [jobDescription]);

  const openPreview = useCallback((template: Template, isOwn: boolean) => {
    setPreviewTemplate(template);
    setPreviewIsOwn(isOwn);
  }, []);

  const applyFilter = (list: Template[]) =>
    list.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || (t.category || 'Other') === activeCategory;
      return matchSearch && matchCat;
    });

  const filteredMine = applyFilter(myTemplates);
  const filteredCommunity = applyFilter(communityTemplates);
  const combined = [...myTemplates, ...communityTemplates];

  const countFor = (cat: TemplateCategory | 'All') =>
    cat === 'All'
      ? combined.length
      : combined.filter((t) => (t.category || 'Other') === cat).length;

  const topPad = insets.top + (Platform.OS === 'android' ? 16 : 8);

  // ── Error ─────────────────────────────────────────────────────────────────

  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: H_PAD }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#1e2130' : '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={32} color="#ef4444" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: labelColor, textAlign: 'center' }}>Could not load templates</Text>
        <Text style={{ fontSize: 13, color: subColor, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity onPress={() => { void fetchTemplates(); }} style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 11, backgroundColor: TINT, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────

  const Header = (
    <View style={{ paddingTop: topPad }}>
      <View style={{ paddingHorizontal: H_PAD, marginBottom: 16 }}>
        {isGenerateMode && (
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={16} color={subColor} />
            <Text style={{ fontSize: 13, color: subColor }}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 32, fontWeight: '800', color: labelColor, letterSpacing: -0.5 }}>
          {isGenerateMode ? 'Select Template' : 'Templates'}
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          {isGenerateMode
            ? 'Tap a template to generate your AI-tailored resume'
            : `${myTemplates.length} of yours · ${communityTemplates.length} from community`}
        </Text>

        {isGenerateMode && jobDescription && (
          <View style={{ marginTop: 12, backgroundColor: isDark ? GOLD + '18' : GOLD + '15', borderWidth: 1, borderColor: GOLD + '50', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Ionicons name="sparkles" size={15} color={GOLD} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: GOLD, marginBottom: 2 }}>JOB DESCRIPTION</Text>
              <Text style={{ fontSize: 12, color: labelColor, lineHeight: 18 }} numberOfLines={3}>{jobDescription}</Text>
            </View>
          </View>
        )}

        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: borderClr, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.25 : 0.05, shadowRadius: 6, elevation: 2, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color={subColor} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search templates…" placeholderTextColor={subColor} style={{ flex: 1, fontSize: 14, color: labelColor }} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={subColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 7, paddingBottom: 2 }}
        style={{ marginBottom: 14 }}>
        {(['All', ...TEMPLATE_CATEGORIES] as (TemplateCategory | 'All')[]).map((cat) => {
          const count = countFor(cat);
          if (count === 0 && cat !== 'All') return null;
          const active = activeCategory === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)} activeOpacity={0.72}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? TINT : 'transparent', borderWidth: 1.5, borderColor: active ? TINT : (isDark ? '#232539' : '#e0ddd8') }}>
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

  // ── Empty section ─────────────────────────────────────────────────────────

  const EmptySection = ({ label }: { label: string }) => (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: H_PAD }}>
      <Ionicons name="document-text-outline" size={26} color={sectionLabelColor} />
      <Text style={{ fontSize: 12, color: sectionLabelColor, marginTop: 6, textAlign: 'center' }}>{label}</Text>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      {/* Full-screen preview modal */}
      <PreviewModal
        template={previewTemplate}
        isDark={isDark}
        isOwn={previewIsOwn}
        insets={insets}
        onClose={() => setPreviewTemplate(null)}
        onDelete={(id) => {
          void handleDelete(id);
          setPreviewTemplate(null);
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { void fetchTemplates(true); }}
            tintColor={TINT}
          />
        }
      >
        {Header}

        {/* ── 1. My Templates ── */}
        <SectionRow title="My Templates" count={filteredMine.length} />
        {filteredMine.length === 0 ? (
          <EmptySection label={
            search || activeCategory !== 'All'
              ? 'No matches in your templates'
              : 'Create templates in the web builder — they will appear here'
          } />
        ) : (
          renderGrid(
            filteredMine, isDark, true,
            (t) => openPreview(t, true),
            handleDelete,
            isGenerateMode, handleSelect, generatingId,
          )
        )}

        {/* ── Divider ── */}
        <View style={{ height: 1, backgroundColor: dividerColor, marginHorizontal: H_PAD, marginVertical: 18 }} />

        {/* ── 2. All Templates (community) ── */}
        <SectionRow title="All Templates" count={filteredCommunity.length} />
        {filteredCommunity.length === 0 ? (
          <EmptySection label={
            search || activeCategory !== 'All'
              ? 'No matches in community templates'
              : 'No community templates available yet'
          } />
        ) : (
          renderGrid(
            filteredCommunity, isDark, false,
            (t) => openPreview(t, false),
            handleDelete,
            isGenerateMode, handleSelect, generatingId,
          )
        )}

        {/* Clear filters */}
        {(search.length > 0 || activeCategory !== 'All') && filteredMine.length === 0 && filteredCommunity.length === 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setActiveCategory('All'); }} style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: TINT }}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}