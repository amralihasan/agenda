import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MonthlyAgendaResponse, MonthlyDaySummary } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface MonthlyVersoPageProps {
  currentDate: string;
  monthlyData: MonthlyAgendaResponse | null;
  onDateChange: (date: string) => void;
  onOpenDayAgenda: (date: string) => void;
}

export const MonthlyVersoPage: React.FC<MonthlyVersoPageProps> = ({
  currentDate,
  monthlyData,
  onDateChange,
  onOpenDayAgenda,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateObj = parseISO(currentDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  const defaultIntentions = isRtl
    ? [
        {
          id: '1',
          numeral: '١.',
          text: 'إنجاز المخطوطة الأرشيفية ودراسة فصول السجل الاستراتيجي.',
          isCompleted: true,
        },
        {
          id: '2',
          numeral: '٢.',
          text: 'معرض الخط والطباعة: اقتناء ورق قطني معتق وعينات جلد فاخرة.',
          isCompleted: false,
        },
        {
          id: '3',
          numeral: '٣.',
          text: 'إعادة تهيئة مشغل التجليد: ضبط أوزان المكبس الحديدي والألواح.',
          isCompleted: false,
        },
        {
          id: '4',
          numeral: '٤.',
          text: 'التدقيق الأرشيفي: فهرسة الوثائق والمراسلات المحفوظة بالأختام.',
          isCompleted: false,
        },
      ]
    : [
        {
          id: '1',
          numeral: 'I.',
          text: 'Complete first draft: Smythson Archive Monograph chapters 4 through 7.',
          isCompleted: true,
        },
        {
          id: '2',
          numeral: 'II.',
          text: 'Paris Bibliophile Salon: Acquire hand-marbled endpapers and goat vellum samples.',
          isCompleted: false,
        },
        {
          id: '3',
          numeral: 'III.',
          text: 'Bookbinding Studio Refit: Cast iron nipping press installation & platen calibration.',
          isCompleted: false,
        },
        {
          id: '4',
          numeral: 'IV.',
          text: 'Archival Inventory Audit: Catalog watermarked rag stock (1910–1940 mill batches).',
          isCompleted: false,
        },
      ];

  const [intentions, setIntentions] = useState(defaultIntentions);

  React.useEffect(() => {
    setIntentions(defaultIntentions);
  }, [isRtl]);

  const toggleIntention = (id: string) => {
    setIntentions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newDateStr = `${newYear}-${newMonth.toString().padStart(2, '0')}-01`;
    onDateChange(newDateStr);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const newDateStr = `${newYear}-${newMonth.toString().padStart(2, '0')}-01`;
    onDateChange(newDateStr);
  };

  const days = monthlyData?.days || [];
  const partOneDays = days.filter((d) => {
    const dayNum = parseInt(d.date.slice(8, 10), 10);
    return dayNum <= 15;
  });

  const monthYearLabel = format(dateObj, 'MMMM yyyy', {
    locale: isRtl ? ar : enUS,
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
        {/* Folio Running Header */}
        <header className="flex flex-col gap-1.5 pb-3 border-b border-[#e5e2dc]">
          <div className="flex items-center justify-between font-label-mono text-xs text-[#675d52] tracking-wider uppercase">
            <span>{isRtl ? 'صحيفة ٧٤ · ظهر الصحيفة' : 'Folio 74 · Verso'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="hover:text-[#832613] px-1 transition-colors"
              >
                {isRtl ? '→' : '←'}
              </button>
              <span className="tracking-widest font-bold text-[#080c12] text-sm">
                {monthYearLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="hover:text-[#832613] px-1 transition-colors"
              >
                {isRtl ? '←' : '→'}
              </button>
            </div>
            <span className="tracking-widest font-bold text-[#080c12]">{isRtl ? 'رقم ١٤٦' : 'N° 146'}</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#080c12] font-normal tracking-wide">
                {t('monthly.title')}
              </h1>
              <p className="font-body-sm text-xs text-[#675d52] italic">
                {t('monthly.subtitle')}
              </p>
            </div>
            <span className="font-label-stamp text-[10px] text-[#832613] px-2 py-0.5 rounded bg-[#490800]/20 tracking-widest uppercase">
              {isRtl ? 'الربع الرابع · دورة الخريف' : 'Q4 · Autumnal Term'}
            </span>
          </div>
        </header>

        {/* Section 1: Monthly Intentions & Strategic Milestones */}
        <section className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-caption-caps text-caption-caps text-[#832613] tracking-widest uppercase flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#832613] inline-block"></span>
              <span>{t('monthly.intentionsTitle')}</span>
            </h2>
            <span className="font-label-mono text-[10px] text-[#675d52] italic">
              {isRtl ? 'بروية وسكينة' : 'Aequo animo'}
            </span>
          </div>

          <div className="space-y-1.5 font-body-md text-sm text-[#080c12]">
            {intentions.map((item) => (
              <div key={item.id} className="flex items-start gap-2 group py-0.5">
                <span className="font-headline-sm text-sm text-[#832613] w-5 select-none shrink-0 font-serif">
                  {item.numeral}
                </span>
                <div
                  onClick={() => toggleIntention(item.id)}
                  className="flex-1 cursor-pointer"
                >
                  <p
                    className={`leading-tight ${
                      item.isCompleted
                        ? 'line-through text-[#675d52] italic'
                        : 'text-[#080c12]'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleIntention(item.id)}
                  className={`shrink-0 mt-0.5 w-3.5 h-3.5 border flex items-center justify-center transition-colors text-[9px] ${
                    item.isCompleted
                      ? 'bg-[#080c12] text-[#fcf9f3] border-[#080c12]'
                      : 'bg-[#f0eee8] border-[#76777c]/40 hover:border-[#080c12]'
                  }`}
                >
                  {item.isCompleted && '✓'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Letterpress Calendar Grid Part I (Days 1 to 15) */}
        <section className="mt-3">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]">
            <span className="font-caption-caps text-caption-caps tracking-widest text-[#080c12] uppercase font-semibold">
              {t('monthly.partOne')}
            </span>
            <span className="font-label-mono text-[10px] text-[#675d52]">
              {isRtl ? 'الأسابيع ٤٠–٤٢' : 'Hebdomas 40–42'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {partOneDays.map(renderDayCell)}
          </div>
        </section>
      </div>

      <PageFooter side="left" pageNumber={146} subText={isRtl ? 'القسم الأول · السجل الشهري' : 'Pars Prima · Liber Menstruus'} />
    </div>
  );
};
