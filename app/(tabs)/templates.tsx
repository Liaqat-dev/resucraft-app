import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  listTemplates,
  deleteTemplate,
  Template,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
} from '@/services/templateService';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const TINT = '#0a7ea4';
const H_PAD = 16;
const COL_GAP = 10;
const COLUMN_W = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const PREVIEW_H = COLUMN_W * (297 / 210); // A4 ratio

// A4 canvas at 96 dpi
const CANVAS_W = (210 * 96) / 25.4; // ≈ 794 px
const CANVAS_H = (297 * 96) / 25.4; // ≈ 1122 px

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Strip HTML tags from content (rich-text editors can produce HTML strings)
const stripHtml = (s: string) =>
  typeof s === 'string' ? s.replace(/<[^>]*>/g, '') : '';

// Flatten nested template data → absolute canvas coordinates
// (mirrors the web TemplateCard.tsx nestedToFlat logic)
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
        elements.push({
          ...el,
          x: el.x + subRest.x + sec.x,
          y: el.y + subRest.y + sec.y,
        });
      }
    }
  }

  return { elements, sections };
}

// ─── Mini Document Preview ────────────────────────────────────────────────────
//
// Renders the actual resume layout at full canvas size, then visually scales
// it down to fit the card using a CSS-like transform — same idea as Canva
// thumbnails.
//
// Why position offset?  RN's `scale` transform pivots around the element's
// center.  To make it anchor at the top-left we shift the canvas so that its
// center lands at (COLUMN_W/2, PREVIEW_H/2) before scaling.
//   left = canvasW*(scale−1)/2  (negative, pulls canvas left)
//   top  = canvasH*(scale−1)/2  (negative, pulls canvas up)
//
function MiniDocPreview({ data }: { data: any }) {
  const hasContent = data?.sections?.length || data?.elements?.length;

  if (!hasContent) {
    return (
      <View
        style={{
          width: COLUMN_W,
          height: PREVIEW_H,
          backgroundColor: '#f3f4f6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="document-text-outline" size={28} color="#9ca3af" />
        <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>No preview</Text>
      </View>
    );
  }

  const cw = data.canvasSettings?.width
    ? parseFloat(data.canvasSettings.width) * 96 / 25.4
    : CANVAS_W;
  const ch = data.canvasSettings?.height
    ? parseFloat(data.canvasSettings.height) * 96 / 25.4
    : CANVAS_H;

  const scale = COLUMN_W / cw;
  const docBg = data.canvasSettings?.background ?? '#ffffff';

  const { elements, sections } = nestedToFlat(data);

  return (
    <View
      style={{
        width: COLUMN_W,
        height: PREVIEW_H,
        overflow: 'hidden',
        backgroundColor: docBg,
      }}
    >
      {/*
        Full-size canvas anchored at top-left via transform.
        See offset formula in the component comment above.
      */}
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
        {/* ── Section backgrounds ── */}
        {sections.map((sec, i) =>
          sec.backgroundColor ? (
            <View
              key={sec.id ?? `s${i}`}
              style={{
                position: 'absolute',
                left: sec.x,
                top: sec.y,
                width: sec.width,
                height: sec.height,
                backgroundColor: sec.backgroundColor,
                borderWidth: sec.borderColor ? 1 : 0,
                borderColor: sec.borderColor ?? 'transparent',
              }}
            />
          ) : null,
        )}

        {/* ── Section titles (rendered as real text) ── */}
        {sections.map((sec, i) =>
          sec.title && sec.headerVisible !== false ? (
            <Text
              key={`sh${sec.id ?? i}`}
              numberOfLines={1}
              style={{
                position: 'absolute',
                left: sec.x + 4,
                top: sec.y + 2,
                width: sec.width - 8,
                fontSize: sec.headerFontSize ?? 18,
                fontWeight: (sec.headerFontWeight ?? '700') as any,
                color: sec.headerColor ?? '#1f2937',
                lineHeight: (sec.headerLineHeight ?? 1.2) * (sec.headerFontSize ?? 18),
              }}
            >
              {sec.title}
            </Text>
          ) : null,
        )}

        {/* ── Elements ── */}
        {elements.map((el, i) => {
          if (el.type === 'line-break') {
            const lw = el.width * ((el.lineBreakWidthPercent ?? 100) / 100);
            const lh = el.lineBreakThickness ?? 1;
            return (
              <View
                key={el.id ?? `e${i}`}
                style={{
                  position: 'absolute',
                  left: el.x + (el.width - lw) / 2,
                  top: el.y + (el.height - lh) / 2,
                  width: lw,
                  height: lh,
                  backgroundColor: el.lineBreakColor ?? '#d1d5db',
                }}
              />
            );
          }

          const fontSize = el.fontSize ?? 14;
          return (
            <Text
              key={el.id ?? `e${i}`}
              numberOfLines={0}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                fontSize,
                fontWeight: (el.fontWeight ?? 'normal') as any,
                color: el.color ?? '#000000',
                textAlign: (el.textAlign ?? 'left') as any,
                lineHeight: (el.lineHeight ?? 1.5) * fontSize,
                overflow: 'hidden',
              }}
            >
              {stripHtml(el.content ?? '')}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

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

// ─── Template Card ─────────────────────────────────────────────────────────────

interface CardProps {
  template: Template;
  isDark: boolean;
  onDelete: (id: string) => void;
}

function TemplateCard({ template, isDark, onDelete }: CardProps) {
  const labelClr = isDark ? '#f0edf8' : '#111827';
  const subClr = isDark ? '#6b6885' : '#9ca3af';

  const { elements } = nestedToFlat(template.data ?? {});
  const date = new Date(template.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
        borderWidth: 1,
        borderColor: isDark ? '#232539' : '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Live preview thumbnail */}
      <View style={{ overflow: 'hidden' }}>
        <MiniDocPreview data={template.data} />

        {/* Item count badge */}
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
            {elements.length} items
          </Text>
        </View>
      </View>

      {/* Info strip */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ fontSize: 12, fontWeight: '700', color: labelClr, marginBottom: 2 }}
          numberOfLines={1}
        >
          {template.name}
        </Text>
        <Text style={{ fontSize: 10, color: subClr, marginBottom: 8 }}>{date}</Text>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View
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
          </View>

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'All'>('All');

  const bgColor = isDark ? '#0c0e1a' : '#f5f3ee';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor = isDark ? '#5a5878' : '#a8a49e';
  const inputBg = isDark ? '#181b2a' : '#ffffff';
  const borderClr = isDark ? '#232539' : '#ede9e3';

  const fetchTemplates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setTemplates(await listTemplates());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete template');
    }
  }, []);

  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || (t.category || 'Other') === activeCategory;
    return matchSearch && matchCat;
  });

  const countFor = (cat: TemplateCategory | 'All') =>
    cat === 'All'
      ? templates.length
      : templates.filter((t) => (t.category || 'Other') === cat).length;

  const topPad = insets.top + (Platform.OS === 'android' ? 16 : 8);

  // ── Error ────────────────────────────────────────────────────────────────

  if (!loading && error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          paddingHorizontal: H_PAD,
        }}
      >
        <View
          style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: isDark ? '#1e2130' : '#fee2e2',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="cloud-offline-outline" size={32} color="#ef4444" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: labelColor, textAlign: 'center' }}>
          Could not load templates
        </Text>
        <Text style={{ fontSize: 13, color: subColor, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchTemplates()}
          style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 11, backgroundColor: TINT, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Header ───────────────────────────────────────────────────────────────

  const Header = (
    <View style={{ paddingTop: topPad }}>
      <View style={{ paddingHorizontal: H_PAD, marginBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: labelColor, letterSpacing: -0.5 }}>
          Templates
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
          {templates.length} resume template{templates.length !== 1 ? 's' : ''} saved
        </Text>

        <View
          style={{
            marginTop: 14,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: inputBg,
            borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11,
            borderWidth: 1, borderColor: borderClr,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.25 : 0.05,
            shadowRadius: 6, elevation: 2,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={16} color={subColor} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search templates…"
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

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 7, paddingBottom: 2 }}
        style={{ marginBottom: 14 }}
      >
        {(['All', ...TEMPLATE_CATEGORIES] as (TemplateCategory | 'All')[]).map((cat) => {
          const count = countFor(cat);
          if (count === 0 && cat !== 'All') return null;
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.72}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active ? TINT : 'transparent',
                borderWidth: 1.5,
                borderColor: active ? TINT : (isDark ? '#232539' : '#e0ddd8'),
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : subColor }}>
                {cat}
              </Text>
              <View style={{
                minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? 'rgba(255,255,255,0.25)' : (isDark ? '#232539' : '#e8e4de'),
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: active ? '#fff' : subColor }}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: H_PAD, marginBottom: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 10, color: TINT, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' }}>
          ✦ {activeCategory === 'All' ? 'All Templates' : activeCategory}
        </Text>
        {(search.length > 0 || activeCategory !== 'All') && (
          <Text style={{ fontSize: 12, color: subColor }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );

  // ── Loading skeletons ────────────────────────────────────────────────────

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

  // ── List ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: H_PAD, marginBottom: COL_GAP }}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTemplates(true)}
            tintColor={TINT}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: H_PAD }}>
            <View
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: isDark ? '#181b2a' : '#f0eee9',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={search ? 'search-outline' : 'document-text-outline'}
                size={30}
                color={subColor}
              />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: labelColor }}>
              {templates.length === 0 ? 'No templates yet' : 'No templates found'}
            </Text>
            <Text style={{ fontSize: 13, color: subColor, marginTop: 4, textAlign: 'center' }}>
              {templates.length === 0
                ? 'Create templates in the web builder — they will appear here'
                : search
                ? `No results for "${search}"`
                : `No templates in "${activeCategory}"`}
            </Text>
            {templates.length > 0 && (search.length > 0 || activeCategory !== 'All') && (
              <TouchableOpacity onPress={() => { setSearch(''); setActiveCategory('All'); }} style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: TINT }}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TemplateCard template={item} isDark={isDark} onDelete={handleDelete} />
        )}
      />
    </View>
  );
}
