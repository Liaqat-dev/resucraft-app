import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Constants ────────────────────────────────────────────────────────────────
const TINT = '#0a7ea4';

// ─── Types ────────────────────────────────────────────────────────────────────
type ResumeStatus = 'complete' | 'draft';

type Resume = {
  id: string;
  title: string;
  template: string;
  templateColor: string;
  lastEdited: string;
  status: ResumeStatus;
  views: number;
  downloads: number;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const RESUMES_INITIAL: Resume[] = [
  {
    id: '1',
    title: 'Software Engineer Resume',
    template: 'Nova',
    templateColor: '#0a7ea4',
    lastEdited: '2 hours ago',
    status: 'complete',
    views: 124,
    downloads: 8,
  },
  {
    id: '2',
    title: 'Product Manager CV',
    template: 'Slate Pro',
    templateColor: '#1e3a5f',
    lastEdited: 'Yesterday',
    status: 'draft',
    views: 0,
    downloads: 0,
  },
  {
    id: '3',
    title: 'UX Designer Portfolio',
    template: 'Bloom',
    templateColor: '#7c3aed',
    lastEdited: '3 days ago',
    status: 'complete',
    views: 56,
    downloads: 3,
  },
  {
    id: '4',
    title: 'Marketing Lead Resume',
    template: 'Rouge',
    templateColor: '#9f1239',
    lastEdited: '1 week ago',
    status: 'complete',
    views: 89,
    downloads: 5,
  },
  {
    id: '5',
    title: 'Data Analyst CV',
    template: 'Carbon',
    templateColor: '#111827',
    lastEdited: '2 weeks ago',
    status: 'draft',
    views: 12,
    downloads: 0,
  },
];

type FilterType = 'All' | 'Complete' | 'Draft';
const FILTERS: FilterType[] = ['All', 'Complete', 'Draft'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, iconBg, isDark,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  iconBg: string;
  isDark: boolean;
}) {
  const cardBg = isDark ? '#181b2a' : '#ffffff';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor   = isDark ? '#5a5878' : '#a8a49e';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cardBg,
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: labelColor, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────────
function ResumeCard({
  resume, onDelete, isDark,
}: {
  resume: Resume;
  onDelete: (id: string) => void;
  isDark: boolean;
}) {
  const cardBg     = isDark ? '#181b2a' : '#ffffff';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor   = isDark ? '#5a5878' : '#a8a49e';
  const sepColor   = isDark ? '#232539' : '#f0ede8';

  const isComplete = resume.status === 'complete';

  const handleDelete = () =>
    Alert.alert('Delete Resume', `Delete "${resume.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(resume.id) },
    ]);

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.07,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Color accent bar */}
      <View style={{ height: 3, backgroundColor: resume.templateColor }} />

      <View style={{ padding: 16 }}>
        {/* Top row: title + status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Text
            style={{ flex: 1, fontSize: 16, fontWeight: '700', color: labelColor, letterSpacing: -0.2 }}
            numberOfLines={2}
          >
            {resume.title}
          </Text>
          <View style={{
            paddingHorizontal: 9, paddingVertical: 4,
            borderRadius: 20,
            backgroundColor: isComplete
              ? (isDark ? '#064e3b' : '#d1fae5')
              : (isDark ? '#292418' : '#fef3c7'),
          }}>
            <Text style={{
              fontSize: 10, fontWeight: '700', letterSpacing: 0.3,
              color: isComplete ? '#10b981' : '#f59e0b',
            }}>
              {isComplete ? '✓ Complete' : '✎ Draft'}
            </Text>
          </View>
        </View>

        {/* Template + last edited */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: resume.templateColor }} />
          <Text style={{ fontSize: 12, color: subColor }}>
            {resume.template}
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#3a3858' : '#d4cfc9' }}>·</Text>
          <Ionicons name="time-outline" size={11} color={subColor} />
          <Text style={{ fontSize: 12, color: subColor }}>{resume.lastEdited}</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: sepColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="eye-outline" size={13} color={subColor} />
            <Text style={{ fontSize: 12, color: subColor, fontWeight: '500' }}>{resume.views} views</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="download-outline" size={13} color={subColor} />
            <Text style={{ fontSize: 12, color: subColor, fontWeight: '500' }}>{resume.downloads} downloads</Text>
          </View>
          <View style={{ flex: 1 }} />

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert('Preview', `Previewing "${resume.title}"`)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: isDark ? '#0c0e1a' : '#f5f3ee',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="eye-outline" size={15} color={TINT} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert('Download', `Downloading "${resume.title}"…`)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: isDark ? '#0c0e1a' : '#f5f3ee',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="download-outline" size={15} color={TINT} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDelete}
              style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: isDark ? '#1a0a0a' : '#fff1f1',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ isDark, label, subColor }: { isDark: boolean; label: string; subColor: string }) {
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  return (
    <View style={{ alignItems: 'center', paddingVertical: 56 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: isDark ? '#181b2a' : '#ede9e3',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Ionicons name="document-text-outline" size={32} color={subColor} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', color: labelColor }}>No resumes yet</Text>
      <Text style={{ fontSize: 13, color: subColor, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const [resumes, setResumes] = useState<Resume[]>(RESUMES_INITIAL);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const bgColor    = isDark ? '#0c0e1a' : '#f5f3ee';
  const labelColor = isDark ? '#e8e6f0' : '#1a1714';
  const subColor   = isDark ? '#5a5878' : '#a8a49e';
  const cardBg     = isDark ? '#181b2a' : '#ffffff';
  const chipOff    = isDark ? '#232539' : '#e8e4de';
  const borderClr  = isDark ? '#232539' : '#ede9e3';

  const deleteResume = (id: string) => setResumes((prev) => prev.filter((r) => r.id !== id));

  const filtered = resumes.filter((r) => {
    if (activeFilter === 'Complete') return r.status === 'complete';
    if (activeFilter === 'Draft')    return r.status === 'draft';
    return true;
  });

  const totalViews     = resumes.reduce((sum, r) => sum + r.views, 0);
  const totalDownloads = resumes.reduce((sum, r) => sum + r.downloads, 0);
  const completeCount  = resumes.filter((r) => r.status === 'complete').length;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '700', color: labelColor, letterSpacing: -0.5 }}>
                My Resumes
              </Text>
              <Text style={{ fontSize: 14, color: subColor, marginTop: 2 }}>
                {resumes.length} resume{resumes.length !== 1 ? 's' : ''} · {completeCount} complete
              </Text>
            </View>

            {/* New resume button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('New Resume', 'Resume builder coming soon!')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: TINT,
                paddingHorizontal: 14, paddingVertical: 9,
                borderRadius: 12,
                shadowColor: TINT,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 22, flexDirection: 'row', gap: 10 }}>
          <StatCard
            icon="document-text-outline"
            value={resumes.length}
            label="Total resumes"
            iconBg={TINT}
            isDark={isDark}
          />
          <StatCard
            icon="eye-outline"
            value={totalViews}
            label="Total views"
            iconBg="#7c3aed"
            isDark={isDark}
          />
          <StatCard
            icon="download-outline"
            value={totalDownloads}
            label="Downloads"
            iconBg="#059669"
            isDark={isDark}
          />
        </View>

        {/* ── Filter chips ───────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 18, flexDirection: 'row', gap: 8 }}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            const count = f === 'All'
              ? resumes.length
              : resumes.filter((r) => r.status === f.toLowerCase()).length;

            return (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.72}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5,
                  backgroundColor: active ? TINT : 'transparent',
                  borderWidth: 1.5,
                  borderColor: active ? TINT : chipOff,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : subColor }}>
                  {f}
                </Text>
                <View style={{
                  paddingHorizontal: 5, paddingVertical: 1,
                  borderRadius: 8,
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : (isDark ? '#232539' : '#e2ddd8'),
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#fff' : subColor }}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Resume list ────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {filtered.length === 0 ? (
            <EmptyState
              isDark={isDark}
              subColor={subColor}
              label={
                activeFilter === 'Draft'
                  ? 'You have no draft resumes.'
                  : 'Start building your first resume!'
              }
            />
          ) : (
            filtered.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDelete={deleteResume}
                isDark={isDark}
              />
            ))
          )}
        </View>

        {/* ── Quick tip card ─────────────────────────────────────────────── */}
        {resumes.length > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 24 }}>
            <View style={{
              backgroundColor: isDark ? '#0d1829' : '#e0f2fe',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: isDark ? '#1e3a5f' : '#bae6fd',
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: TINT + '33', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={18} color={TINT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#7dd3fc' : '#0369a1' }}>
                  Tip: Keep resumes updated
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#4a7fa0' : '#0284c7', marginTop: 2, lineHeight: 17 }}>
                  Recruiters prefer resumes edited within the last 30 days.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
