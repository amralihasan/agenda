import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { DailyPriority, ScheduleEvent } from '../../types';
import { PageFooter } from '../book/PageFooter';
import { getEventColorPreset } from '../../utils/eventColors';

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

  useEffect(() => {
    setEditingPos(null);
    setEditingTitle('');
  }, [date]);

  const romanNumerals = isRtl ? ['١.', '٢.', '٣.'] : ['I.', 'II.', 'III.'];

  const sortedPriorities = [...priorities].sort((a, b) => a.position - b.position);
  const usedPositions = new Set(sortedPriorities.map((p) => p.position));
  const nextAvailablePosition =
    [1, 2, 3].find((pos) => !usedPositions.has(pos)) ?? null;
  // A draft being edited at a position that has no saved priority yet.
  const isAddingNew = editingPos !== null && !usedPositions.has(editingPos);
  const displayPositions = Array.from(usedPositions);
  if (isAddingNew && editingPos !== null) displayPositions.push(editingPos);
  displayPositions.sort((a, b) => a - b);

  // Format 30-minute time slots array based on settings (e.g. 09:00, 09:30, ..., 15:00)
  const timeSlots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const hh = h.toString().padStart(2, '0');
    timeSlots.push(`${hh}:00`);
    if (h < endHour) {
      timeSlots.push(`${hh}:30`);
    }
  }

  // Handle start editing priority
  const handleStartEditPriority = (pos: number, currentTitle: string) => {
    setEditingPos(pos);
    setEditingTitle(currentTitle);
  };

  const handleFinishEditPriority = (pos: number) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      onSavePriority(pos, trimmed);
    } else {
      // If cleared to empty and a priority exists, delete it
      const existing = priorities.find((x) => x.position === pos);
      if (existing && onDeletePriority) {
        onDeletePriority(existing.id);
      }
    }
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
        <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[#e5e2dc]/60">
          <span className="font-label-stamp text-[11px] text-[#832613] tracking-widest uppercase whitespace-nowrap">
            {isRtl ? `صحيفة ${folioNumber}` : `Folio ${folioNumber}`}
          </span>

          <div className="flex items-center gap-1.5 font-label-mono text-xs text-[#675d52] whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDateChange(format(prevDate, 'yyyy-MM-dd'))}
              className="px-1.5 py-0.5 rounded hover:bg-[#f6f3ed] hover:text-[#080c12] transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              <span>{format(prevDate, 'd MMM', { locale: isRtl ? ar : enUS })}</span>
            </button>
            <span className="opacity-30">|</span>
            <span className="px-1.5 py-0.5 font-label-stamp text-xs text-[#080c12] font-bold">
              {format(dateObj, 'd MMM', { locale: isRtl ? ar : enUS })}
            </span>
            <span className="opacity-30">|</span>
            <button
              type="button"
              onClick={() => onDateChange(format(nextDate, 'yyyy-MM-dd'))}
              className="px-1.5 py-0.5 rounded hover:bg-[#f6f3ed] hover:text-[#080c12] transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>{format(nextDate, 'd MMM', { locale: isRtl ? ar : enUS })}</span>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Date Header */}
        <header className="mb-4 pb-2.5 border-b border-[#e5e2dc]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-[0.18em]">
              {t('daily.horariumTitle')}
            </span>
            <span className="font-label-mono text-xs text-[#675d52] whitespace-nowrap shrink-0">
              {t('app.day')} {dayOfYear} / {totalDays}
            </span>
          </div>
          <h1 className="font-headline-lg text-xl sm:text-2xl text-[#080c12] tracking-normal leading-snug">
            {dayName}, {dayNumber} {monthYear}
          </h1>
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
            {displayPositions.map((pos) => {
              const p = sortedPriorities.find((item) => item.position === pos);
              const isCompleted = p?.isCompleted ?? false;
              const title = p?.title ?? '';
              const roman = romanNumerals[pos - 1];

              if (editingPos === pos) {
                return (
                  <div key={pos} className="flex items-center gap-2 py-1 px-1.5 rounded bg-[#f6f3ed] border border-[#832613]/40 shadow-2xs">
                    <span className="font-label-mono text-xs text-[#832613] font-bold w-6 shrink-0 select-none">
                      {roman}
                    </span>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishEditPriority(pos);
                        if (e.key === 'Escape') setEditingPos(null);
                      }}
                      autoFocus
                      placeholder={t('daily.addPriorityPlaceholder')}
                      className="flex-1 bg-transparent font-body-script text-base text-[#080c12] focus:outline-none placeholder:text-[#675d52]/40"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleFinishEditPriority(pos)}
                        className="p-1 text-[#16a34a] hover:bg-white rounded transition-colors"
                        title={isRtl ? 'حفظ' : 'Save'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPos(null)}
                        className="p-1 text-[#675d52] hover:bg-white rounded transition-colors"
                        title={isRtl ? 'إلغاء' : 'Cancel'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={pos}
                  className="flex items-center justify-between gap-2 group py-1 hover:bg-[#f6f3ed]/70 px-1.5 rounded transition-all"
                >
                  <div
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEditPriority(pos, title)}
                  >
                    <span
                      onClick={(e) => {
                        if (p && title) {
                          e.stopPropagation();
                          onTogglePriority(p);
                        } else {
                          handleStartEditPriority(pos, '');
                        }
                      }}
                      className={`font-label-mono text-xs text-[#832613] font-bold w-6 shrink-0 select-none ${
                        p && title ? 'hover:scale-110 transition-transform' : ''
                      }`}
                      title={
                        p && title
                          ? isCompleted
                            ? t('daily.completed')
                            : t('daily.priority')
                          : t('daily.addPriorityPlaceholder')
                      }
                    >
                      {roman}
                    </span>

                    <span
                      className={`flex-1 truncate transition-all font-body-script text-base ${
                        isCompleted
                          ? 'line-through decoration-[#832613]/70 decoration-1 text-[#675d52] italic'
                          : title
                          ? 'text-[#080c12] group-hover:text-[#832613]'
                          : 'text-[#675d52]/40 italic group-hover:text-[#675d52]/70'
                      }`}
                      title={title ? (isRtl ? 'انقر لتعديل الأولوية' : 'Click to edit priority') : t('daily.addPriorityPlaceholder')}
                    >
                      {title || t('daily.addPriorityPlaceholder')}
                    </span>
                  </div>

                  {/* Action Controls: Edit, Delete, Status Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p && title && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditPriority(pos, title);
                          }}
                          className="p-1 text-[#675d52] hover:text-[#832613] hover:bg-[#e5e2dc]/60 rounded transition-colors"
                          title={t('daily.editPriority')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeletePriority && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePriority(p.id);
                            }}
                            className="p-1 text-[#675d52] hover:text-[#ba1a1a] hover:bg-[#fee2e2] rounded transition-colors"
                            title={t('daily.deletePriority')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePriority(p);
                          }}
                          className={`font-label-stamp text-[10px] uppercase tracking-wider shrink-0 select-none cursor-pointer hover:scale-105 transition-transform px-1.5 py-0.5 rounded border ${
                            isCompleted
                              ? 'text-[#16a34a] border-[#16a34a]/30 bg-[#f0fdf4]'
                              : 'text-[#832613] border-[#832613]/25 bg-[#fdf2f0]'
                          }`}
                          title={isCompleted ? (isRtl ? 'تحديد كغير منجز' : 'Mark incomplete') : (isRtl ? 'تحديد كمنجز' : 'Mark completed')}
                        >
                          {isCompleted ? (isRtl ? 'تم' : 'Done') : (isRtl ? 'أولوية' : 'Priority')}
                        </span>
                      </>
                    )}

                  </div>
                </div>
              );
            })}

            {editingPos === null && nextAvailablePosition !== null && (
              <button
                type="button"
                onClick={() => handleStartEditPriority(nextAvailablePosition, '')}
                className="flex items-center gap-1.5 text-[11px] font-label-stamp uppercase tracking-wider text-[#832613] px-2.5 py-1 rounded border border-dashed border-[#832613]/40 bg-[#fdfbf7] hover:bg-[#832613] hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t('daily.addPriority')}</span>
              </button>
            )}
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
            {(() => {
              const SLOT_HEIGHT = 34; // 34px per 30-min slot (68px per hour)
              const gridStartMin = startHour * 60;
              const gridEndMin = endHour * 60 + 30;

              const toMinutes = (tStr: string) => {
                const [hh, mm] = tStr.split(':').map((n) => parseInt(n, 10));
                return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
              };

              // Prepare positioned events within the visible schedule range
              const positionedEvents = events
                .map((ev) => {
                  const rawStart = toMinutes(ev.startTime);
                  const rawEnd = toMinutes(ev.endTime);
                  const start = Math.max(rawStart, gridStartMin);
                  const end = Math.min(Math.max(rawEnd, start + 30), gridEndMin);
                  return { ev, start, end };
                })
                .filter(({ start, end }) => end > start && start < gridEndMin && end > gridStartMin)
                .sort((a, b) => a.start - b.start || b.end - a.end);

              // Simple overlap column layout
              const laidOutEvents: Array<{
                ev: ScheduleEvent;
                start: number;
                end: number;
                col: number;
                totalCols: number;
              }> = [];

              let group: typeof positionedEvents = [];
              let groupEnd = -1;

              const flushGroup = () => {
                if (group.length === 0) return;
                const colEnds: number[] = [];
                const assigned = group.map((item) => {
                  let col = colEnds.findIndex((cEnd) => cEnd <= item.start);
                  if (col === -1) {
                    col = colEnds.length;
                    colEnds.push(item.end);
                  } else {
                    colEnds[col] = item.end;
                  }
                  return { ...item, col };
                });
                const totalCols = Math.max(1, colEnds.length);
                assigned.forEach((a) => laidOutEvents.push({ ...a, totalCols }));
                group = [];
                groupEnd = -1;
              };

              for (const item of positionedEvents) {
                if (group.length > 0 && item.start >= groupEnd) {
                  flushGroup();
                }
                group.push(item);
                groupEnd = Math.max(groupEnd, item.end);
              }
              flushGroup();

              return (
                <div className="relative">
                  {/* 30-Minute Grid Rows */}
                  <div className="border-b border-[#e5e2dc]/80 text-[#1c1c18]">
                    {timeSlots.map((slot) => {
                      const slotStart = toMinutes(slot);
                      const slotEnd = slotStart + 30;
                      const isHalfHour = slot.endsWith(':30');
                      const isOccupied = laidOutEvents.some(
                        (item) => item.start < slotEnd && item.end > slotStart
                      );
                      const isBoundaryTime = laidOutEvents.some(
                        (item) => item.start === slotStart || item.end === slotStart
                      );

                      return (
                        <div
                          key={slot}
                          style={{ height: `${SLOT_HEIGHT}px` }}
                          className={`relative flex items-center justify-between group hover:bg-[#f6f3ed]/60 transition-colors ${
                            isHalfHour
                              ? 'border-t border-dashed border-[#e5e2dc]/60'
                              : 'border-t border-[#e5e2dc]/90'
                          }`}
                        >
                          {/* Time Label aligned to the top rule */}
                          <span
                            className={`self-start -mt-[7px] font-label-mono leading-none bg-[#fcf9f3] ${
                              isHalfHour ? 'text-[10px]' : 'text-[11px]'
                            } ${
                              isOccupied || isBoundaryTime
                                ? 'text-[#832613] font-bold'
                                : isHalfHour
                                ? 'text-[#675d52]/65'
                                : 'text-[#675d52]'
                            } ${
                              isRtl
                                ? '-mr-11 sm:-mr-14 w-10 sm:w-13 text-left pl-2'
                                : '-ml-11 sm:-ml-14 w-10 sm:w-13 text-right pr-2'
                            } shrink-0 select-none`}
                          >
                            {slot}
                          </span>

                          {/* Clickable empty slot */}
                          <div className="flex-1 h-full px-2 flex items-center">
                            {!isOccupied && (
                              <button
                                type="button"
                                onClick={() => onAddEventClick(slot)}
                                className="text-left rtl:text-right w-full h-full opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-[#675d52]/60 italic font-body-script hover:text-[#832613] transition-opacity cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-[#832613]/70 shrink-0" />
                                <span className="truncate">{t('daily.addEventPrompt')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spanning Event Selection Blocks */}
                  <div className="absolute inset-0 pointer-events-none">
                    {laidOutEvents.map(({ ev, start, end, col, totalCols }) => {
                      const topPx = ((start - gridStartMin) / 30) * SLOT_HEIGHT + 2;
                      const heightPx = Math.max(((end - start) / 30) * SLOT_HEIGHT - 4, 24);
                      const widthPct = 100 / totalCols;
                      const startPct = col * widthPct;
                      const preset = getEventColorPreset(ev.color);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => onEditEventClick(ev)}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            [isRtl ? 'right' : 'left']: `calc(${startPct}% + 6px)`,
                            width: `calc(${widthPct}% - 12px)`,
                            backgroundColor: preset.bg,
                            borderColor: preset.accent,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = preset.hoverBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = preset.bg;
                          }}
                          className={`pointer-events-auto absolute rounded-sm ${
                            isRtl ? 'border-r-[3px]' : 'border-l-[3px]'
                          } px-3.5 py-1 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-2xs`}
                        >
                          <div className="flex flex-col justify-center min-w-0 font-body-script leading-snug">
                            <span className="text-[#080c12] font-medium text-sm sm:text-base whitespace-normal break-words">
                              {ev.title}
                            </span>
                            {ev.description && (
                              <span className="text-[#675d52] italic text-xs whitespace-normal break-words">
                                {ev.description}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-center gap-0.5 shrink-0 leading-tight">
                            <span
                              className="font-label-mono text-[10px] whitespace-nowrap opacity-90"
                              style={{ color: preset.accent }}
                            >
                              {ev.startTime}–{ev.endTime}
                            </span>
                            {ev.category && (
                              <span
                                className="font-label-mono text-[10px] whitespace-nowrap opacity-80"
                                style={{ color: preset.accent }}
                              >
                                {ev.category}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
