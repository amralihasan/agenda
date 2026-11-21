import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  Sparkles,
  X,
  Check,
  Radio,
  FileAudio,
} from 'lucide-react';
import { VoiceNote } from '../../types';
import { api } from '../../services/api';

interface VoiceNoteSectionProps {
  targetType: 'daily' | 'weekly' | 'note';
  targetId: string;
  onTranscribeText?: (text: string) => void;
  compact?: boolean;
}

export const VoiceNoteSection: React.FC<VoiceNoteSectionProps> = ({
  targetType,
  targetId,
  onTranscribeText,
  compact = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<{ [id: string]: number }>({});
  const [currentPlayTime, setCurrentPlayTime] = useState<{ [id: string]: number }>({});
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Voice Dictation (Speech to Text) State
  const [isDictating, setIsDictating] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Load voice notes when targetId or targetType changes
  useEffect(() => {
    let isMounted = true;
    if (!targetId) {
      setVoiceNotes([]);
      return;
    }

    const loadVoiceNotes = async () => {
      try {
        setIsLoading(true);
        const data = await api.getVoiceNotes(targetType, targetId);
        if (isMounted) {
          setVoiceNotes(data || []);
        }
      } catch (err) {
        console.error('Failed to load voice notes', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadVoiceNotes();

    return () => {
      isMounted = false;
      stopAudioPlayback();
      cleanupRecorder();
      stopDictation();
    };
  }, [targetType, targetId]);

  // Clean up on unmount
  const cleanupRecorder = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
    setPlayingId(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Voice Recording
  const startRecording = async () => {
    setRecordError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordError(t('voiceNotes.micPermissionDenied'));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setIsExpanded(true);
      setRecordDuration(0);
      recordStartTimeRef.current = Date.now();

      recordTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartTimeRef.current) / 1000);
        setRecordDuration(elapsed);
      }, 500);
    } catch (err: any) {
      console.error('Error accessing microphone', err);
      setRecordError(t('voiceNotes.micPermissionDenied'));
      cleanupRecorder();
      setIsRecording(false);
    }
  };

  // Save Voice Recording
  const stopAndSaveRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const recorder = mediaRecorderRef.current;
    const finalDuration = Math.max(1, Math.round((Date.now() - recordStartTimeRef.current) / 1000));

    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        // Convert blob to base64 Data URL
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (base64Audio) {
            const saved = await api.createVoiceNote({
              targetType,
              targetId,
              audioData: base64Audio,
              duration: finalDuration,
              title: null,
            });
            setVoiceNotes((prev) => [saved, ...prev]);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        console.error('Failed to preserve voice recording', err);
      } finally {
        cleanupRecorder();
        setIsRecording(false);
        setRecordDuration(0);
      }
    };

    recorder.stop();
  };

  // Cancel Voice Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    cleanupRecorder();
    setIsRecording(false);
    setRecordDuration(0);
  };

  // Handle Playback Toggle
  const togglePlayVoiceNote = (note: VoiceNote) => {
    if (playingId === note.id) {
      // Pause
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // Stop current audio
    stopAudioPlayback();

    const audio = new Audio(note.audioData);
    audioPlayerRef.current = audio;
    setPlayingId(note.id);

    audio.ontimeupdate = () => {
      const current = audio.currentTime;
      const total = audio.duration || note.duration || 1;
      setPlayProgress((prev) => ({
        ...prev,
        [note.id]: (current / total) * 100,
      }));
      setCurrentPlayTime((prev) => ({
        ...prev,
        [note.id]: current,
      }));
    };

    audio.onended = () => {
      setPlayingId(null);
      setPlayProgress((prev) => ({ ...prev, [note.id]: 0 }));
      setCurrentPlayTime((prev) => ({ ...prev, [note.id]: 0 }));
    };

    audio.onerror = () => {
      setPlayingId(null);
    };

    audio.play().catch((err) => {
      console.error('Audio play failed', err);
      setPlayingId(null);
    });
  };

  // Handle Seek in Audio
  const handleSeek = (noteId: string, duration: number, pct: number) => {
    if (playingId === noteId && audioPlayerRef.current) {
      const targetTime = (pct / 100) * (audioPlayerRef.current.duration || duration);
      audioPlayerRef.current.currentTime = targetTime;
    }
  };

  // Handle Delete Voice Note
  const handleDeleteVoiceNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === id) {
      stopAudioPlayback();
    }
    try {
      await api.deleteVoiceNote(id);
      setVoiceNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete voice note', err);
    }
  };

  // Speech to Text Dictation
  const toggleDictation = () => {
    if (isDictating) {
      stopDictation();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordError(t('voiceNotes.speechNotSupported'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = isRtl ? 'ar-SA' : 'en-US';

      recognition.onstart = () => {
        setIsDictating(true);
        setRecordError(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        if (transcript && onTranscribeText) {
          onTranscribeText(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setRecordError(t('voiceNotes.micPermissionDenied'));
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition', err);
      setIsDictating(false);
    }
  };

  const stopDictation = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    setIsDictating(false);
  };

  const hasNotes = voiceNotes.length > 0;

  return (
    <div className="w-full my-2 text-[#080c12]">
      {/* Voice Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 sm:p-2 bg-[#f6f3ed]/70 border border-[#e5e2dc] rounded-sm text-xs">
        {/* Left Side: Buttons & Indicators */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Audio Recording Toggle */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#fcf9f3] border border-[#832613]/30 hover:border-[#832613] text-[#832613] font-label-stamp uppercase tracking-wider text-[11px] shadow-2xs hover:bg-[#832613]/5 transition-all cursor-pointer"
              title={t('voiceNotes.recordAudio')}
            >
              <Mic className="w-3.5 h-3.5 text-[#832613]" />
              <span>{t('voiceNotes.recordAudio')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#832613]/10 px-2.5 py-1 rounded-sm border border-[#832613]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-ping" />
              <span className="font-label-mono font-bold text-[#832613] text-[11px]">
                {formatSeconds(recordDuration)}
              </span>
              <button
                type="button"
                onClick={stopAndSaveRecording}
                className="ml-1 px-2 py-0.5 rounded bg-[#832613] text-[#fcf9f3] hover:bg-[#681c0d] font-label-stamp text-[10px] flex items-center gap-1 uppercase"
                title={t('voiceNotes.stopAndSave')}
              >
                <Check className="w-3 h-3" />
                <span>{t('voiceNotes.stopAndSave')}</span>
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className="p-0.5 text-[#675d52] hover:text-[#ba1a1a]"
                title={t('voiceNotes.cancel')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Speech-to-Text Dictation Toggle (if onTranscribeText provided) */}
          {onTranscribeText && (
            <button
              type="button"
              onClick={toggleDictation}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-label-stamp uppercase tracking-wider transition-all cursor-pointer ${
                isDictating
                  ? 'bg-[#832613] text-[#fcf9f3] animate-pulse'
                  : 'bg-[#fcf9f3] border border-[#e5e2dc] text-[#675d52] hover:text-[#832613] hover:border-[#832613]/40'
              }`}
              title={isDictating ? t('voiceNotes.stopDictation') : t('voiceNotes.dictateText')}
            >
              <Radio className={`w-3.5 h-3.5 ${isDictating ? 'text-[#fcf9f3]' : 'text-[#832613]'}`} />
              <span>{isDictating ? t('voiceNotes.listening') : t('voiceNotes.dictateText')}</span>
            </button>
          )}
        </div>

        {/* Right Side: Saved Notes Count / Toggle */}
        <div className="flex items-center gap-2">
          {hasNotes && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-[11px] font-label-mono text-[#675d52] hover:text-[#832613] cursor-pointer"
            >
              <FileAudio className="w-3.5 h-3.5 text-[#832613]" />
              <span>
                {voiceNotes.length} {t('voiceNotes.count')}
              </span>
              <span className="text-[10px] opacity-70">
                {isExpanded ? (isRtl ? '▲ إخفاء' : '▲ Hide') : (isRtl ? '▼ عرض' : '▼ View')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {recordError && (
        <div className="mt-1.5 p-1.5 text-[11px] text-[#ba1a1a] bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-sm">
          {recordError}
        </div>
      )}

      {/* Expandable Voice Notes List */}
      {(isExpanded || isRecording) && hasNotes && (
        <div className="mt-2 space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {voiceNotes.map((note) => {
            const isPlaying = playingId === note.id;
            const progress = playProgress[note.id] || 0;
            const currentTime = currentPlayTime[note.id] || 0;
            const displayTime = isPlaying
              ? `${formatSeconds(currentTime)} / ${formatSeconds(note.duration)}`
              : formatSeconds(note.duration);

            return (
              <div
                key={note.id}
                className="flex items-center gap-2.5 p-2 bg-[#fdfbf7] border border-[#e5e2dc] rounded-sm hover:border-[#832613]/40 transition-colors shadow-2xs"
              >
                {/* Play/Pause Button */}
                <button
                  type="button"
                  onClick={() => togglePlayVoiceNote(note)}
                  className="w-7 h-7 rounded-full bg-[#832613] text-[#fcf9f3] flex items-center justify-center hover:bg-[#681c0d] shrink-0 transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? t('voiceNotes.pause') : t('voiceNotes.play')}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Progress bar and time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-label-mono text-[#675d52] mb-1">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-[#832613]" />
                      <span>{displayTime}</span>
                    </span>
                    <span className="opacity-70 text-[9px]">
                      {new Date(note.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Interactive Seek Bar */}
                  <div
                    className="w-full h-1.5 bg-[#e5e2dc] rounded-full overflow-hidden cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickPos = (e.clientX - rect.left) / rect.width;
                      handleSeek(note.id, note.duration, Math.max(0, Math.min(100, clickPos * 100)));
                    }}
                  >
                    <div
                      className="h-full bg-[#832613] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteVoiceNote(note.id, e)}
                  className="p-1 text-[#675d52] hover:text-[#ba1a1a] transition-colors shrink-0"
                  title={t('voiceNotes.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
