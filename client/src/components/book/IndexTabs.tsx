import React from 'react';
import { useTranslation } from 'react-i18next';

export type AgendaSection = 'daily' | 'weekly' | 'monthly' | 'notes' | 'search';

interface IndexTabsProps {
  activeSection: AgendaSection;
  onSelectSection: (section: AgendaSection) => void;
  mobileOnly?: boolean;
}

export const IndexTabs: React.FC<IndexTabsProps> = ({
  activeSection,
  onSelectSection,
  mobileOnly = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const tabs: { id: AgendaSection; label: string }[] = [
    { id: 'daily', label: t('nav.daily') },
    { id: 'weekly', label: t('nav.weekly') },
    { id: 'monthly', label: t('nav.monthly') },
    { id: 'notes', label: t('nav.notes') },
    { id: 'search', label: t('nav.search') },
  ];

  if (mobileOnly) {
    return (
      <div className="flex w-full justify-center">
        <div className="flex items-center gap-1 bg-[#2b0705] p-1 rounded border border-[#490800] shadow-md w-full justify-around">
          {tabs.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectSection(tab.id)}
                className={`flex-1 py-1 px-2 text-xs font-label-stamp uppercase tracking-wider rounded transition-all text-center ${
                  isActive
                    ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-sm'
                    : 'text-[#d2c4b7] hover:text-[#fcf9f3]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`hidden lg:flex absolute top-12 z-40 flex flex-col gap-1.5 ${
        isRtl
          ? '-left-3 sm:-left-7 lg:-left-9 items-start'
          : '-right-3 sm:-right-7 lg:-right-9 items-end'
      }`}
    >
      <nav className="flex flex-col gap-1.5" aria-label="Agenda Sections">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectSection(tab.id)}
              type="button"
              className={`px-3 sm:px-4 py-2 sm:py-2.5 font-label-stamp text-[10px] sm:text-xs tracking-widest uppercase transition-all duration-200 select-none ${
                isRtl ? 'rounded-l-sm sm:rounded-l-md' : 'rounded-r-sm sm:rounded-r-md'
              } ${
                isActive
                  ? `bg-[#fcf9f3] text-[#832613] font-bold ${
                      isRtl
                        ? '-translate-x-1.5 sm:-translate-x-2'
                        : 'translate-x-1.5 sm:translate-x-2'
                    } shadow-[0_2px_8px_rgba(0,0,0,0.22)] border-${
                      isRtl ? 'l' : 'r'
                    } border-t border-b border-[#dcdad4]/60`
                  : `bg-[#ebe8e2] text-[#45474b] hover:bg-[#f0eee8] hover:text-[#1c1c18] shadow-[1px_1px_4px_rgba(0,0,0,0.2)] opacity-90`
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
