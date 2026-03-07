import React, { useRef, useState, useCallback } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD        = '#C09A3A';
const GOLD_LIGHT  = '#D4B06A';
const GOLD_BG     = '#C09A3A16';
const GOLD_BORDER = '#C09A3A44';
const BG          = '#080E1A';
const SURFACE     = '#0C1220';
const CARD        = '#111827';
const CARD2       = '#161F2E';
const BORDER      = '#1e293b';
const BORDER_MED  = '#2d3d52';
const TEXT        = '#f1f5f9';
const TEXT_MUTED  = '#94a3b8';
const TEXT_DIM    = '#4e6278';
const SERIF       = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const NAV_H       = 72; // approximate bottom nav height (excl. safe area)

// ── Reusable primitives ────────────────────────────────────────────────────────

function Badge({ label, icon }: { label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 100,
        backgroundColor: GOLD_BG,
        borderWidth: 1,
        borderColor: GOLD_BORDER,
        marginBottom: 22,
      }}
    >
      {icon && <Ionicons name={icon} size={11} color={GOLD} />}
      <Text
        style={{
          color: GOLD,
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function GoldDot() {
  return <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginTop: 1, flexShrink: 0 }} />;
}

// ── Slide props type ───────────────────────────────────────────────────────────
type SlideProps = { w: number; h: number; top: number; bottom: number };

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 0 — Hero / Welcome
// ══════════════════════════════════════════════════════════════════════════════
function HeroSlide({ w, h, top, bottom }: SlideProps) {
  return (
    <View style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Ambient radial glow */}
      <View
        style={{
          position: 'absolute',
          width: w * 1.1,
          height: w * 1.1,
          borderRadius: (w * 1.1) / 2,
          backgroundColor: GOLD,
          opacity: 0.055,
          top: h * 0.05,
          alignSelf: 'center',
        }}
      />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: top + 12,
          paddingBottom: NAV_H + bottom + 20,
        }}
      >
        {/* Brand icon with halo rings */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {/* Outer ring */}
          <View
            style={{
              position: 'absolute',
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 1,
              borderColor: GOLD_BORDER,
              opacity: 0.5,
            }}
          />
          {/* Mid ring */}
          <View
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: GOLD_BORDER,
              opacity: 0.7,
            }}
          />
          {/* Icon box */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: GOLD_BG,
              borderWidth: 1.5,
              borderColor: GOLD_BORDER,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="document-text" size={34} color={GOLD} />
          </View>
        </View>

        {/* Brand wordmark */}
        <Text
          style={{
            color: TEXT_DIM,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          ResuCraft
        </Text>

        <Badge label="AI-Powered · Free to Start" icon="flash" />

        {/* Headline */}
        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 42,
            fontWeight: '600',
            color: TEXT,
            textAlign: 'center',
            lineHeight: 50,
            letterSpacing: -0.8,
          }}
        >
          Build a Resume{'\n'}That{' '}
          <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>Gets You Hired</Text>
        </Text>

        {/* Sub */}
        <Text
          style={{
            color: TEXT_MUTED,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 22,
            marginTop: 18,
            maxWidth: 290,
          }}
        >
          AI + NLP transforms your profile into a perfectly tailored, ATS-optimised resume — in under 60 seconds.
        </Text>

        {/* Trust row */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: 18,
            rowGap: 8,
            marginTop: 32,
          }}
        >
          {['No credit card', 'Free PDF export', 'ATS-friendly'].map((t) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700' }}>✓</Text>
              <Text style={{ color: TEXT_DIM, fontSize: 12, fontWeight: '500' }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — AI Resume Generation
// ══════════════════════════════════════════════════════════════════════════════
function AISlide({ w, h, top, bottom }: SlideProps) {
  const bullets: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
    { icon: 'scan-outline',   text: 'Parses job descriptions with NLP to extract key skills & keywords' },
    { icon: 'create-outline', text: 'Rewrites your bullets into achievement-focused statements per role' },
    { icon: 'flash-outline',  text: 'Delivers a complete, polished resume in under 60 seconds' },
  ];

  return (
    <View style={{ width: w, height: h, backgroundColor: SURFACE }}>
      {/* Top visual band */}
      <View
        style={{
          height: h * 0.38,
          backgroundColor: CARD,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        {/* Background glow */}
        <View
          style={{
            position: 'absolute',
            width: w * 1.3,
            height: w * 1.3,
            borderRadius: (w * 1.3) / 2,
            backgroundColor: GOLD,
            opacity: 0.05,
            bottom: -(w * 0.65),
          }}
        />

        {/* Slide number */}
        <View
          style={{
            position: 'absolute',
            top: top + 14,
            left: 20,
            backgroundColor: CARD2,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: BORDER_MED,
          }}
        >
          <Text style={{ color: TEXT_DIM, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>01 / 04</Text>
        </View>

        {/* AI badge */}
        <View
          style={{
            position: 'absolute',
            top: top + 14,
            right: 20,
            backgroundColor: GOLD,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>AI</Text>
        </View>

        {/* Large icon */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            backgroundColor: GOLD_BG,
            borderWidth: 1.5,
            borderColor: GOLD_BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={44} color={GOLD} />
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 26,
          paddingBottom: NAV_H + bottom + 12,
        }}
      >
        <Badge label="AI Generation" icon="sparkles" />

        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: '600',
            color: TEXT,
            lineHeight: 40,
            letterSpacing: -0.4,
            marginBottom: 8,
          }}
        >
          Resume Writing,{'\n'}
          <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>Reinvented</Text>
        </Text>

        <Text style={{ color: TEXT_DIM, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
          Paste any job description and our NLP engine instantly tailors your resume to match.
        </Text>

        <View style={{ gap: 10 }}>
          {bullets.map((b) => (
            <View
              key={b.text}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: CARD,
                borderRadius: 13,
                padding: 13,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: GOLD_BG,
                  borderWidth: 1,
                  borderColor: GOLD_BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ionicons name={b.icon} size={17} color={GOLD} />
              </View>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 17, flex: 1 }}>{b.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Templates & ATS
// ══════════════════════════════════════════════════════════════════════════════
function DesignSlide({ w, h, top, bottom }: SlideProps) {
  const tags = ['Drag & drop', 'Custom themes', 'PDF export', 'ATS-safe', 'Instant preview'];

  return (
    <View style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Mock template preview */}
      <View
        style={{
          height: h * 0.42,
          paddingTop: top + 20,
          paddingHorizontal: 28,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 16,
        }}
      >
        {/* Slide counter */}
        <View
          style={{
            position: 'absolute',
            top: top + 14,
            left: 20,
            backgroundColor: CARD,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: BORDER_MED,
          }}
        >
          <Text style={{ color: TEXT_DIM, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>02 / 04</Text>
        </View>

        {/* Template card mockup */}
        <View
          style={{
            width: w - 56,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 18,
            shadowColor: GOLD,
            shadowOpacity: 0.18,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          }}
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${GOLD}28` }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 9, backgroundColor: '#1e293b', borderRadius: 4, marginBottom: 6, width: '65%' }} />
              <View style={{ height: 6, backgroundColor: '#94a3b8', borderRadius: 3, width: '48%' }} />
            </View>
            {/* ATS score badge */}
            <View
              style={{
                backgroundColor: '#dcfce7',
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 9,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#15803d', fontSize: 9, fontWeight: '800' }}>ATS</Text>
              <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '900' }}>94%</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 13 }} />
          {/* Mock sections */}
          {[{ w: '35%' }, { w: '90%' }, { w: '75%' }, { w: '28%' }, { w: '80%' }, { w: '60%' }].map((row, i) => (
            <View
              key={i}
              style={{
                height: i % 3 === 0 ? 7 : 5,
                backgroundColor: i % 3 === 0 ? `${GOLD}50` : '#e2e8f0',
                borderRadius: 3,
                marginBottom: 6,
                width: row.w,
              }}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingBottom: NAV_H + bottom + 12,
          paddingTop: 4,
        }}
      >
        <Badge label="Design & ATS" icon="layers-outline" />

        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: '600',
            color: TEXT,
            lineHeight: 40,
            letterSpacing: -0.4,
            marginBottom: 10,
          }}
        >
          50+ Templates.{'\n'}
          <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>ATS-Optimised.</Text>
        </Text>

        <Text style={{ color: TEXT_DIM, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
          Drag-and-drop builder with professionally designed templates. Every layout is ATS-safe and industry-tested.
        </Text>

        {/* Tag pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: CARD,
                borderWidth: 1,
                borderColor: BORDER_MED,
              }}
            >
              <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600' }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Interview Prep
// ══════════════════════════════════════════════════════════════════════════════
function InterviewSlide({ w, h, top, bottom }: SlideProps) {
  const cards = [
    { type: 'Technical',  color: '#3b82f620', tColor: '#60a5fa', q: 'Walk me through your experience with React and state management patterns.' },
    { type: 'Behavioral', color: '#8b5cf620', tColor: '#a78bfa', q: 'Describe a time you handled a high-pressure deadline under resource constraints.' },
    { type: 'Scenario',   color: `${GOLD}18`,  tColor: GOLD,     q: 'How would you approach diagnosing a sudden 40% drop in application performance?' },
  ];

  return (
    <View style={{ width: w, height: h, backgroundColor: SURFACE }}>
      {/* Question cards stack */}
      <View
        style={{
          height: h * 0.42,
          paddingTop: top + 20,
          paddingHorizontal: 28,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 12,
          position: 'relative',
        }}
      >
        {/* Slide counter */}
        <View
          style={{
            position: 'absolute',
            top: top + 14,
            left: 20,
            backgroundColor: CARD,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: BORDER_MED,
          }}
        >
          <Text style={{ color: TEXT_DIM, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>03 / 04</Text>
        </View>

        {/* Stacked cards */}
        {cards.map((card, i) => (
          <View
            key={card.type}
            style={{
              position: i === 0 ? 'relative' : 'absolute',
              bottom: i === 0 ? undefined : 12 + i * 14,
              width: w - 56 - i * 16,
              backgroundColor: CARD,
              borderRadius: 13,
              padding: 14,
              borderWidth: 1,
              borderColor: BORDER,
              zIndex: cards.length - i,
              transform: [{ rotate: i === 0 ? '0deg' : i % 2 === 0 ? `${i * 0.8}deg` : `-${i * 0.8}deg` }],
              opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <View
                style={{
                  backgroundColor: card.color,
                  borderRadius: 7,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: card.tColor, fontSize: 10, fontWeight: '700' }}>{card.type}</Text>
              </View>
            </View>
            {i === 0 && (
              <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18 }}>{card.q}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingBottom: NAV_H + bottom + 12,
          paddingTop: 8,
        }}
      >
        <Badge label="Interview Prep" icon="chatbubble-ellipses-outline" />

        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: '600',
            color: TEXT,
            lineHeight: 40,
            letterSpacing: -0.4,
            marginBottom: 10,
          }}
        >
          Walk In{'\n'}
          <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>Confident</Text>
        </Text>

        <Text style={{ color: TEXT_DIM, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
          Auto-generated questions tailored to your target role — technical, behavioral, and scenario-based.
        </Text>

        <View style={{ gap: 11 }}>
          {[
            'Technical questions matched to your exact tech stack',
            'Behavioral STAR-method prompts for soft-skill interviews',
            'Scenario-based situational questions per industry',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <GoldDot />
              <Text style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 19, flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Social Proof + CTA
// ══════════════════════════════════════════════════════════════════════════════
function CTASlide({ w, h, top, bottom, router }: SlideProps & { router: ReturnType<typeof useRouter> }) {
  const stats = [
    { value: '10K+', label: 'Resumes built' },
    { value: '60%',  label: 'Better ATS score' },
    { value: '50+',  label: 'Templates' },
    { value: 'Free', label: 'Always & forever' },
  ];

  return (
    <View style={{ width: w, height: h, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: top + 28,
          paddingBottom: NAV_H + bottom + 20,
          paddingHorizontal: 24,
        }}
      >
        {/* Stars */}
        {/*<View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 18 }}>*/}
        {/*  {[1, 2, 3, 4, 5].map((i) => (*/}
        {/*    <Ionicons key={i} name="star" size={20} color={GOLD} />*/}
        {/*  ))}*/}
        {/*</View>*/}

        {/* Headline */}
        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 34,
            fontWeight: '600',
            color: TEXT,
            textAlign: 'center',
            lineHeight: 42,
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          Loved by{' '}
          <Text style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>10,000+</Text>
          {'\n'}Professionals
        </Text>

        <Text
          style={{
            color: TEXT_DIM,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 20,
          }}
        >
          Real people. Real jobs. Real results.
        </Text>

        {/* Stats grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            backgroundColor: CARD,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BORDER,
            overflow: 'hidden',
            marginBottom: 18,
          }}
        >
          {stats.map((s, i) => (
            <View
              key={s.value}
              style={{
                width: '50%' as any,
                alignItems: 'center' as const,
                paddingVertical: 12,
                borderRightWidth: i % 2 === 0 ? 1 : 0,
                borderBottomWidth: i < 2 ? 1 : 0,
                borderColor: BORDER,
              }}
            >
              <Text
                style={{
                  fontFamily: SERIF,
                  fontSize: 28,
                  fontWeight: '600',
                  color: GOLD_LIGHT,
                  lineHeight: 34,
                }}
              >
                {s.value}
              </Text>
              <Text style={{ color: TEXT_DIM, fontSize: 11, marginTop: 3, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Testimonial */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 8,
            padding: 14,
            borderWidth: 1,
            borderColor: BORDER,
            marginBottom: 28,
          }}
        >
          {/* Quote stars */}
          <View style={{ flexDirection: 'row', gap: 3, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={12} color={GOLD} />
            ))}
          </View>

          {/* Open quote mark */}
          <Text
            style={{
              fontFamily: SERIF,
              fontSize: 52,
              color: GOLD,
              opacity: 0.35,
              lineHeight: 38,
              marginBottom: 4,
            }}
          >
            "
          </Text>

          <Text
            style={{
              color: TEXT_MUTED,
              fontSize: 13,
              lineHeight: 20,
              fontStyle: 'italic',
              marginBottom: 16,
              marginTop:-19
            }}
          >
            I applied to 20 jobs and got 14 callbacks. ResuCraft's ATS optimization is genuinely different — it completely changed my job search.
          </Text>


          {/* Author */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: `${GOLD}28`,
                borderWidth: 1.5,
                borderColor: GOLD_BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800' }}>SK</Text>
            </View>
            <View>
              <Text style={{ color: TEXT, fontSize: 13, fontWeight: '700' }}>Sara K.</Text>
              <Text style={{ color: TEXT_DIM, fontSize: 11 }}>Software Engineer</Text>
            </View>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.85}
          style={{
            height: 54,
            borderRadius: 100,
            backgroundColor: GOLD,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>
            Start Building Free
          </Text>
          <Ionicons name="arrow-forward" size={17} color="#fff" />
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
          style={{
            height: 54,
            borderRadius: 160,
            borderWidth: 1,
            borderColor: BORDER_MED,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: TEXT_MUTED, fontSize: 15, fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main — LandingScreen
// ══════════════════════════════════════════════════════════════════════════════
const SLIDES = ['hero', 'ai', 'design', 'interview', 'cta'] as const;
type SlideId = (typeof SLIDES)[number];

export default function LandingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const flatRef  = useRef<FlatList<SlideId>>(null);

  const goTo = useCallback((index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const onViewChange = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActivePage(viewableItems[0].index);
      }
    },
    [],
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<SlideId>) => {
      const p: SlideProps = { w: width, h: height, top: insets.top, bottom: insets.bottom };
      switch (item) {
        case 'hero':      return <HeroSlide      {...p} />;
        case 'ai':        return <AISlide        {...p} />;
        case 'design':    return <DesignSlide    {...p} />;
        case 'interview': return <InterviewSlide {...p} />;
        case 'cta':       return <CTASlide       {...p} router={router} />;
      }
    },
    [width, height, insets.top, insets.bottom, router],
  );

  const isFirst = activePage === 0;
  const isLast  = activePage === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={[...SLIDES]}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewChange}
        viewabilityConfig={viewConfig.current}
        renderItem={renderSlide}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Skip button — top right (hidden on last slide) */}
      {!isLast && (
        <TouchableOpacity
          onPress={() => goTo(SLIDES.length - 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: 'absolute',
            top: insets.top + 14,
            right: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 100,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER_MED,
          }}
        >
          <Text style={{ color: TEXT_DIM, fontSize: 12, fontWeight: '700' }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* ── Bottom navigation bar ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 10,
          paddingTop: 14,
          paddingHorizontal: 24,
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Back button */}
        {!isFirst ? (
          <TouchableOpacity
            onPress={() => goTo(activePage - 1)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER_MED,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={19} color={TEXT_MUTED} />
          </TouchableOpacity>
        ) : (
          // Placeholder to keep layout balanced on first slide
          <View style={{ width: 44 }} />
        )}

        {/* Progress dots */}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            >
              <View
                style={{
                  width: activePage === i ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: activePage === i ? GOLD : BORDER_MED,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        {!isLast ? (
          <TouchableOpacity
            onPress={() => goTo(activePage + 1)}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 20,
              height: 44,
              borderRadius: 12,
              backgroundColor: GOLD,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Next</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 18,
              height: 44,
              borderRadius: 12,
              backgroundColor: GOLD,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
