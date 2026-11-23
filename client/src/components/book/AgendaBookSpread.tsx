import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookSpine } from './BookSpine';
import { IndexTabs, AgendaSection } from './IndexTabs';

interface AgendaBookSpreadProps {
  activeSection: AgendaSection;
  onSelectSection: (section: AgendaSection) => void;
  leftPage?: React.ReactNode;
  rightPage?: React.ReactNode;
  singlePage?: React.ReactNode;
  mobilePage?: 'left' | 'right';
  onMobilePageChange?: (page: 'left' | 'right') => void;
}

export const AgendaBookSpread: React.FC<AgendaBookSpreadProps> = ({
  activeSection,
  onSelectSection,
  leftPage,
  rightPage,
  singlePage,
  mobilePage: externalMobilePage,
  onMobilePageChange,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [internalMobilePage, setInternalMobilePage] = useState<'left' | 'right'>('left');

  const mobilePage = externalMobilePage ?? internalMobilePage;
  const setMobilePage = (page: 'left' | 'right') => {
    if (onMobilePageChange) {
      onMobilePageChange(page);
    } else {
      setInternalMobilePage(page);
    }
  };

  return (
    <div className="relative w-full max-w-[1360px] mx-auto pt-1 pb-6 sm:pb-10 px-1 sm:px-6 lg:px-10 flex flex-col items-center">
      {/* Mobile Top Controls: Section Tabs + Page Flipper */}
      <div className="flex lg:hidden flex-col items-center w-full max-w-md gap-2 mb-3">
        {/* Horizontal Section Tabs */}
        <IndexTabs
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          mobileOnly
        />

        {/* Mobile Page Toggle (Verso / Recto) */}
        {!singlePage && (
        <div className="flex items-center justify-between w-full bg-[#2d0705] border border-[#490800] p-1 rounded shadow-md">
          <button
            onClick={() => setMobilePage('left')}
            className={`flex-1 py-1.5 px-2 sm:px-3 font-label-stamp text-xs tracking-wider rounded transition-all ${
              mobilePage === 'left'
                ? 'bg-[#fcf9f3] text-[#1c1c18] font-bold shadow-sm'
                : 'text-[#d2c4b7] hover:text-[#fcf9f3]'
            }`}
          >
            <span className="hidden sm:inline">
              {isRtl ? '← ' + t('daily.viewRecto') : '← ' + t('daily.viewVerso')}
            </span>
            <span className="sm:hidden">
              {isRtl ? '← ' + t('daily.viewRectoShort') : '← ' + t('daily.viewVersoShort')}
            </span>
          </button>
          <button
            onClick={() => setMobilePage('right')}
            className={`flex-1 py-1.5 px-2 sm:px-3 font-label-stamp text-xs tracking-wider rounded transition-all ${
              mobilePage === 'right'
                ? 'bg-[#fcf9f3] text-[#1c1c18] font-bold shadow-sm'
                : 'text-[#d2c4b7] hover:text-[#fcf9f3]'
            }`}
          >
            <span className="hidden sm:inline">
              {isRtl ? t('daily.viewVerso') + ' →' : t('daily.viewRecto') + ' →'}
            </span>
            <span className="sm:hidden">
              {isRtl ? t('daily.viewVersoShort') + ' →' : t('daily.viewRectoShort') + ' →'}
            </span>
          </button>
        </div>
        )}
      </div>

      {/* Main Bound Volume Spread */}
      <div className="relative w-full bg-[#fcf9f3] rounded-sm sm:rounded-md shadow-book flex flex-col min-h-[780px] lg:min-h-[820px] border border-[#e5e2dc]/60">
        {/* Spine & Center Ribbon (Desktop) */}
        {!singlePage && <BookSpine />}

        {/* Die-Cut Navigation Tabs (Desktop) */}
        <IndexTabs
          activeSection={activeSection}
          onSelectSection={onSelectSection}
        />

        {/* Folio Pages Content */}
        <div className="w-full flex-1 relative z-20 flex flex-col">
          {singlePage ? (
            singlePage
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-[#e5e2dc]/40 relative">
              {/* Left Page (Verso in LTR) */}
              <div
                className={`w-full min-h-[740px] flex flex-col justify-between p-3 sm:p-6 lg:p-10 ${
                  isRtl ? 'lg:pl-10 lg:pr-12' : 'lg:pr-10 lg:pl-12'
                } bg-[#fcf9f3] ${
                  mobilePage === 'left' ? 'block' : 'hidden lg:flex'
                }`}
              >
                {leftPage}
              </div>

              {/* Right Page (Recto in LTR) */}
              <div
                className={`w-full min-h-[740px] flex flex-col justify-between p-3 sm:p-6 lg:p-10 ${
                  isRtl ? 'lg:pr-10 lg:pl-12' : 'lg:pl-10 lg:pr-12'
                } bg-[#fdfbf7] ${
                  mobilePage === 'right' ? 'block' : 'hidden lg:flex'
                }`}
              >
                {rightPage}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
