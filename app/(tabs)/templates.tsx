import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Constants ────────────────────────────────────────────────────────────────
const TINT = '#0a7ea4';
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = {
  id: string;
  name: string;
  category: string;
  color: string;
  accentColor: string;
  premium: boolean;
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: '1', name: 'Nova',          category: 'Modern',       color: '#0a7ea4', accentColor: '#38bdf8', premium: false },
  { id: '2', name: 'Serif Classic', category: 'Classic',      color: '#92400e', accentColor: '#fcd34d', premium: false },
  { id: '3', name: 'Slate Pro',     category: 'Professional', color: '#1e3a5f', accentColor: '#7dd3fc', premium: true  },
  { id: '4', name: 'Bloom',         category: 'Creative',     color: '#7c3aed', accentColor: '#f0abfc', premium: false },
  { id: '5', name: 'Whisper',       category: 'Minimal',      color: '#374151', accentColor: '#9ca3af', premium: false },
  { id: '6', name: 'Atlas',         category: 'Modern',       color: '#065f46', accentColor: '#6ee7b7', premium: true  },
  { id: '7', name: 'Rouge',         category: 'Creative',     color: '#9f1239', accentColor: '#fca5a5', premium: false },
  { id: '8', name: 'Carbon',        category: 'Professional', color: '#111827', accentColor: '#6b7280', premium: true  },
];

const SAVED_IDS_DEFAULT = ['1', '4'];
const FEATURED_IDS = ['3', '1', '6'];
const CATEGORIES = ['All', 'Modern', 'Classic', 'Creative', 'Minimal', 'Professional'];
const LAST_USED: Record<string, string> = { '1': '2 days ago', '4': '1 week ago' };

// ─── Resume fake-line preview ─────────────────────────────────────────────────
function ResumePreview({ accentColor, compact }: { accentColor: string; compact?: boolean }) {
  const white = 'rgba(255,255,255,0.28)';
  const accent = accentColor + '88';
  const gap = compact ? 3 : 4;
  const avatarSize = compact ? 14 : 18;

  return (
    <View style={{ flex: 1, padding: compact ? 8 : 11 }}>
      {/* Header: avatar + name lines */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: compact ? 5 : 7 }}>
        <View style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: accentColor + 'cc' }} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ height: compact ? 4 : 5, width: '68%', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' }} />
          <View style={{ height: 3, width: '44%', borderRadius: 3, backgroundColor: white }} />
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: accentColor + '55', marginBottom: compact ? 5 : 7 }} />

      {/* Body lines */}
      <View style={{ gap }}>
        {(['90%', '76%', '84%', '60%', compact ? null : '78%'] as (string | null)[])
          .filter(Boolean)
          .map((w, i) => (
            <View key={i} style={{ height: 3, width: w as string, borderRadius: 2, backgroundColor: white }} />
          ))}
      </View>

      {/* Skill chips at bottom */}
      <View style={{ flexDirection: 'row', gap: compact ? 3 : 4, marginTop: 'auto', paddingTop: compact ? 4 : 6 }}>
        {([32, 42, 28, 38] as number[]).slice(0, compact ? 3 : 4).map((w, i) => (
          <View key={i} style={{ height: 5, width: w, borderRadius: 3, backgroundColor: accent }} />
        ))}
      </View>
    </View>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
interface CardProps {
  template: Template;
  large: boolean;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

function TemplateCard({ template, large, isSaved, onToggleSave }: CardProps) {
  const h = large ? 268 : 158;
  const w = large ? 210 : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={{
        width: w,
        height: h,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: template.color,
        flex: large ? undefined : 1,
      }}
    >
      {/* Depth blobs */}
      <View style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.07)' }} />
      <View style={{ position: 'absolute', bottom: -14, left: -8, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.12)' }} />

      {/* PRO badge */}
      {template.premium && (
        <View style={{ position: 'absolute', top: 9, left: 9, backgroundColor: '#fbbf24', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, zIndex: 10 }}>
          <Text style={{ fontSize: 8, fontWeight: '800', color: '#78350f', letterSpacing: 0.6 }}>PRO</Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        onPress={() => onToggleSave(template.id)}
        activeOpacity={0.7}
        style={{
          position: 'absolute', top: 9, right: 9, zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.32)',
          borderRadius: 20, width: 28, height: 28,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={13} color="#fff" />
      </TouchableOpacity>

      {/* Resume mock preview */}
      <ResumePreview accentColor={template.accentColor} compact={!large} />

      {/* Name overlay */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.38)',
        paddingHorizontal: 11, paddingVertical: large ? 9 : 7,
      }}>
        <Text style={{ color: '#fff', fontSize: large ? 14 : 12, fontWeight: '700', letterSpacing: -0.2 }}>
          {template.name}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 1 }}>
          {template.category}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── 2-Column Grid ────────────────────────────────────────────────────────────
function TwoColGrid({
  items, savedIds, onToggleSave,
}: {
  items: Template[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
}) {
  const rows: Template[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              large={false}
              isSaved={savedIds.includes(t.id)}
              onToggleSave={onToggleSave}
            />
          ))}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ text, right, subColor }: { text: string; right?: React.ReactNode; subColor: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontSize: 10, color: subColor, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' }}>
        {text}
      </Text>
      {right}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TemplatesScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [savedIds, setSavedIds] = useState<string[]>(SAVED_IDS_DEFAULT);

  const bgColor   = isDark ? '#0c0e1a' : '#f5f3ee';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor   = isDark ? '#5a5878' : '#a8a49e';
  const inputBg    = isDark ? '#181b2a' : '#ffffff';
  const borderClr  = isDark ? '#232539' : '#ede9e3';
  const chipOff    = isDark ? '#232539' : '#e8e4de';

  const toggleSave = (id: string) =>
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const featured = FEATURED_IDS.map((id) => TEMPLATES.find((t) => t.id === id)!).filter(Boolean);
  const saved    = TEMPLATES.filter((t) => savedIds.includes(t.id));

  const filteredAll = TEMPLATES.filter((t) => {
    const matchCat  = activeCategory === 'All' || t.category === activeCategory;
    const matchSrch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8),
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: labelColor, letterSpacing: -0.5 }}>
            Templates
          </Text>
          <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
            Find your perfect resume style
          </Text>

          {/* Search */}
          <View style={{
            marginTop: 14,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: inputBg,
            borderRadius: 14,
            paddingHorizontal: 12, paddingVertical: 11,
            borderWidth: 1, borderColor: borderClr,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.25 : 0.05,
            shadowRadius: 6, elevation: 2,
            gap: 8,
          }}>
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

        {/* ── Filter chips ───────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 2 }}
          style={{ marginBottom: 22 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.72}
                style={{
                  paddingHorizontal: 15, paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: active ? TINT : 'transparent',
                  borderWidth: 1.5,
                  borderColor: active ? TINT : chipOff,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : subColor }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Featured ───────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 26 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: TINT, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' }}>
              ✦ Featured
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {featured.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                large
                isSaved={savedIds.includes(t.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── My Saved ───────────────────────────────────────────────────── */}
        {saved.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 26 }}>
            <SectionLabel
              text="My Saved"
              subColor={subColor}
              right={
                <Text style={{ fontSize: 12, color: TINT, fontWeight: '600' }}>
                  {saved.length} saved
                </Text>
              }
            />
            <TwoColGrid items={saved} savedIds={savedIds} onToggleSave={toggleSave} />
            {/* Last-used dates under each card */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              {saved.map((t) => (
                <View key={t.id} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 2 }}>
                  <Ionicons name="time-outline" size={10} color={subColor} />
                  <Text style={{ fontSize: 10, color: subColor }}>{LAST_USED[t.id] ?? 'Long ago'}</Text>
                </View>
              ))}
              {saved.length % 2 !== 0 && <View style={{ flex: 1 }} />}
            </View>
          </View>
        )}

        {/* ── All Templates ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16 }}>
          <SectionLabel
            text="All Templates"
            subColor={subColor}
            right={
              <Text style={{ fontSize: 12, color: subColor }}>
                {filteredAll.length} result{filteredAll.length !== 1 ? 's' : ''}
              </Text>
            }
          />

          {filteredAll.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: isDark ? '#181b2a' : '#ede9e3',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name="search-outline" size={28} color={subColor} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: labelColor }}>No templates found</Text>
              <Text style={{ fontSize: 13, color: subColor, marginTop: 4 }}>Try a different search or filter</Text>
            </View>
          ) : (
            <TwoColGrid items={filteredAll} savedIds={savedIds} onToggleSave={toggleSave} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
