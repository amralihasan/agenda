import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { WeeklyAgendaResponse, Task } from '../../types';
import { PageFooter } from '../book/PageFooter';
import { VoiceNoteSection } from '../audio/VoiceNoteSection';
import { ImageAttachmentSection } from '../media/ImageAttachmentSection';
import { CodeOrTextEditor } from '../notes/CodeOrTextEditor';

interface WeeklyRectoPageProps {
  weeklyData: WeeklyAgendaResponse | null;
  onOpenDayAgenda: (date: string) => void;
  onSaveWeeklyPlan: (weekStartDate: string, data: any) => Promise<void>;
  onToggleTask: (task: Task) => void;
}

export const WeeklyRectoPage: React.FC<WeeklyRectoPageProps> = ({
  weeklyData,
  onOpenDayAgenda,
  onSaveWeeklyPlan,
  onToggleTask,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [weeklyNotes, setWeeklyNotes] = useState(
    weeklyData?.weeklyPlan?.notes || ''
  );
  const [noteType, setNoteType] = useState<'text' | 'code'>(
    weeklyData?.weeklyPlan?.noteType || 'text'
  );

  useEffect(() => {
    if (weeklyData?.weeklyPlan?.notes !== undefined) {
      setWeeklyNotes(weeklyData.weeklyPlan.notes || '');
      setNoteType(weeklyData.weeklyPlan.noteType || 'text');
    }
  }, [weeklyData]);

  const handleSaveNotesBlur = (newContent = weeklyNotes, newType = noteType) => {
    if (!weeklyData) return;
    onSaveWeeklyPlan(weeklyData.weekStartDate, {
      notes: newContent,
      noteType: newType,
    });
  };

  const days = weeklyData?.days || [];
  const rectoDays = days.slice(3, 7);
  const dateObj = weeklyData?.weekStartDate ? parseISO(weeklyData.weekStartDate) : new Date();
  const monthYearLabel = format(dateObj, 'MMMM yyyy', {
    locale: isRtl ? ar : enUS,
  }).toUpperCase();

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Header Strip */}
        <div className="flex items-baseline justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/60">
          <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-[0.2em] font-semibold">
            {isRtl ? 'السجل الأسبوعي · القسم الثاني' : 'Weekly Register · Part Two'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-label-stamp text-[10px] text-[#675d52]">
              {isRtl ? 'وجه الصحيفة' : 'RECTO'}
            </span>
            <span className="font-label-mono text-xs text-[#675d52]">{isRtl ? 'رقم ١٤٥' : 'N° 145'}</span>
          </div>
        </div>

        {/* Section: Days 4 to 7 */}
        <section className="flex flex-col gap-3 pt-1">
          {rectoDays.map((day) => {
            const isToday = day.date === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={day.date}
                className={`border-b border-[#e5e2dc]/70 pb-2.5 transition-colors ${
                  isToday ? 'bg-[#f6f3ed]/60 px-2 rounded-sm' : ''
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => onOpenDayAgenda(day.date)}
                      className="font-headline text-base text-[#080c12] hover:text-[#832613] cursor-pointer font-medium uppercase tracking-wide"
                    >
                      {day.dayName}
                    </span>
                    <span className="font-label-mono text-xs text-[#675d52]">
                      {day.dayNumber}
                    </span>
                    {isToday && (
                      <span className="font-label-stamp text-[9px] text-[#832613] uppercase bg-[#490800]/10 px-1 py-0.2 rounded font-semibold">
                        {t('weekly.currentDay')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onOpenDayAgenda(day.date)}
                    className="font-label-mono text-[10px] text-[#675d52] hover:text-[#832613] flex items-center gap-0.5"
                  >
                    <span>{t('weekly.openDayAgenda')}</span>
                  </button>
                </div>

                {/* Day Inscriptions preview */}
                <div className="space-y-1 pl-1">
                  {day.events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-1.5 font-label-mono text-xs text-[#080c12]"
                    >
                      <span className="text-[#832613] font-semibold">
                        {ev.startTime}
                      </span>
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}

                  {day.tasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task)}
                      className="flex items-baseline gap-2 cursor-pointer group"
                    >
                      <span className="text-xs text-[#080c12]">
                        {task.isCompleted ? '☑' : '☐'}
                      </span>
                      <span
                        className={`truncate ${
                          task.isCompleted
                            ? 'line-through text-[#675d52] italic'
                            : 'text-[#080c12]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Section: Dedicated Weekly Notes Area with Notebook Lines */}
        <section className="mt-4 pt-2 border-t border-[#e5e2dc] rounded-sm p-3 min-h-[160px] relative bg-[#fcf9f3]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-widest font-semibold">
              {t('weekly.notesTitle')}
            </span>
            <span className="font-label-stamp text-[9px] text-[#675d52] opacity-70">
              {monthYearLabel}
            </span>
          </div>

          {weeklyData?.weekStartDate && (
            <div className="space-y-1.5 mb-2">
              <VoiceNoteSection
                targetType="weekly"
                targetId={weeklyData.weekStartDate}
                onTranscribeText={(text) => {
                  setWeeklyNotes((prev) => {
                    const updated = prev ? prev + ' ' + text : text;
                    onSaveWeeklyPlan(weeklyData.weekStartDate, { notes: updated });
                    return updated;
                  });
                }}
              />
              <ImageAttachmentSection
                targetType="weekly"
                targetId={weeklyData.weekStartDate}
              />
            </div>
          )}

          <CodeOrTextEditor
            content={weeklyNotes}
            onChange={(val) => {
              setWeeklyNotes(val);
              handleSaveNotesBlur(val, noteType);
            }}
            noteType={noteType}
            onNoteTypeChange={(type) => {
              setNoteType(type);
              handleSaveNotesBlur(weeklyNotes, type);
            }}
            paperStyle="ruled"
            rows={10}
            minHeight="280px"
            placeholder={
              isRtl
                ? 'دوّن الملاحظات الأسبوعية والتفاصيل التنفيذية...'
                : 'Inscribe overall weekly observations and notes...'
            }
          />
        </section>
      </div>

      <PageFooter side="right" pageNumber={145} subText={t('app.smythsonParis')} />
    </div>
  );
};
