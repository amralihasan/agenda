import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Search,
  X,
  Calendar,
  Clock,
  Tag,
  Play,
  Pause,
  Image as ImageIcon,
  Volume2,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { SearchResultItem } from '../../types';
import { getEventColorPreset } from '../../utils/eventColors';

interface SearchPageProps {
  onOpenDailyDate: (dateStr: string) => void;
  onOpenMonthlyDate: (year: number, month: number) => void;
  onOpenNote: (noteId: string) => void;
}

const DAY_OPTIONS = [
  { value: '6', en: 'Saturday', ar: 'السبت' },
  { value: '0', en: 'Sunday', ar: 'الأحد' },
  { value: '1', en: 'Monday', ar: 'الإثنين' },
  { value: '2', en: 'Tuesday', ar: 'الثلاثاء' },
  { value: '3', en: 'Wednesday', ar: 'الأربعاء' },
  { value: '4', en: 'Thursday', ar: 'الخميس' },
  { value: '5', en: 'Friday', ar: 'الجمعة' },
];

const MONTH_OPTIONS = [
  { value: '1', en: 'January', ar: 'يناير' },
  { value: '2', en: 'February', ar: 'فبراير' },
  { value: '3', en: 'March', ar: 'مارس' },
  { value: '4', en: 'April', ar: 'أبريل' },
  { value: '5', en: 'May', ar: 'مايو' },
  { value: '6', en: 'June', ar: 'يونيو' },
  { value: '7', en: 'July', ar: 'يوليو' },
  { value: '8', en: 'August', ar: 'أغسطس' },
  { value: '9', en: 'September', ar: 'سبتمبر' },
  { value: '10', en: 'October', ar: 'أكتوبر' },
  { value: '11', en: 'November', ar: 'نوفمبر' },
  { value: '12', en: 'December', ar: 'ديسمبر' },
];

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SearchPage: React.FC<SearchPageProps> = ({
  onOpenDailyDate,
  onOpenMonthlyDate,
  onOpenNote,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'daily' | 'monthly' | 'notes'>('all');
  const [dayName, setDayName] = useState('all');
  const [month, setMonth] = useState('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    imageData: string;
    caption: string | null;
  } | null>(null);

  // Inline Audio Playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImage]);

  // Debounced search fetch
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.searchAgenda({
          q: query.trim() || undefined,
          scope,
          dayName,
          month,
        });
        if (active) {
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, scope, dayName, month]);

  const handleTogglePlay = (voiceId: string, audioData: string) => {
    if (playingVoiceId === voiceId) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(audioData);
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => setPlayingVoiceId(null);
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
    audio.play().catch(() => setPlayingVoiceId(null));
  };

  const hasActiveFilters =
    query.trim() !== '' || scope !== 'all' || dayName !== 'all' || month !== 'all';

  const handleResetFilters = () => {
    setQuery('');
    setScope('all');
    setDayName('all');
    setMonth('all');
  };

  const getKindLabel = (kind: SearchResultItem['kind']) => {
    return t(`search.kinds.${kind}`, kind);
  };

  const formatDateBadge = (item: SearchResultItem) => {
    if (item.date) {
      try {
        return format(parseISO(item.date), 'EEEE · d MMM yyyy', {
          locale: isRtl ? ar : enUS,
        });
      } catch {
        return item.date;
      }
    }
    if (item.year && item.month) {
      const mOpt = MONTH_OPTIONS.find((m) => m.value === String(item.month));
      return `${isRtl ? mOpt?.ar : mOpt?.en} ${item.year}`;
    }
    return null;
  };

  const handleOpenResult = (item: SearchResultItem) => {
    if (item.scope === 'daily' && item.date) {
      onOpenDailyDate(item.date);
    } else if (item.scope === 'monthly' && item.year && item.month) {
      onOpenMonthlyDate(item.year, item.month);
    } else if (item.scope === 'notes') {
      const noteId = item.id.startsWith('note-') ? item.id.slice('note-'.length) : item.id;
      onOpenNote(noteId);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-10 bg-[#fcf9f3] min-h-[740px]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        {/* Page Header */}
        <header className="flex flex-wrap items-baseline justify-between gap-2 pb-3 mb-4 border-b border-[#e5e2dc]">
          <div>
            <span className="block font-caption-caps text-[10px] text-[#832613] uppercase tracking-[0.2em]">
              {t('search.eyebrow')}
            </span>
            <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#080c12] mt-0.5">
              {t('search.title')}
            </h1>
          </div>

          <span className="font-label-mono text-xs text-[#675d52]">
            {loading
              ? t('search.searching')
              : `${results.length} ${t('search.resultsCount')}`}
          </span>
        </header>

        {/* Search Input + Filter Controls */}
        <div className="bg-[#f6f3ed]/80 border border-[#e5e2dc] rounded-sm p-3 sm:p-4 mb-5 space-y-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-white border border-[#dcdad4] focus-within:border-[#832613] rounded-sm px-3 py-2 transition-colors">
            <Search className="w-4 h-4 text-[#832613] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              autoFocus
              className="w-full bg-transparent text-sm sm:text-base text-[#080c12] placeholder:text-[#675d52]/50 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-0.5 text-[#675d52] hover:text-[#080c12] cursor-pointer"
                title={t('search.clear')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Row: Scope Pills + Day Name + Month */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Scope Filter Pills */}
            <div className="flex items-center gap-1 bg-[#ebe8e2]/80 p-0.5 rounded-sm text-[11px] font-label-stamp">
              {(['all', 'daily', 'monthly', 'notes'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`px-2.5 py-1 rounded-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    scope === s
                      ? 'bg-[#832613] text-white font-bold shadow-2xs'
                      : 'text-[#675d52] hover:text-[#080c12]'
                  }`}
                >
                  {t(`search.scopes.${s}`)}
                </button>
              ))}
            </div>

            {/* Day Name & Month Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                aria-label={t('search.dayFilter')}
                className="bg-white border border-[#dcdad4] rounded-sm px-2.5 py-1 text-xs font-label-mono text-[#080c12] focus:outline-none focus:border-[#832613] cursor-pointer"
              >
                <option value="all">{t('search.allDays')}</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {isRtl ? d.ar : d.en}
                  </option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label={t('search.monthFilter')}
                className="bg-white border border-[#dcdad4] rounded-sm px-2.5 py-1 text-xs font-label-mono text-[#080c12] focus:outline-none focus:border-[#832613] cursor-pointer"
              >
                <option value="all">{t('search.allMonths')}</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isRtl ? m.ar : m.en}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-label-mono text-[#832613] hover:bg-[#832613]/10 rounded-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('search.reset')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {results.map((item) => {
            const dateBadge = formatDateBadge(item);
            const eventAccent =
              item.kind === 'event' ? getEventColorPreset(item.color).accent : '#832613';

            return (
              <article
                key={item.id}
                className="bg-white/75 hover:bg-white border border-[#e5e2dc] rounded-sm p-3.5 sm:p-4 transition-colors shadow-2xs"
                style={
                  item.kind === 'event'
                    ? {
                        [isRtl ? 'borderRightWidth' : 'borderLeftWidth']: '3px',
                        [isRtl ? 'borderRightColor' : 'borderLeftColor']: eventAccent,
                      }
                    : undefined
                }
              >
                {/* Top Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-xs bg-[#f0eee8] text-[#832613] font-label-stamp uppercase tracking-wider text-[10px]">
                      {getKindLabel(item.kind)}
                    </span>

                    {dateBadge && (
                      <span className="inline-flex items-center gap-1 font-label-mono text-[#45474b]">
                        <Calendar className="w-3 h-3 text-[#832613]/70" />
                        {dateBadge}
                      </span>
                    )}

                    {item.timeRange && (
                      <span
                        className="inline-flex items-center gap-1 font-label-mono"
                        style={{ color: eventAccent }}
                      >
                        <Clock className="w-3 h-3" />
                        {item.timeRange}
                      </span>
                    )}

                    {item.category && (
                      <span className="inline-flex items-center gap-1 font-label-mono text-[#675d52]">
                        <Tag className="w-3 h-3" />
                        {item.category}
                      </span>
                    )}
                  </div>

                  {(item.date || item.scope === 'monthly' || item.scope === 'notes') && (
                    <button
                      type="button"
                      onClick={() => handleOpenResult(item)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-label-stamp uppercase tracking-wider text-[#832613] hover:bg-[#832613]/10 transition-colors cursor-pointer"
                    >
                      <span>{t('search.open')}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-body-script text-lg text-[#080c12] font-medium leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="mt-1 font-body-script text-sm text-[#45474b] line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Images & Voice Recordings */}
                {(item.images.length > 0 || item.voiceNotes.length > 0) && (
                  <div className="mt-3 pt-2.5 border-t border-[#e5e2dc]/70 space-y-2">
                    {/* Images */}
                    {item.images.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-label-mono text-[#675d52] uppercase">
                          <ImageIcon className="w-3 h-3 text-[#832613]" />
                          {item.images.length}
                        </span>
                        {item.images.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                imageData: img.imageData,
                                caption: img.caption,
                              })
                            }
                            className="group relative w-14 h-14 rounded-xs overflow-hidden border border-[#dcdad4] hover:border-[#832613] transition-colors cursor-pointer bg-[#f6f3ed]"
                            title={img.caption || t('images.viewFull')}
                          >
                            <img
                              src={img.imageData}
                              alt={img.caption || 'Attachment'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Voice Recordings */}
                    {item.voiceNotes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-label-mono text-[#675d52] uppercase">
                          <Volume2 className="w-3 h-3 text-[#832613]" />
                          {item.voiceNotes.length}
                        </span>
                        {item.voiceNotes.map((vn, idx) => {
                          const isPlaying = playingVoiceId === vn.id;
                          return (
                            <button
                              key={vn.id}
                              type="button"
                              onClick={() => handleTogglePlay(vn.id, vn.audioData)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-label-mono transition-colors cursor-pointer ${
                                isPlaying
                                  ? 'bg-[#832613] text-white border-[#832613]'
                                  : 'bg-[#f6f3ed] text-[#080c12] border-[#dcdad4] hover:border-[#832613]'
                              }`}
                            >
                              {isPlaying ? (
                                <Pause className="w-3 h-3 shrink-0" />
                              ) : (
                                <Play className="w-3 h-3 shrink-0" />
                              )}
                              <span>{vn.title || `${t('search.recording')} #${idx + 1}`}</span>
                              <span className="opacity-70 text-[10px]">
                                {formatDuration(vn.duration || 0)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {!loading && results.length === 0 && (
            <div className="py-16 text-center text-sm font-body-script text-[#675d52] italic">
              {t('search.noResults')}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-[#fcf9f3] p-2 rounded-sm shadow-2xl border border-[#dcdad4]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage.imageData}
              alt={lightboxImage.caption || 'Preview'}
              className="max-h-[75vh] w-auto object-contain rounded-xs"
            />
            {lightboxImage.caption && (
              <p className="mt-2 px-1 text-xs font-label-mono text-[#675d52] text-center">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
