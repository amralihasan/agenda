import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';
import {
  MonthlyAgendaResponse,
  MonthlyIntention,
  MonthlyMemo,
} from '../../types';
import { PageFooter } from '../book/PageFooter';

interface MonthlyVersoPageProps {
  currentDate: string;
  monthlyData: MonthlyAgendaResponse | null;
  onDateChange: (date: string) => void;
  onSaveMonthlyPlan: (data: { intentions?: string; notes?: string }) => Promise<void>;
}

const parseList = <T,>(raw: string | null | undefined, fallback: T[]): T[] => {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const arabicDigits = (value: number) =>
  String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

const toRoman = (value: number) => {
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of ROMAN) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result || 'I';
};

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const MonthlyVersoPage: React.FC<MonthlyVersoPageProps> = ({
  currentDate,
  monthlyData,
  onDateChange,
  onSaveMonthlyPlan,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateObj = parseISO(currentDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  const [intentions, setIntentions] = useState<MonthlyIntention[]>([]);
  const [memos, setMemos] = useState<MonthlyMemo[]>([]);

  const [isAddingIntention, setIsAddingIntention] = useState(false);
  const [newIntentionText, setNewIntentionText] = useState('');
  const [editingIntentionId, setEditingIntentionId] = useState<string | null>(null);
  const [editingIntentionText, setEditingIntentionText] = useState('');

  const [isAddingMemo, setIsAddingMemo] = useState(false);
  const [newMemoText, setNewMemoText] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoText, setEditingMemoText] = useState('');

  // Rehydrate only when the displayed month changes; saving must not overwrite
  // whatever the user is currently typing.
  useEffect(() => {
    setIntentions(parseList<MonthlyIntention>(monthlyData?.monthlyPlan?.intentions, []));
    setMemos(parseList<MonthlyMemo>(monthlyData?.monthlyPlan?.notes, []));
    setIsAddingIntention(false);
    setNewIntentionText('');
    setEditingIntentionId(null);
    setEditingIntentionText('');
    setIsAddingMemo(false);
    setNewMemoText('');
    setEditingMemoId(null);
    setEditingMemoText('');
  }, [monthlyData?.year, monthlyData?.month]);

  const numeral = (position: number) =>
    isRtl ? `${arabicDigits(position)}.` : `${toRoman(position)}.`;

  const monthYearLabel = format(dateObj, 'MMMM yyyy', {
    locale: isRtl ? ar : enUS,
  });

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onDateChange(`${newYear}-${newMonth.toString().padStart(2, '0')}-01`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onDateChange(`${newYear}-${newMonth.toString().padStart(2, '0')}-01`);
  };

  const persistIntentions = (next: MonthlyIntention[]) => {
    setIntentions(next);
    onSaveMonthlyPlan({ intentions: JSON.stringify(next) });
  };

  const persistMemos = (next: MonthlyMemo[]) => {
    setMemos(next);
    onSaveMonthlyPlan({ notes: JSON.stringify(next) });
  };

  const toggleIntention = (id: string) => {
    persistIntentions(
      intentions.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const addIntention = () => {
    const text = newIntentionText.trim();
    if (!text) return;
    persistIntentions([
      ...intentions,
      {
        id: makeId(),
        text,
        isCompleted: false,
        position: intentions.length + 1,
      },
    ]);
    setNewIntentionText('');
    setIsAddingIntention(false);
  };

  const saveIntentionEdit = (id: string) => {
    const text = editingIntentionText.trim();
    if (!text) return;
    persistIntentions(
      intentions.map((item) => (item.id === id ? { ...item, text } : item))
    );
    setEditingIntentionId(null);
    setEditingIntentionText('');
  };

  const deleteIntention = (id: string) => {
    persistIntentions(
      intentions
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, position: index + 1 }))
    );
  };

  const addMemo = () => {
    const text = newMemoText.trim();
    if (!text) return;
    persistMemos([...memos, { id: makeId(), text }]);
    setNewMemoText('');
    setIsAddingMemo(false);
  };

  const saveMemoEdit = (id: string) => {
    const text = editingMemoText.trim();
    if (!text) return;
    persistMemos(
      memos.map((memo) => (memo.id === id ? { ...memo, text } : memo))
    );
    setEditingMemoId(null);
    setEditingMemoText('');
  };

  const deleteMemo = (id: string) => {
    persistMemos(memos.filter((memo) => memo.id !== id));
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
              {isRtl ? 'رقم ١٤٦' : 'N° 146'}
            </span>
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
            {intentions.map((item, index) => {
              if (editingIntentionId === item.id) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 py-1 px-1.5 rounded bg-[#f6f3ed] border border-[#832613]/40"
                  >
                    <span className="font-headline-sm text-sm text-[#832613] w-5 select-none shrink-0 font-serif">
                      {numeral(index + 1)}
                    </span>
                    <input
                      type="text"
                      value={editingIntentionText}
                      onChange={(e) => setEditingIntentionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveIntentionEdit(item.id);
                        if (e.key === 'Escape') setEditingIntentionId(null);
                      }}
                      onFocus={(e) =>
                        e.currentTarget.setSelectionRange(
                          e.currentTarget.value.length,
                          e.currentTarget.value.length
                        )
                      }
                      autoFocus
                      className="flex-1 bg-transparent border-b border-[#832613]/30 pb-0.5 text-sm focus:outline-none"
                      placeholder={t('monthly.addIntentionPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => saveIntentionEdit(item.id)}
                      className="p-1 text-[#16a34a] hover:bg-white rounded"
                      title={isRtl ? 'حفظ' : 'Save'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIntentionId(null)}
                      className="p-1 text-[#675d52] hover:bg-white rounded"
                      title={isRtl ? 'إلغاء' : 'Cancel'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div key={item.id} className="flex items-start gap-2 group py-0.5">
                  <span className="font-headline-sm text-sm text-[#832613] w-5 select-none shrink-0 font-serif">
                    {numeral(index + 1)}
                  </span>
                  <p
                    onClick={() => toggleIntention(item.id)}
                    className={`flex-1 leading-tight cursor-pointer ${
                      item.isCompleted
                        ? 'line-through text-[#675d52] italic'
                        : 'text-[#080c12]'
                    }`}
                  >
                    {item.text}
                  </p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIntentionId(item.id);
                        setEditingIntentionText(item.text);
                      }}
                      className="p-1 text-[#675d52]/60 hover:text-[#832613] hover:bg-[#e5e2dc]/60 rounded transition-colors"
                      title={t('monthly.editIntention')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIntention(item.id)}
                      className="p-1 text-[#675d52]/60 hover:text-[#ba1a1a] hover:bg-[#fee2e2] rounded transition-colors"
                      title={t('monthly.deleteIntention')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleIntention(item.id)}
                      className={`ml-1 mt-0.5 w-3.5 h-3.5 border flex items-center justify-center transition-colors text-[9px] ${
                        item.isCompleted
                          ? 'bg-[#080c12] text-[#fcf9f3] border-[#080c12]'
                          : 'bg-[#f0eee8] border-[#76777c]/40 hover:border-[#080c12]'
                      }`}
                      title={
                        item.isCompleted
                          ? isRtl
                            ? 'تحديد كغير منجز'
                            : 'Mark incomplete'
                          : isRtl
                          ? 'تحديد كمنجز'
                          : 'Mark completed'
                      }
                    >
                      {item.isCompleted && '✓'}
                    </button>
                  </div>
                </div>
              );
            })}

            {isAddingIntention ? (
              <div className="flex items-center gap-2 py-1 px-1.5 rounded bg-[#f6f3ed] border border-[#832613]/40">
                <span className="font-headline-sm text-sm text-[#832613] w-5 select-none shrink-0 font-serif">
                  {numeral(intentions.length + 1)}
                </span>
                <input
                  type="text"
                  value={newIntentionText}
                  onChange={(e) => setNewIntentionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addIntention();
                    if (e.key === 'Escape') setIsAddingIntention(false);
                  }}
                  autoFocus
                  className="flex-1 bg-transparent border-b border-[#832613]/30 pb-0.5 text-sm focus:outline-none"
                  placeholder={t('monthly.addIntentionPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addIntention}
                  className="p-1 text-[#16a34a] hover:bg-white rounded"
                  title={isRtl ? 'حفظ' : 'Save'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingIntention(false)}
                  className="p-1 text-[#675d52] hover:bg-white rounded"
                  title={isRtl ? 'إلغاء' : 'Cancel'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingIntention(true)}
                className="flex items-center gap-1.5 text-[11px] font-label-stamp uppercase tracking-wider text-[#832613] px-2.5 py-1 rounded border border-dashed border-[#832613]/40 bg-[#fdfbf7] hover:bg-[#832613] hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t('monthly.addIntention')}</span>
              </button>
            )}
          </div>
        </section>

        {/* Section 2: Notes & Memoranda */}
        <section className="mt-4 pt-3 border-t border-[#e5e2dc]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-caption-caps text-caption-caps text-[#832613] tracking-widest uppercase font-bold">
              {t('monthly.memorandaTitle')}
            </h2>
            <span className="font-label-stamp text-[9px] text-[#675d52] opacity-70">
              {monthYearLabel}
            </span>
          </div>

          <div className="space-y-2 font-body-script text-sm text-[#080c12]">
            {memos.map((memo) => {
              if (editingMemoId === memo.id) {
                return (
                  <div
                    key={memo.id}
                    className="p-1.5 rounded border border-[#832613]/40 bg-[#f6f3ed]"
                  >
                    <textarea
                      value={editingMemoText}
                      onChange={(e) => setEditingMemoText(e.target.value)}
                      onFocus={(e) =>
                        e.currentTarget.setSelectionRange(
                          e.currentTarget.value.length,
                          e.currentTarget.value.length
                        )
                      }
                      autoFocus
                      rows={2}
                      className="w-full bg-transparent text-sm leading-[24px] focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => saveMemoEdit(memo.id)}
                        className="p-1 text-[#16a34a] hover:bg-white rounded"
                        title={isRtl ? 'حفظ' : 'Save'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMemoId(null)}
                        className="p-1 text-[#675d52] hover:bg-white rounded"
                        title={isRtl ? 'إلغاء' : 'Cancel'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={memo.id} className="flex items-start gap-2 group">
                  <span className="text-[#832613] font-medium shrink-0">•</span>
                  <p className="flex-1 leading-[24px] whitespace-pre-wrap">
                    {memo.text}
                  </p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemoId(memo.id);
                        setEditingMemoText(memo.text);
                      }}
                      className="p-1 text-[#675d52]/60 hover:text-[#832613] hover:bg-[#e5e2dc]/60 rounded transition-colors"
                      title={t('monthly.editMemo')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMemo(memo.id)}
                      className="p-1 text-[#675d52]/60 hover:text-[#ba1a1a] hover:bg-[#fee2e2] rounded transition-colors"
                      title={t('monthly.deleteMemo')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {isAddingMemo ? (
              <div className="p-1.5 rounded border border-[#832613]/40 bg-[#f6f3ed]">
                <textarea
                  value={newMemoText}
                  onChange={(e) => setNewMemoText(e.target.value)}
                  autoFocus
                  rows={2}
                  className="w-full bg-transparent text-sm leading-[24px] focus:outline-none resize-none"
                  placeholder={t('monthly.memoPlaceholder')}
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={addMemo}
                    className="p-1 text-[#16a34a] hover:bg-white rounded"
                    title={isRtl ? 'حفظ' : 'Save'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingMemo(false)}
                    className="p-1 text-[#675d52] hover:bg-white rounded"
                    title={isRtl ? 'إلغاء' : 'Cancel'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingMemo(true)}
                className="flex items-center gap-1.5 text-[11px] font-label-stamp uppercase tracking-wider text-[#832613] px-2.5 py-1 rounded border border-dashed border-[#832613]/40 bg-[#fdfbf7] hover:bg-[#832613] hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t('monthly.addMemo')}</span>
              </button>
            )}
          </div>
        </section>
      </div>

      <PageFooter
        side="left"
        pageNumber={146}
        subText={isRtl ? 'القسم الأول · السجل الشهري' : 'Pars Prima · Liber Menstruus'}
      />
    </div>
  );
};
