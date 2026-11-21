import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Languages,
  Calendar,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { setAppLanguage } from '../../i18n/i18n';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onDataRestored,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [language, setLanguage] = useState<'en' | 'ar'>(settings.language || 'en');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(settings.firstDayOfWeek ?? 1);
  const [startHour, setStartHour] = useState(settings.startHour ?? 6);
  const [endHour, setEndHour] = useState(settings.endHour ?? 22);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Keep the form in sync with the persisted settings, so the selector always
  // reflects the saved default language (and other preferences) when opened.
  useEffect(() => {
    setLanguage(settings.language || 'ar');
    setFirstDayOfWeek(settings.firstDayOfWeek ?? 1);
    setStartHour(settings.startHour ?? 6);
    setEndHour(settings.endHour ?? 22);
  }, [
    isOpen,
    settings.language,
    settings.firstDayOfWeek,
    settings.startHour,
    settings.endHour,
  ]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateSettings({
        language,
        firstDayOfWeek: Number(firstDayOfWeek),
        startHour: Number(startHour),
        endHour: Number(endHour),
      });

      if (language !== i18n.language) {
        setAppLanguage(language);
      }

      setStatusMessage(t('settings.saveSuccess'));
      setIsError(false);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(isRtl ? 'تعذر حفظ الإعدادات.' : (err.message || 'Failed to save settings.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    window.open(api.exportBackupUrl(), '_blank');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setLoading(true);
      await api.importBackup(parsed);
      setIsError(false);
      setStatusMessage(t('settings.importSuccess'));
      onDataRestored();
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(isRtl ? 'تعذر استعادة البيانات من الملف.' : (err.message || 'Failed to import backup.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 select-text">
      <div className="relative w-full max-w-lg bg-[#fcf9f3] text-[#1c1c18] rounded-sm p-6 sm:p-8 shadow-book border border-[#dcdad4]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e5e2dc]">
          <h3 className="font-headline-md text-xl sm:text-2xl text-[#1e2229]">
            {t('settings.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:text-[#832613] text-[#675d52] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded mb-4 text-xs flex items-center gap-2 ${
              isError
                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                : 'bg-[#d8e8dd] text-[#2d5a46]'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1.5 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-[#832613]" />
              <span>{t('settings.language')}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 text-xs font-label-mono text-left rounded-sm border transition-all ${
                  language === 'en'
                    ? 'bg-[#f0eee8] border-[#832613] font-bold text-[#832613]'
                    : 'bg-[#fcf9f3] border-[#dcdad4] text-[#45474b]'
                }`}
              >
                {t('settings.languageEn')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`py-2 px-3 text-xs font-label-mono text-right rounded-sm border transition-all ${
                  language === 'ar'
                    ? 'bg-[#f0eee8] border-[#832613] font-bold text-[#832613]'
                    : 'bg-[#fcf9f3] border-[#dcdad4] text-[#45474b]'
                }`}
              >
                {t('settings.languageAr')}
              </button>
            </div>
          </div>

          {/* First day of week */}
          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#832613]" />
              <span>{t('settings.firstDayOfWeek')}</span>
            </label>
            <select
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
              className="w-full bg-[#f6f3ed] border border-[#dcdad4] px-3 py-1.5 font-label-mono text-xs text-[#080c12] rounded-sm focus:outline-none focus:border-[#832613]"
            >
              <option value={1}>{t('settings.firstDayMonday')}</option>
              <option value={0}>{t('settings.firstDaySunday')}</option>
              <option value={6}>{t('settings.firstDaySaturday')}</option>
            </select>
          </div>

          {/* Hourly schedule range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#832613]" />
                <span>{t('settings.startHour')}</span>
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full bg-[#f6f3ed] border border-[#dcdad4] px-3 py-1.5 font-label-mono text-xs text-[#080c12] rounded-sm focus:outline-none focus:border-[#832613]"
              />
            </div>
            <div>
              <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#832613]" />
                <span>{t('settings.endHour')}</span>
              </label>
              <input
                type="number"
                min={startHour + 1}
                max={23}
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full bg-[#f6f3ed] border border-[#dcdad4] px-3 py-1.5 font-label-mono text-xs text-[#080c12] rounded-sm focus:outline-none focus:border-[#832613]"
              />
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="pt-2 border-t border-[#e5e2dc]">
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-2">
              {t('settings.backupTitle')}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#f0eee8] hover:bg-[#e5e2dc] border border-[#dcdad4] rounded-sm font-label-mono text-xs text-[#080c12] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#832613]" />
                <span>{t('settings.exportBackup')}</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#f0eee8] hover:bg-[#e5e2dc] border border-[#dcdad4] rounded-sm font-label-mono text-xs text-[#080c12] cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#832613]" />
                <span>{t('settings.importBackup')}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e2dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-label-mono text-[#675d52] hover:text-[#1c1c18]"
            >
              {t('settings.close')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-label-stamp bg-[#832613] text-[#ffffff] hover:bg-[#6e1e0d] uppercase tracking-wider rounded-sm shadow-sm transition-colors"
            >
              {loading ? '...' : t('settings.saveSettings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
