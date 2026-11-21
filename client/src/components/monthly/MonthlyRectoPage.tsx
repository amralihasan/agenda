import React from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MonthlyAgendaResponse, MonthlyDaySummary } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface MonthlyRectoPageProps {
  currentDate: string;
  monthlyData: MonthlyAgendaResponse | null;
  onDateChange: (date: string) => void;
  onOpenDayAgenda: (date: string) => void;
  firstDayOfWeek: number;
}

export const MonthlyRectoPage: React.FC<MonthlyRectoPageProps> = ({
  currentDate,
  monthlyData,
  onDateChange,
  onOpenDayAgenda,
  firstDayOfWeek,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const dateObj = parseISO(currentDate);
  const year = monthlyData?.year ?? dateObj.getFullYear();
  const month = monthlyData?.month ?? dateObj.getMonth() + 1;
  const monthDate = new Date(year, month - 1, 1);
  const weekStartsOn = (firstDayOfWeek ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const monthYearLabel = format(monthDate, 'MMMM yyyy', {
    locale: isRtl ? ar : enUS,
  });

  const weekStart = startOfWeek(monthDate, { weekStartsOn });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    format(addDays(weekStart, index), 'EEE', { locale: isRtl ? ar : enUS })
  );
  const leadingBlanks = (monthDate.getDay() - weekStartsOn + 7) % 7;

  const days = monthlyData?.days || [];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    onDateChange(format(prev, 'yyyy-MM-01'));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    onDateChange(format(next, 'yyyy-MM-01'));
  };

  const renderDayCell = (day: MonthlyDaySummary) => {
    const dayNum = parseInt(day.date.slice(8, 10), 10);
    const hasActivity = day.totalTasks > 0 || day.totalEvents > 0 || day.hasNote;
    const isSelected = day.date === currentDate;

    return (
      <div
        key={day.date}
        onClick={() => onOpenDayAgenda(day.date)}
        className={`min-h-[72px] sm:min-h-[80px] p-1.5 bg-[#fcf9f3] hover:bg-[#f6f3ed] cursor-pointer transition-colors relative flex flex-col justify-between border border-[#e5e2dc]/60 ${
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
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="hover:text-[#832613] px-1 transition-colors"
                title={isRtl ? 'الشهر السابق' : 'Previous month'}
              >
                {isRtl ? '→' : '←'}
              </button>
              <span className="tracking-widest font-bold text-[#080c12] text-sm">
                {monthYearLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="hover:text-[#832613] px-1 transition-colors"
                title={isRtl ? 'الشهر التالي' : 'Next month'}
              >
                {isRtl ? '←' : '→'}
              </button>
            </div>
            <span className="tracking-widest font-bold text-[#080c12]">
              {isRtl ? 'رقم ١٤٧' : 'N° 147'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="font-caption-caps text-caption-caps text-[#832613] tracking-widest uppercase font-semibold">
              {t('monthly.fullCalendar')}
            </span>
            <span className="font-label-mono text-[10px] text-[#675d52]">
              {isRtl ? 'التقويم السنوي · السجل الشهري' : 'Annum · Liber Menstruus'}
            </span>
          </div>
        </header>

        {/* Full month calendar grid */}
        <section className="mt-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdayLabels.map((label) => (
              <span
                key={label}
                className="text-center font-label-stamp text-[10px] uppercase tracking-wider text-[#675d52] py-0.5"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <div key={`blank-${index}`} className="min-h-[72px] sm:min-h-[80px]" />
            ))}
            {days.map(renderDayCell)}
          </div>
        </section>
      </div>

      <PageFooter side="right" pageNumber={147} subText={t('app.smythsonParis')} />
    </div>
  );
};
