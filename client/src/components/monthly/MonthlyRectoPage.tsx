import React from 'react';
import { useTranslation } from 'react-i18next';
import { MonthlyAgendaResponse, MonthlyDaySummary } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface MonthlyRectoPageProps {
  currentDate: string;
  monthlyData: MonthlyAgendaResponse | null;
  onOpenDayAgenda: (date: string) => void;
}

export const MonthlyRectoPage: React.FC<MonthlyRectoPageProps> = ({
  currentDate,
  monthlyData,
  onOpenDayAgenda,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const days = monthlyData?.days || [];
  const partTwoDays = days.filter((d) => {
    const dayNum = parseInt(d.date.slice(8, 10), 10);
    return dayNum > 15;
  });

  const renderDayCell = (day: MonthlyDaySummary) => {
    const dayNum = parseInt(day.date.slice(8, 10), 10);
    const hasActivity = day.totalTasks > 0 || day.totalEvents > 0 || day.hasNote;
    const isSelected = day.date === currentDate;

    return (
      <div
        key={day.date}
        onClick={() => onOpenDayAgenda(day.date)}
        className={`min-h-[58px] sm:min-h-[68px] p-1.5 sm:p-2 bg-[#fcf9f3] hover:bg-[#f6f3ed] cursor-pointer transition-colors relative flex flex-col justify-between border border-[#e5e2dc]/60 ${
          isSelected ? 'ring-1 ring-[#832613] bg-[#f6f3ed]' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <span
            className={`font-label-mono text-xs font-semibold ${
              isSelected ? 'text-[#832613] font-bold' : 'text-[#080c12]'
            }`}
          >
            {dayNum}
          </span>

          {hasActivity && (
            <div className="flex items-center gap-1">
              {day.totalEvents > 0 && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#832613]"
                  title={`${day.totalEvents} appointments`}
                ></span>
              )}
              {day.totalTasks > 0 && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#2d5a46]"
                  title={`${day.totalTasks} tasks`}
                ></span>
              )}
              {day.hasNote && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"
                  title="Folio Notes written"
                ></span>
              )}
            </div>
          )}
        </div>

        <div className="mt-1 space-y-0.5 overflow-hidden">
          {day.events.slice(0, 1).map((ev) => (
            <p
              key={ev.id}
              className="font-body-script text-[11px] text-[#080c12] truncate leading-tight"
            >
              • {ev.title}
            </p>
          ))}
          {day.totalTasks > 0 && (
            <span className="font-label-stamp text-[9px] text-[#675d52] block">
              {day.completedTasks}/{day.totalTasks} {t('daily.completed')}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Header Strip */}
        <header className="flex flex-col gap-1.5 pb-3 border-b border-[#e5e2dc]">
          <div className="flex items-center justify-between font-label-mono text-xs text-[#675d52] tracking-wider uppercase">
            <span>{isRtl ? 'صحيفة ٧٥ · وجه الصحيفة' : 'Folio 75 · Recto'}</span>
            <span className="tracking-widest font-bold text-[#080c12]">{isRtl ? 'رقم ١٤٧' : 'N° 147'}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-caption-caps text-caption-caps text-[#832613] tracking-widest uppercase font-semibold">
              {t('monthly.partTwo')}
            </span>
            <span className="font-label-mono text-[10px] text-[#675d52]">
              {isRtl ? 'الأسابيع ٤٢–٤٤' : 'Hebdomas 42–44'}
            </span>
          </div>
        </header>

        {/* Section: Calendar Grid Part II (Days 16+) */}
        <section className="mt-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {partTwoDays.map(renderDayCell)}
          </div>
        </section>

        {/* Section: Memoranda & Epistolary Register */}
        <section className="mt-5 pt-3 border-t border-[#e5e2dc] p-3 rounded-sm min-h-[180px] bg-[#fdfbf7]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-widest font-semibold">
              {t('monthly.memorandaTitle')}
            </span>
            <span className="font-label-stamp text-[9px] text-[#675d52] opacity-70">
              {isRtl ? 'أكتوبر ٢٥' : 'OCTOBER \'25'}
            </span>
          </div>
          <div className="space-y-2 font-body-script text-sm text-[#080c12] leading-[24px]">
            {isRtl ? (
              <>
                <p>
                  <span className="font-medium text-[#832613]">• إرسال:</span> شحنة عينات الجلود الأرشيفية المجلدة إلى المشاغل التخصصية.
                </p>
                <p>
                  <span className="font-medium text-[#832613]">• تدقيق:</span> مراجعة محاذاة العلامات المائية على ورق المخطوطات الفاخر.
                </p>
                <p className="italic text-[#675d52]">
                  «يبقى السجل حياً ما دامت كل ضربة قلم تُقدّر وقار اليوم دون تعجل.»
                </p>
              </>
            ) : (
              <>
                <p>
                  <span className="font-medium text-[#832613]">• Dispatch:</span> Consignment
                  of archival morocco leather samples shipped to Brussels binderies.
                </p>
                <p>
                  <span className="font-medium text-[#832613]">• Verification:</span> Verify
                  register watermark alignment on 1928 French laid paper reams.
                </p>
                <p className="italic text-[#675d52]">
                  “A ledger remains living so long as each stroke of ink honors the day's
                  unhurried weight.”
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      <PageFooter side="right" pageNumber={147} subText={t('app.smythsonParis')} />
    </div>
  );
};
