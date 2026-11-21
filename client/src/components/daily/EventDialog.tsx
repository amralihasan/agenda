import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScheduleEvent } from '../../types';

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
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '10:00');
  const [category, setCategory] = useState(initialEvent?.category || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#fcf9f3] text-[#1c1c18] rounded-sm p-6 sm:p-8 shadow-book border border-[#dcdad4]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e5e2dc]">
          <h3 className="font-headline-md text-headline-md text-[#1e2229]">
            {t('dialogs.eventTitle')}
          </h3>
          <span className="font-label-stamp text-[10px] text-[#832613] uppercase tracking-widest">
            {defaultDate}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1">
              {t('dialogs.eventTitleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('dialogs.eventTitlePlaceholder')}
              required
              className="w-full bg-transparent border-b border-[#76777c] pb-1.5 font-body-md text-body-md text-[#080c12] placeholder:text-[#675d52]/50 placeholder:italic focus:outline-none focus:border-[#832613]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1">
                {t('dialogs.startTime')}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-transparent border-b border-[#76777c] pb-1 font-label-mono text-sm text-[#080c12] focus:outline-none focus:border-[#832613]"
              />
            </div>
            <div>
              <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1">
                {t('dialogs.endTime')}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-transparent border-b border-[#76777c] pb-1 font-label-mono text-sm text-[#080c12] focus:outline-none focus:border-[#832613]"
              />
            </div>
          </div>

          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1">
              {t('dialogs.eventCategoryLabel')}
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('dialogs.eventCategoryPlaceholder')}
              className="w-full bg-transparent border-b border-[#76777c] pb-1.5 font-body-md text-sm text-[#080c12] placeholder:text-[#675d52]/50 placeholder:italic focus:outline-none focus:border-[#832613]"
            />
          </div>

          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-1">
              {t('dialogs.eventDescriptionLabel')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('dialogs.eventDescriptionPlaceholder')}
              className="w-full bg-transparent border border-[#dcdad4] p-2 font-body-script text-sm text-[#080c12] placeholder:text-[#675d52]/50 placeholder:italic focus:outline-none focus:border-[#832613]"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#e5e2dc]">
            <div>
              {initialEvent?.id && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-label-mono text-[#ba1a1a] hover:underline"
                >
                  {t('dialogs.delete')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-label-mono text-[#675d52] hover:text-[#1c1c18]"
              >
                {t('dialogs.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-label-stamp bg-[#832613] text-[#ffffff] hover:bg-[#6e1e0d] uppercase tracking-wider rounded-sm shadow-sm transition-colors"
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
