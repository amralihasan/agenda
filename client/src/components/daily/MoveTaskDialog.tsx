import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';
import { Task } from '../../types';

interface MoveTaskDialogProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirmMove: (taskId: string, targetDate: string) => Promise<void>;
}

export const MoveTaskDialog: React.FC<MoveTaskDialogProps> = ({
  isOpen,
  task,
  onClose,
  onConfirmMove,
}) => {
  const { t } = useTranslation();
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [targetDate, setTargetDate] = useState(tomorrowStr);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;

    setLoading(true);
    try {
      await onConfirmMove(task.id, targetDate);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#fcf9f3] text-[#1c1c18] rounded-sm p-6 shadow-book border border-[#dcdad4]">
        <div className="pb-3 mb-4 border-b border-[#e5e2dc]">
          <h3 className="font-headline-md text-headline-md text-[#1e2229]">
            {t('dialogs.moveTaskTitle')}
          </h3>
          <p className="font-body-script text-sm text-[#832613] italic mt-1 line-clamp-2">
            “{task.title}”
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-caption-caps text-caption-caps uppercase text-[#675d52] tracking-wider mb-2">
              {t('dialogs.selectDate')}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="w-full bg-[#f6f3ed] border border-[#dcdad4] px-3 py-2 font-label-mono text-sm text-[#080c12] rounded-sm focus:outline-none focus:border-[#832613]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e2dc]">
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
              {loading ? '...' : t('dialogs.confirmMove')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
