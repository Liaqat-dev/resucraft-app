import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useInterviewSession, SessionStatus, FeedbackData } from '@/hooks/useInterviewSession';
import { useThemeColors, GOLD } from '@/hooks/useThemeColors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: SessionStatus, isMicActive: boolean) {
  switch (status) {
    case 'connecting':
      return { text: 'Connecting to AI interviewer…', color: '#d97706' };
    case 'ready':
      return { text: 'Starting microphone…', color: '#d97706' };
    case 'interviewing':
      return {
        text: isMicActive ? 'Interview in progress — speak clearly' : 'Processing…',
        color: '#16a34a',
      };
    case 'ending':
      return { text: 'Compiling feedback…', color: '#d97706' };
    case 'done':
      return { text: 'Interview complete', color: '#16a34a' };
    case 'error':
      return { text: 'Connection error', color: '#dc2626' };
    default:
      return { text: 'Ready', color: '#94a3b8' };
  }
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const bg = score >= 8 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2';
  const color = score >= 8 ? '#15803d' : score >= 5 ? '#b45309' : '#dc2626';
  const border = score >= 8 ? '#bbf7d0' : score >= 5 ? '#fde68a' : '#fecaca';

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color }}>
        {score}
        <Text style={{ fontSize: 11, fontWeight: '400' }}>/10</Text>
      </Text>
      <Text
        style={{ fontSize: 10, fontWeight: '600', color, textAlign: 'center', marginTop: 2 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Feedback Panel ───────────────────────────────────────────────────────────

function FeedbackPanel({
  feedback,
  onClose,
}: {
  feedback: FeedbackData;
  onClose: () => void;
}) {
  const t = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 10),
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>
            Interview Feedback
          </Text>
          <Text style={{ fontSize: 13, color: t.textSub, marginTop: 3 }}>
            AI-generated performance assessment
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 8,
            backgroundColor: t.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Ionicons name="close" size={18} color={t.textSub} />
        </TouchableOpacity>
      </View>

      {/* Score grid */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <ScoreBadge label="Overall" score={feedback.overallScore} />
        <ScoreBadge label="Comm." score={feedback.communicationScore} />
        <ScoreBadge label="Technical" score={feedback.technicalScore} />
        <ScoreBadge label="Relevance" score={feedback.relevanceScore} />
      </View>

      {/* Summary */}
      <View
        style={{
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 6 }}>
          Summary
        </Text>
        <Text style={{ fontSize: 13, color: t.textSub, lineHeight: 21 }}>{feedback.summary}</Text>
      </View>

      {/* Strengths */}
      <View
        style={{
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 14,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>Strengths</Text>
        </View>
        {feedback.strengths.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 7 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#22c55e',
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <Text style={{ flex: 1, fontSize: 13, color: t.textSub, lineHeight: 20 }}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Areas to Improve */}
      <View
        style={{
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 14,
          padding: 14,
          marginBottom: 22,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Ionicons name="trending-up" size={16} color="#d97706" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>Areas to Improve</Text>
        </View>
        {feedback.improvements.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 7 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#f59e0b',
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <Text style={{ flex: 1, fontSize: 13, color: t.textSub, lineHeight: 20 }}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Done button */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.85}
        style={{
          backgroundColor: GOLD,
          borderRadius: 14,
          paddingVertical: 15,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InterviewScreen() {
  const { jobDescription } = useLocalSearchParams<{ jobDescription: string }>();
  const t = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const {
    status,
    transcript,
    feedback,
    error,
    isMicActive,
    startSession,
    endInterview,
    closeSession,
  } = useInterviewSession();

  // Auto-start when screen mounts
  useEffect(() => {
    if (jobDescription) {
      startSession(jobDescription);
    }
    return () => {
      closeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll transcript to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [transcript]);

  const handleClose = () => {
    closeSession();
    router.back();
  };

  const isActive = status === 'interviewing' || status === 'ready';
  const isConnecting = status === 'connecting' || status === 'ready';
  const label = statusLabel(status, isMicActive);
  const topPad = insets.top + (Platform.OS === 'android' ? 8 : 0);

  // ── Feedback view ────────────────────────────────────────────────────────

  if (status === 'done' && feedback) {
    return <FeedbackPanel feedback={feedback} onClose={handleClose} />;
  }

  // ── Interview view ───────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: topPad }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isConnecting ? (
            <ActivityIndicator size="small" color="#d97706" />
          ) : (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isMicActive ? '#22c55e' : t.borderSub,
              }}
            />
          )}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>
              AI Mock Interview
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: label.color, marginTop: 1 }}>
              {label.text}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClose}
          activeOpacity={0.7}
          style={{
            padding: 8,
            backgroundColor: t.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Ionicons name="close" size={18} color={t.textSub} />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View
          style={{
            margin: 12,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 13, color: '#dc2626', lineHeight: 19 }}>{error}</Text>
        </View>
      )}

      {/* Transcript */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Connecting state */}
        {transcript.length === 0 && !error && (status === 'connecting' || status === 'ready') && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 70,
              gap: 14,
            }}
          >
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={{ fontSize: 14, color: t.textSub }}>Connecting to interviewer…</Text>
          </View>
        )}

        {/* Interviewing, no messages yet */}
        {transcript.length === 0 && !error && status === 'interviewing' && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 70,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 26 }}>
              {[14, 22, 10, 18, 8].map((h, i) => (
                <View
                  key={i}
                  style={{
                    width: 5,
                    height: h,
                    backgroundColor: '#22c55e',
                    borderRadius: 3,
                    opacity: 0.9,
                  }}
                />
              ))}
            </View>
            <Text style={{ fontSize: 14, color: t.textSub, textAlign: 'center' }}>
              AI is speaking — listen for your first question
            </Text>
          </View>
        )}

        {/* Transcript messages */}
        {transcript.map((entry, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              justifyContent: entry.speaker === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
            }}
          >
            {/* AI avatar */}
            {entry.speaker === 'ai' && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: GOLD + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  marginTop: 2,
                  flexShrink: 0,
                }}
              >
                <Ionicons name="sparkles" size={13} color={GOLD} />
              </View>
            )}

            <View
              style={{
                maxWidth: '78%',
                backgroundColor: entry.speaker === 'ai' ? t.card : GOLD,
                borderRadius: 18,
                borderTopLeftRadius: entry.speaker === 'ai' ? 4 : 18,
                borderTopRightRadius: entry.speaker === 'user' ? 4 : 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: entry.speaker === 'ai' ? 1 : 0,
                borderColor: t.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: entry.speaker === 'ai' ? t.text : '#fff',
                  lineHeight: 21,
                }}
              >
                {entry.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Ending state */}
        {status === 'ending' && (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
            <ActivityIndicator size="small" color="#d97706" />
            <Text style={{ fontSize: 13, color: '#d97706' }}>Generating your feedback…</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        {/* Mic indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={isMicActive ? 'mic' : 'mic-off'}
            size={16}
            color={isMicActive ? '#22c55e' : t.iconMuted}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: isMicActive ? '600' : '400',
              color: isMicActive ? '#16a34a' : t.textMuted,
            }}
          >
            {isMicActive ? 'Mic active' : 'Mic off'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isActive && (
            <TouchableOpacity
              onPress={endInterview}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                backgroundColor: '#ef4444',
                borderRadius: 11,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="call" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                End Interview
              </Text>
            </TouchableOpacity>
          )}

          {(status === 'error' || (status === 'done' && !feedback)) && (
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.85}
              style={{
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 11,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: t.text, fontWeight: '600', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
