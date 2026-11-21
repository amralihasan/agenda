import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  Languages,
  BookOpen,
} from 'lucide-react';
import { setAppLanguage } from '../../i18n/i18n';
import { AgendaSection } from './IndexTabs';

interface HeaderBannerProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  onOpenSettings: () => void;
  activeSection?: AgendaSection;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  currentDate,
  onDateChange,
  onOpenSettings,
  activeSection = 'daily',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateObj = parseISO(currentDate);

  const formattedDateFull = format(
    dateObj,
    isRtl ? 'EEEE، d MMMM yyyy' : 'EEEE · d MMMM yyyy',
    { locale: isRtl ? ar : enUS }
  );

  const formattedDateShort = format(
    dateObj,
    isRtl ? 'd MMMM yyyy' : 'd MMM yyyy',
    { locale: isRtl ? ar : enUS }
  );

  const handlePrev = () => {
    let prev: Date;
    if (activeSection === 'weekly') {
      prev = subWeeks(dateObj, 1);
    } else if (activeSection === 'monthly') {
      prev = subMonths(dateObj, 1);
    } else {
      prev = subDays(dateObj, 1);
    }
    onDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNext = () => {
    let next: Date;
    if (activeSection === 'weekly') {
      next = addWeeks(dateObj, 1);
    } else if (activeSection === 'monthly') {
      next = addMonths(dateObj, 1);
    } else {
      next = addDays(dateObj, 1);
    }
    onDateChange(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    setAppLanguage(nextLang);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a0302]/95 backdrop-blur-md border-b border-[#380a08] shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1440px] mx-auto h-14 sm:h-16 px-3 sm:px-6 lg:px-10 flex items-center justify-between">
        {/* Left: Book Crest */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#490800] border border-[#832613]/50 flex items-center justify-center text-[#da664d] shadow-sm">
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-caption-caps text-caption-caps uppercase text-[#d2c4b7] tracking-widest font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {t('app.title')}
            </span>
            <span className="hidden md:inline-block ml-2 font-label-stamp text-[10px] text-[#da664d] bg-[#490800]/60 px-1.5 py-0.5 rounded tracking-widest uppercase">
              {t('app.subtitle')}
            </span>
          </div>
        </div>

        {/* Center: Pagination & Date Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Previous Page Button - Always goes backward */}
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1 font-label-mono text-xs text-[#d2c4b7] hover:text-[#fcf9f3] p-1 sm:px-2 sm:py-1 rounded transition-colors group cursor-pointer"
            title={t('app.prevPage')}
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="hidden lg:inline">{t('app.prevPage')}</span>
          </button>

          {/* Today Button / Date Indicator */}
          <div
            onClick={handleToday}
            className="flex items-center gap-1 sm:gap-1.5 font-label-stamp text-[11px] sm:text-xs text-[#da664d] bg-[#490800]/50 hover:bg-[#490800] border border-[#da664d]/30 px-2 sm:px-3 py-1 rounded cursor-pointer transition-all shadow-inner whitespace-nowrap"
            title={t('app.today')}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="capitalize hidden sm:inline">{formattedDateFull}</span>
            <span className="capitalize sm:hidden text-[11px]">{formattedDateShort}</span>
          </div>

          {/* Next Page Button - Always goes forward */}
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 font-label-mono text-xs text-[#d2c4b7] hover:text-[#fcf9f3] p-1 sm:px-2 sm:py-1 rounded transition-colors group cursor-pointer"
            title={t('app.nextPage')}
          >
            <span className="hidden lg:inline">{t('app.nextPage')}</span>
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Language switch & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded bg-[#380a08]/80 hover:bg-[#490800] border border-[#da664d]/30 text-[11px] sm:text-xs font-label-mono text-[#fcf9f3] transition-colors cursor-pointer"
            title={isRtl ? 'تبديل اللغة (English / العربية)' : 'Switch Language (English / العربية)'}
          >
            <Languages className="w-3.5 h-3.5 text-[#da664d]" />
            <span className="font-semibold">{i18n.language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#380a08]/80 hover:bg-[#490800] border border-[#da664d]/30 flex items-center justify-center text-[#d2c4b7] hover:text-[#fcf9f3] transition-colors cursor-pointer"
            title={t('settings.title')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
