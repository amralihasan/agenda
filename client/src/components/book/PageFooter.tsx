import React from 'react';
import { useTranslation } from 'react-i18next';

interface PageFooterProps {
  side: 'left' | 'right';
  pageNumber: number | string;
  subText?: string;
}

export const PageFooter: React.FC<PageFooterProps> = ({
  side,
  pageNumber,
  subText,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <footer className="mt-6 pt-2.5 flex items-center justify-between text-[#675d52] border-t border-[#e5e2dc]/80 select-none text-xs">
      {side === 'left' ? (
        <>
          <span className="font-label-mono text-[11px] tracking-widest uppercase opacity-80">
            {subText || t('app.bookbinding')}
          </span>
          <span className="font-caption-caps text-caption-caps tracking-widest font-semibold text-[#1c1c18]">
            {isRtl ? `ص. ${pageNumber}` : `Page ${pageNumber}`}
          </span>
        </>
      ) : (
        <>
          <span className="font-caption-caps text-caption-caps tracking-widest font-semibold text-[#1c1c18]">
            {isRtl ? `ص. ${pageNumber}` : `Page ${pageNumber}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-label-mono text-[11px] tracking-widest uppercase opacity-80">
              {subText || t('app.smythsonParis')}
            </span>
          </div>
        </>
      )}
    </footer>
  );
};
