import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { WeeklyAgendaResponse } from '../../types';
import { PageFooter } from '../book/PageFooter';
import { VoiceNoteSection } from '../audio/VoiceNoteSection';
import { ImageAttachmentSection } from '../media/ImageAttachmentSection';
import { CodeOrTextEditor } from '../notes/CodeOrTextEditor';

interface WeeklyRectoPageProps {
  weeklyData: WeeklyAgendaResponse | null;
  onSaveWeeklyPlan: (weekStartDate: string, data: any) => Promise<void>;
}

export const WeeklyRectoPage: React.FC<WeeklyRectoPageProps> = ({
  weeklyData,
  onSaveWeeklyPlan,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [weeklyNotes, setWeeklyNotes] = useState(
    weeklyData?.weeklyPlan?.notes || ''
  );
  const [noteType, setNoteType] = useState<'text' | 'code'>(
    weeklyData?.weeklyPlan?.noteType || 'text'
  );

  // Only rehydrate when the displayed week changes. Saving the same week must
  // not overwrite what the user is typing (which reset the caret to the start).
  useEffect(() => {
    if (weeklyData?.weeklyPlan?.notes !== undefined) {
      setWeeklyNotes(weeklyData.weeklyPlan.notes || '');
      setNoteType(weeklyData.weeklyPlan.noteType || 'text');
    }
  }, [weeklyData?.weekStartDate]);

  const notesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingNotesSave = () => {
    if (notesSaveTimerRef.current) {
      clearTimeout(notesSaveTimerRef.current);
      notesSaveTimerRef.current = null;
    }
  };

  const saveNotesNow = (content: string, type: 'text' | 'code') => {
    cancelPendingNotesSave();
    if (!weeklyData?.weekStartDate) return;
    onSaveWeeklyPlan(weeklyData.weekStartDate, {
      notes: content,
      noteType: type,
    });
  };

  const scheduleNotesSave = (content: string, type: 'text' | 'code') => {
    cancelPendingNotesSave();
    if (!weeklyData?.weekStartDate) return;
    // Capture the week so a pending save still targets the right week if the
    // user navigates away before the debounce fires.
    const weekStartDate = weeklyData.weekStartDate;
    notesSaveTimerRef.current = setTimeout(() => {
      notesSaveTimerRef.current = null;
      onSaveWeeklyPlan(weekStartDate, { notes: content, noteType: type });
    }, 700);
  };

  useEffect(() => cancelPendingNotesSave, []);

  const dateObj = weeklyData?.weekStartDate ? parseISO(weeklyData.weekStartDate) : new Date();
  const monthYearLabel = format(dateObj, 'MMMM yyyy', {
    locale: isRtl ? ar : enUS,
  }).toUpperCase();

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div className="flex-1 flex flex-col">
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

        {/* Section: Dedicated Weekly Notes Area with Notebook Lines */}
        <section className="mt-4 pt-2 border-t border-[#e5e2dc] rounded-sm p-3 min-h-[520px] relative bg-[#fcf9f3] flex-1 flex flex-col">
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
                  cancelPendingNotesSave();
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
            key={`weekly-editor-${weeklyData?.weekStartDate || 'default'}`}
            content={weeklyNotes}
            onChange={(val) => {
              setWeeklyNotes(val);
              scheduleNotesSave(val, noteType);
            }}
            noteType={noteType}
            onNoteTypeChange={(type) => {
              setNoteType(type);
              saveNotesNow(weeklyNotes, type);
            }}
            paperStyle="ruled"
            rows={18}
            minHeight="460px"
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
