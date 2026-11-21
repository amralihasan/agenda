import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3 } from 'lucide-react';
import { DailyPriority, ScheduleEvent } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface DailyVersoPageProps {
  date: string; // YYYY-MM-DD
  dayOfYear: number;
  totalDays: number;
  priorities: DailyPriority[];
  events: ScheduleEvent[];
  startHour: number;
  endHour: number;
  onDateChange: (date: string) => void;
  onTogglePriority: (priority: DailyPriority) => void;
  onSavePriority: (pos: number, title: string) => void;
  onDeletePriority?: (id: string) => void;
  onAddEventClick: (hour: string) => void;
  onEditEventClick: (event: ScheduleEvent) => void;
}

export const DailyVersoPage: React.FC<DailyVersoPageProps> = ({
  date,
  dayOfYear,
  totalDays,
  priorities,
  events,
  startHour,
  endHour,
  onDateChange,
  onTogglePriority,
  onSavePriority,
  onDeletePriority,
  onAddEventClick,
  onEditEventClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateObj = parseISO(date);

  const prevDate = subDays(dateObj, 1);
  const nextDate = addDays(dateObj, 1);

  // Editing state for priority
  const [editingPos, setEditingPos] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const romanNumerals = isRtl ? ['١.', '٢.', '٣.'] : ['I.', 'II.', 'III.'];

  // Format hours array based on settings
  const hours: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // Handle start editing priority
  const handleStartEditPriority = (pos: number, currentTitle: string) => {
    setEditingPos(pos);
    setEditingTitle(currentTitle);
  };

  const handleFinishEditPriority = (pos: number) => {
    onSavePriority(pos, editingTitle.trim());
    setEditingPos(null);
  };

  const dayName = format(dateObj, 'EEEE', { locale: isRtl ? ar : enUS });
  const dayNumber = format(dateObj, 'd', { locale: isRtl ? ar : enUS });
  const monthYear = format(dateObj, 'MMMM yyyy', { locale: isRtl ? ar : enUS });

  // Calculate folio page number
  const folioNumber = 140 + (dayOfYear % 100);

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Top Folio Header & Quick Date Switcher */}
        <div className="flex items-baseline justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/60">
          <div className="flex items-center gap-2">
            <span className="font-label-stamp text-[11px] text-[#832613] tracking-widest uppercase">
              {isRtl ? `صحيفة ${folioNumber} / ظهر` : `Folio ${folioNumber} / Verso`}
            </span>
            <span className="font-label-mono text-xs text-[#675d52] opacity-40">·</span>
            <span className="font-label-mono text-xs text-[#675d52]">
              {isRtl ? `رقم ${folioNumber}` : `N° ${folioNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-1 font-label-mono text-xs text-[#675d52]">
            <button
              onClick={() => onDateChange(format(prevDate, 'yyyy-MM-dd'))}
              className="hover:text-[#080c12] transition-colors flex items-center gap-0.5 group"
            >
              {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              <span>{format(prevDate, 'd MMM', { locale: isRtl ? ar : enUS })}</span>
            </button>
            <span className="opacity-30">|</span>
            <span className="font-label-stamp text-xs text-[#080c12] font-bold uppercase">
              {format(dateObj, 'd MMM', { locale: isRtl ? ar : enUS })}
            </span>
            <span className="opacity-30">|</span>
            <button
              onClick={() => onDateChange(format(nextDate, 'yyyy-MM-dd'))}
              className="hover:text-[#080c12] transition-colors flex items-center gap-0.5 group"
            >
              <span>{format(nextDate, 'd MMM', { locale: isRtl ? ar : enUS })}</span>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Date Header */}
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[#e5e2dc] pb-2">
            <div>
              <span className="block font-caption-caps text-caption-caps text-[#832613] uppercase tracking-[0.22em]">
                {t('daily.horariumTitle')}
              </span>
              <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#080c12] tracking-wide uppercase mt-0.5">
                {dayName} · {dayNumber} {monthYear}
              </h1>
            </div>
            <div className="flex items-center gap-2 font-label-mono text-xs text-[#675d52] self-start sm:self-auto">
              <span>
                {t('app.day')} {dayOfYear} {t('app.of')} {totalDays}
              </span>
              <span className="opacity-40">§</span>
              <span className="text-[#45474b] font-medium">{isRtl ? 'أحدب متزايد 🌔' : 'Waxing Gibbous 🌔'}</span>
            </div>
          </div>
        </header>

        {/* Section 1: Today's Priorities */}
        <section className="mb-5 pb-3 border-b border-[#e5e2dc]/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-widest font-bold">
              {t('daily.prioritiesTitle')}
            </span>
            <span className="font-label-stamp text-[10px] text-[#675d52] opacity-70">
              {t('daily.prioritiesTag')}
            </span>
          </div>

          <div className="space-y-1.5 font-body-script text-base text-[#1c1c18]">
            {[1, 2, 3].map((pos) => {
              const p = priorities.find((item) => item.position === pos);
              const isCompleted = p?.isCompleted ?? false;
              const title = p?.title ?? '';
              const roman = romanNumerals[pos - 1];

              if (editingPos === pos) {
                return (
                  <div key={pos} className="flex items-center gap-2 py-0.5">
                    <span className="font-label-mono text-xs text-[#832613] font-bold w-6 shrink-0 mr-1">
                      {roman}
                    </span>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleFinishEditPriority(pos)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishEditPriority(pos);
                        if (e.key === 'Escape') setEditingPos(null);
                      }}
                      autoFocus
                      placeholder={t('daily.addPriorityPlaceholder')}
                      className="flex-1 bg-transparent border-b border-[#832613] pb-0.5 font-body-script text-base text-[#080c12] focus:outline-none"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={pos}
                  className="flex items-baseline gap-2 group cursor-pointer py-0.5 hover:bg-[#f6f3ed]/60 px-1 rounded transition-colors"
                >
                  <span
                    onClick={() => p && onTogglePriority(p)}
                    className="font-label-mono text-xs text-[#832613] font-bold w-6 shrink-0 select-none mr-1"
                  >
                    {roman}
                  </span>

                  <span
                    onClick={() => p && onTogglePriority(p)}
                    className={`flex-1 transition-all ${
                      isCompleted
                        ? 'line-through decoration-[#832613]/70 decoration-1 text-[#675d52] italic'
                        : title
                        ? 'text-[#080c12]'
                        : 'text-[#675d52]/40 italic'
                    }`}
                  >
                    {title || t('daily.addPriorityPlaceholder')}
                  </span>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditPriority(pos, title);
                      }}
                      className="p-1 hover:text-[#832613] text-[#675d52]"
                      title={t('daily.editPriority')}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {p && onDeletePriority && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePriority(p.id);
                        }}
                        className="p-1 hover:text-[#ba1a1a] text-[#675d52]"
                        title={t('daily.deletePriority')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {title && (
                    <span
                      onClick={() => p && onTogglePriority(p)}
                      className={`font-label-stamp text-[10px] uppercase tracking-wider shrink-0 select-none ${
                        isCompleted
                          ? 'text-[#832613]'
                          : p?.category === 'Urgent' || p?.category === 'عاجل'
                          ? 'text-[#832613]'
                          : 'text-[#675d52]'
                      }`}
                    >
                      {isCompleted
                        ? t('daily.completed')
                        : p?.category && p.category.trim() !== ''
                        ? (p.category === 'Urgent' || p.category === 'عاجل'
                            ? t('daily.urgent')
                            : p.category === 'Complété' || p.category === 'Completed' || p.category === 'مُنجز' || p.category === 'تم'
                            ? t('daily.completed')
                            : p.category.toLowerCase() === 'priorité' || p.category.toLowerCase() === 'priority'
                            ? t('daily.priority')
                            : p.category)
                        : t('daily.priority')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Hourly Schedule / Horarium */}
        <section className="flex-1 relative">
          <div className="flex items-center justify-between pb-1 mb-2">
            <span className="font-caption-caps text-caption-caps text-[#675d52] uppercase tracking-[0.16em]">
              {t('daily.scheduleTitle')}
            </span>
            <span className="font-label-mono text-[10px] text-[#675d52] opacity-60">
              {startHour.toString().padStart(2, '0')}:00 — {endHour.toString().padStart(2, '0')}:00
            </span>
          </div>

          {/* Ledger Container with simulated printed ruling lines & faint vertical red margin */}
          <div className={`relative ${isRtl ? 'pr-11 sm:pr-14' : 'pl-11 sm:pl-14'}`}>
            {/* Fine Carmine Red Vertical Margin Guide */}
            <div
              className={`absolute ${
                isRtl ? 'right-10 sm:right-13' : 'left-10 sm:left-13'
              } top-0 bottom-0 w-[1px] bg-[#832613]/25 pointer-events-none`}
            ></div>

            {/* Schedule Row Items sitting directly on horizontal rules */}
            <div className="divide-y divide-[#e5e2dc]/80 text-[#1c1c18]">
              {hours.map((hour) => {
                // Find events matching this hour
                const hourPrefix = hour.slice(0, 2);
                const matchingEvents = events.filter((e) =>
                  e.startTime.startsWith(hourPrefix)
                );

                return (
                  <div
                    key={hour}
                    className="min-h-[29px] py-1 flex items-baseline justify-between group hover:bg-[#f6f3ed]/60 transition-colors"
                  >
                    {/* Time Label on margin */}
                    <span
                      className={`font-label-mono text-[11px] text-[#675d52] ${
                        isRtl
                          ? '-mr-11 sm:-mr-14 w-10 sm:w-13 text-left pl-2'
                          : '-ml-11 sm:-ml-14 w-10 sm:w-13 text-right pr-2'
                      } shrink-0 select-none`}
                    >
                      {hour}
                    </span>

                    {/* Content on feint line */}
                    <div className="flex-1 px-2 font-body-script text-base flex flex-col gap-0.5">
                      {matchingEvents.length > 0 ? (
                        matchingEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => onEditEventClick(ev)}
                            className="flex items-baseline justify-between cursor-pointer group/ev py-0.5 hover:text-[#832613]"
                          >
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[#080c12] font-medium">
                                {ev.title}
                              </span>
                              {ev.description && (
                                <span className="text-[#675d52] italic text-xs">
                                  ({ev.description})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {ev.category && (
                                <span className="font-label-mono text-[10px] text-[#832613] shrink-0">
                                  {ev.category}
                                </span>
                              )}
                              <span className="font-label-mono text-[10px] text-[#675d52] opacity-60">
                                {ev.startTime}–{ev.endTime}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddEventClick(hour)}
                          className="text-left w-full h-full min-h-[20px] opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-[#675d52]/60 italic font-body-script hover:text-[#832613] transition-opacity"
                        >
                          <Plus className="w-3 h-3 text-[#832613]/70" />
                          <span>{t('daily.addEventPrompt')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Left Page Footer */}
      <PageFooter
        side="left"
        pageNumber={folioNumber}
        subText={`${t('app.title')} · ${monthYear}`}
      />
    </div>
  );
};
