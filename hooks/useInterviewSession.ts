/**
 * React-Native WebSocket interview session hook.
 *
 * Audio I/O requires expo-av and expo-file-system:
 *   npx expo install expo-av expo-file-system
 *
 * The hook degrades gracefully when those packages are absent:
 *  - WebSocket, transcript, and feedback still work.
 *  - Audio playback / mic recording are silently skipped.
 */

import { useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { BASE_URL, getStoredToken } from '@/services/api';

// Derive WebSocket URL from the HTTP base URL
const WS_URL =
  BASE_URL.replace('/api', '').replace(/^http/, 'ws') + '/ws/interview';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'interviewing'
  | 'ending'
  | 'done'
  | 'error';

export interface TranscriptEntry {
  speaker: 'ai' | 'user';
  text: string;
}

export interface FeedbackData {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  relevanceScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

// ─── WAV helpers (DataView / Uint8Array — binary-safe on Hermes) ───────────────

/** Decode a base64 string to a Uint8Array without binary-string pitfalls. */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Encode a Uint8Array to base64. */
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Build a WAV container directly from a raw PCM Uint8Array. */
function buildWav(pcm: Uint8Array, sampleRate: number): string {
  const dataLen = pcm.length;
  const buf = new Uint8Array(44 + dataLen);
  const v = new DataView(buf.buffer);

  // RIFF chunk
  buf[0]=82; buf[1]=73; buf[2]=70; buf[3]=70;          // "RIFF"
  v.setUint32(4, 36 + dataLen, true);
  buf[8]=87; buf[9]=65; buf[10]=86; buf[11]=69;         // "WAVE"
  // fmt sub-chunk
  buf[12]=102; buf[13]=109; buf[14]=116; buf[15]=32;    // "fmt "
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);                             // PCM
  v.setUint16(22, 1, true);                             // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);                // byteRate (16-bit mono)
  v.setUint16(32, 2, true);                             // blockAlign
  v.setUint16(34, 16, true);                            // bitsPerSample
  // data sub-chunk
  buf[36]=100; buf[37]=97; buf[38]=116; buf[39]=97;     // "data"
  v.setUint32(40, dataLen, true);
  buf.set(pcm, 44);

  return bytesToB64(buf);
}

/** Wrap raw base64 Int16 PCM in a WAV container so expo-av can play it. */
function addWavHeader(base64pcm: string, sampleRate: number): string {
  return buildWav(b64ToBytes(base64pcm), sampleRate);
}

/** Strip the 44-byte WAV header from a base64-encoded WAV file. */
function stripWavHeader(base64wav: string): string {
  return bytesToB64(b64ToBytes(base64wav).slice(44));
}

// Module-level counter — avoids Date.now() collisions for rapid chunks.
let _chunkId = 0;

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useInterviewSession() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const isMicActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const recordingRef = useRef<any>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sequential audio queue ─────────────────────────────────────────────────
  // Chunks arrive faster than they play. We push to the queue and drain one
  // chunk at a time, fully awaiting cleanup before loading the next one so
  // the audio session is in a clean state for every load.
  const audioQueueRef = useRef<{ base64: string; mimeType: string }[]>([]);
  const isPlayingRef = useRef(false);
  // Hard ref to the currently playing Sound — prevents GC mid-playback.
  const currentSoundRef = useRef<any>(null);

  const drainQueue = useCallback(async () => {
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    // ── Android batch strategy ────────────────────────────────────────────────
    // Android MediaPlayer has ~100-300 ms init overhead per createAsync call.
    // Playing many small Gemini chunks one-at-a-time causes audible gaps.
    // Fix: drain ALL currently-queued chunks into ONE merged WAV file per
    // loop iteration so Android inits the player only once per batch.
    // New chunks that arrive while we're playing are caught by the next
    // iteration of the while-loop after the current sound finishes.
    while (audioQueueRef.current.length > 0) {
      // Grab every chunk that has arrived so far (not just one).
      const batch = audioQueueRef.current.splice(0);

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Audio } = require('expo-av');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const FileSystem = require('expo-file-system');

        // Force plain Playback mode (fixes iOS PlayAndRecord sample-rate issue).
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Gemini Live API always outputs 24 kHz mono Int16 PCM.
        const sampleRate = 24000;

        // Concatenate all batch PCM byte arrays into one contiguous buffer.
        const pcmArrays = batch.map(item => b64ToBytes(item.base64));
        const totalLen = pcmArrays.reduce((n, a) => n + a.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const arr of pcmArrays) {
          merged.set(arr, offset);
          offset += arr.length;
        }

        // Build a single WAV from the merged PCM — one MediaPlayer init.
        const wavBase64 = buildWav(merged, sampleRate);

        const uri = `${FileSystem.cacheDirectory}rc_iv_${++_chunkId}.wav`;
        await FileSystem.writeAsStringAsync(uri, wavBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Play and wait for completion.
        let capturedSound: any = null;

        await new Promise<void>((resolve) => {
          const onStatus = (st: any) => {
            if (!st.isLoaded) return;
            if (st.didJustFinish) resolve();
          };

          Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            onStatus,
          )
            .then(({ sound }: { sound: any }) => {
              capturedSound = sound;
              currentSoundRef.current = sound;
            })
            .catch(() => resolve());
        });

        if (capturedSound) {
          await capturedSound.unloadAsync().catch(() => {});
          capturedSound = null;
          currentSoundRef.current = null;
        }
        await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});

        // Restore PlayAndRecord mode so mic recording can continue.
        if (isMicActiveRef.current) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }

      } catch {
        // expo-av / expo-file-system not installed — skip silently
      }
    }

    isPlayingRef.current = false;
  }, []);

  const playAudioChunk = useCallback((base64: string, mimeType: string) => {
    audioQueueRef.current.push({ base64, mimeType });
    drainQueue();
  }, [drainQueue]);

  // ── Microphone (expo-av, 1-second chunks) ──────────────────────────────────

  const stopMicrophone = useCallback(async () => {
    isMicActiveRef.current = false;
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
    setIsMicActive(false);
  }, []);

  // ── Mute toggle ─────────────────────────────────────────────────────────────
  // The recording loop keeps running when muted — we just skip sending audio.
  // This means there's no gap or permission re-prompt when the user unmutes.
  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
  }, []);

  const startMicrophoneChunks = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Audio } = require('expo-av');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FileSystem = require('expo-file-system');

      const { status: perm } = await Audio.requestPermissionsAsync();
      if (perm !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordChunk = async () => {
        if (!isMicActiveRef.current) return;

        const recording = new Audio.Recording();
        try {
          await recording.prepareToRecordAsync({
            ios: {
              extension: '.wav',
              outputFormat: Audio.IOSOutputFormat.LINEARPCM,
              audioQuality: Audio.IOSAudioQuality.LOW,
              sampleRate: 16000,
              numberOfChannels: 1,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 64000,
            },
            web: {},
          });
          await recording.startAsync();
          recordingRef.current = recording;
        } catch {
          return; // mic unavailable
        }

        chunkTimerRef.current = setTimeout(async () => {
          if (!isMicActiveRef.current) return;
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri && wsRef.current?.readyState === WebSocket.OPEN) {
              const data = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              // iOS records linear PCM with a WAV header — strip it so we
              // send raw Int16 PCM.  Android records AAC/M4A — send as-is;
              // the server will transcode it to PCM before Gemini sees it.
              if (!isMutedRef.current) {
                const isWav = data.startsWith('UklGR'); // base64 of 'RIFF'
                const payload = isWav ? stripWavHeader(data) : data;
                const mimeType = Platform.OS === 'android'
                  ? 'audio/mp4'
                  : 'audio/pcm;rate=16000';
                wsRef.current.send(JSON.stringify({ type: 'audio_chunk', data: payload, mimeType }));
              }
              await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
            }
          } catch {
            // error reading chunk — skip
          }
          recordChunk(); // schedule next chunk
        }, 1000);
      };

      isMicActiveRef.current = true;
      setIsMicActive(true);
      await recordChunk();
    } catch {
      // expo-av not installed — microphone unavailable
    }
  }, []);

  // ── Session lifecycle ───────────────────────────────────────────────────────

  const startSession = useCallback(
    async (jobDescription: string, candidateProfile?: string) => {
      setStatus('connecting');
      setTranscript([]);
      setFeedback(null);
      setError(null);

      // Start in plain playback mode. drainQueue will temporarily switch to
      // allowsRecordingIOS: false before each chunk and restore afterward,
      // but we prime the session here so the very first chunk also uses the
      // correct audio path.
      try {
        const { Audio } = require('expo-av');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch {}

      const token = await getStoredToken();

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'start_session',
          jobDescription,
          candidateProfile: candidateProfile ?? '',
          token,
        }));
      };

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case 'session_ready':
            setStatus('ready');
            startMicrophoneChunks().then(() => setStatus('interviewing'));
            break;

          case 'audio_chunk':
            void playAudioChunk(msg.data, msg.mimeType);
            break;

          case 'transcript':
            setTranscript((prev) => [...prev, { speaker: msg.speaker, text: msg.text }]);
            break;

          case 'feedback':
            setFeedback(msg.data);
            setStatus('done');
            void stopMicrophone();
            break;

          case 'ending':
            setStatus('ending');
            void stopMicrophone();
            break;

          case 'error':
            setError(msg.message);
            setStatus('error');
            void stopMicrophone();
            break;

          case 'session_ended':
            setStatus('done');
            void stopMicrophone();
            break;
        }
      };

      ws.onerror = () => {
        setError('Connection failed. Check the server is running and GEMINI_API_KEY is set.');
        setStatus('error');
      };
    },
    [startMicrophoneChunks, stopMicrophone, playAudioChunk],
  );

  const endInterview = useCallback(() => {
    setStatus('ending');
    void stopMicrophone();
    wsRef.current?.send(JSON.stringify({ type: 'end_interview' }));
  }, [stopMicrophone]);

  const closeSession = useCallback(async () => {
    await stopMicrophone();
    wsRef.current?.close();
    wsRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (currentSoundRef.current) {
      currentSoundRef.current.unloadAsync().catch(() => {});
      currentSoundRef.current = null;
    }
    isMutedRef.current = false;
    setStatus('idle');
    setTranscript([]);
    setFeedback(null);
    setError(null);
    setIsMuted(false);
  }, [stopMicrophone]);

  return {
    status,
    transcript,
    feedback,
    error,
    isMicActive,
    isMuted,
    toggleMute,
    startSession,
    endInterview,
    closeSession,
  };
}
