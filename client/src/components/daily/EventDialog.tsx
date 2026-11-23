import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Calendar, Check, Clock, Tag, Trash2, X } from 'lucide-react';
import { ScheduleEvent } from '../../types';
import { EVENT_COLOR_PRESETS } from '../../utils/eventColors';

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<ScheduleEvent>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialEvent?: Partial<ScheduleEvent> | null;
  defaultDate: string;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEvent,
  defaultDate,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<string>('carmine');
  const [loading, setLoading] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form state whenever dialog opens or target event/hour changes
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialEvent?.title || '');
    setDescription(initialEvent?.description || '');
    setStartTime(initialEvent?.startTime || '09:00');
    setEndTime(initialEvent?.endTime || '10:00');
    setCategory(initialEvent?.category || '');
    setColor(initialEvent?.color || 'carmine');

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [isOpen, initialEvent]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialEvent?.id);

  let formattedDate = defaultDate;
  try {
    formattedDate = format(parseISO(defaultDate), 'EEE, d MMM yyyy', {
      locale: isRtl ? ar : enUS,
    });
  } catch {
    // Fallback to raw defaultDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        id: initialEvent?.id,
        date: defaultDate,
        title: title.trim(),
        description: description.trim() || null,
        startTime,
        endTime,
        category: category.trim() || null,
        color,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEvent?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(initialEvent.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md bg-[#fcf9f3] text-[#1c1c18] rounded-md shadow-book border border-[#dcdad4] overflow-hidden">
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#f6f3ed]/70 border-b border-[#e5e2dc]">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="font-headline-md text-lg text-[#080c12] truncate">
              {isEditing ? t('dialogs.eventEditTitle') : t('dialogs.eventTitle')}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/80 border border-[#e5e2dc] font-label-mono text-[11px] text-[#832613] whitespace-nowrap">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded text-[#675d52] hover:text-[#080c12] hover:bg-[#e5e2dc]/60 transition-colors cursor-pointer"
              aria-label={t('dialogs.cancel')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block font-label-stamp text-[11px] uppercase text-[#675d52] tracking-wider mb-1.5">
              {t('dialogs.eventTitleLabel')}
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('dialogs.eventTitlePlaceholder')}
              required
              className="w-full bg-white/80 border border-[#dcdad4] rounded-sm px-3 py-2 font-body-md text-base text-[#080c12] placeholder:text-[#675d52]/45 focus:outline-none focus:border-[#832613] transition-colors"
            />
          </div>

          {/* Time Slot */}
          <div className="bg-[#f6f3ed]/60 border border-[#e5e2dc] rounded-sm p-3">
            <div className="flex items-center gap-1.5 font-label-stamp text-[11px] uppercase text-[#675d52] tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 text-[#832613]" />
              <span>{t('dialogs.eventTimeLabel')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-label-mono text-[#675d52] mb-1">
                  {t('dialogs.startTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-white border border-[#dcdad4] rounded-sm px-2.5 py-1.5 font-label-mono text-sm text-[#080c12] focus:outline-none focus:border-[#832613]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-label-mono text-[#675d52] mb-1">
                  {t('dialogs.endTime')}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-white border border-[#dcdad4] rounded-sm px-2.5 py-1.5 font-label-mono text-sm text-[#080c12] focus:outline-none focus:border-[#832613]"
                />
              </div>
            </div>
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="flex items-center gap-1.5 font-label-stamp text-[11px] uppercase text-[#675d52] tracking-wider mb-1.5">
                <Tag className="w-3 h-3" />
                <span>{t('dialogs.eventCategoryLabel')}</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('dialogs.eventCategoryPlaceholder')}
                className="w-full bg-white/80 border border-[#dcdad4] rounded-sm px-3 py-1.5 font-body-md text-sm text-[#080c12] placeholder:text-[#675d52]/45 focus:outline-none focus:border-[#832613] transition-colors"
              />
            </div>

            <div>
              <label className="block font-label-stamp text-[11px] uppercase text-[#675d52] tracking-wider mb-1.5">
                {t('dialogs.eventColorLabel')}
              </label>
              <div className="flex items-center gap-2 py-1">
                {EVENT_COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setColor(preset.id)}
                      title={isRtl ? preset.labelAr : preset.labelEn}
                      style={{
                        backgroundColor: preset.accent,
                        boxShadow: isSelected
                          ? `0 0 0 2px #fcf9f3, 0 0 0 4px ${preset.accent}`
                          : undefined,
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        isSelected ? 'scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-label-stamp text-[11px] uppercase text-[#675d52] tracking-wider mb-1.5">
              {t('dialogs.eventDescriptionLabel')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('dialogs.eventDescriptionPlaceholder')}
              className="w-full bg-white/80 border border-[#dcdad4] rounded-sm px-3 py-2 font-body-script text-sm text-[#080c12] placeholder:text-[#675d52]/45 focus:outline-none focus:border-[#832613] transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[#e5e2dc]">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-label-mono text-[#ba1a1a] hover:bg-[#fee2e2]/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('dialogs.delete')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-label-mono text-[#675d52] hover:text-[#080c12] hover:bg-[#e5e2dc]/50 rounded-sm transition-colors cursor-pointer"
              >
                {t('dialogs.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-label-stamp bg-[#832613] text-white hover:bg-[#6e1e0d] uppercase tracking-wider rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? '...' : t('dialogs.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
