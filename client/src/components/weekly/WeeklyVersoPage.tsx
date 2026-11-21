import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, addWeeks, subWeeks } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { WeeklyAgendaResponse, WeeklyGoal, Task } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface WeeklyVersoPageProps {
  currentDate: string;
  weeklyData: WeeklyAgendaResponse | null;
  onDateChange: (date: string) => void;
  onOpenDayAgenda: (date: string) => void;
  onSaveWeeklyPlan: (weekStartDate: string, data: any) => Promise<void>;
  onToggleTask: (task: Task) => void;
}

export const WeeklyVersoPage: React.FC<WeeklyVersoPageProps> = ({
  currentDate,
  weeklyData,
  onDateChange,
  onOpenDayAgenda,
  onSaveWeeklyPlan,
  onToggleTask,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateObj = parseISO(currentDate);

  const [newGoalText, setNewGoalText] = useState('');

  const goals: WeeklyGoal[] = React.useMemo(() => {
    try {
      if (weeklyData?.weeklyPlan?.goals) {
        return JSON.parse(weeklyData.weeklyPlan.goals);
      }
    } catch {}
    return [
      {
        id: '1',
        text: isRtl ? 'إتمام مراجعة المخطوطة والتقرير الاستراتيجي الختامي' : 'Finalize quarterly strategic plan and editorial manuscript',
        isCompleted: true,
        position: 1,
      },
      {
        id: '2',
        text: isRtl ? 'فحص عينات الورق الأرشيفي والوثائق التنفيذية' : 'Curate archival documentation and executive reports',
        isCompleted: false,
        position: 2,
      },
      {
        id: '3',
        text: isRtl ? 'جلسة التدقيق والتقييم ربع السنوي للمشاريع الكبرى' : 'Quarterly project review and milestone verification',
        isCompleted: false,
        position: 3,
      },
    ];
  }, [weeklyData]);

  const handlePrevWeek = () => {
    const prev = subWeeks(dateObj, 1);
    onDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    const next = addWeeks(dateObj, 1);
    onDateChange(format(next, 'yyyy-MM-dd'));
  };

  const handleToggleGoal = async (goalId: string) => {
    if (!weeklyData) return;
    const updatedGoals = goals.map((g) =>
      g.id === goalId ? { ...g, isCompleted: !g.isCompleted } : g
    );
    await onSaveWeeklyPlan(weeklyData.weekStartDate, {
      goals: JSON.stringify(updatedGoals),
      notes: weeklyData.weeklyPlan?.notes || '',
    });
  };

  const handleAddGoal = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newGoalText.trim() && weeklyData) {
      const newGoal: WeeklyGoal = {
        id: Date.now().toString(),
        text: newGoalText.trim(),
        isCompleted: false,
        position: goals.length + 1,
      };
      const updatedGoals = [...goals, newGoal];
      await onSaveWeeklyPlan(weeklyData.weekStartDate, {
        goals: JSON.stringify(updatedGoals),
        notes: weeklyData.weeklyPlan?.notes || '',
      });
      setNewGoalText('');
    }
  };

  const days = weeklyData?.days || [];
  const versoDays = days.slice(0, 3);

  const weekRangeText = weeklyData
    ? `${format(parseISO(weeklyData.weekStartDate), 'd MMM', {
        locale: isRtl ? ar : enUS,
      })} – ${format(parseISO(weeklyData.weekEndDate), 'd MMM yyyy', {
        locale: isRtl ? ar : enUS,
      })}`
    : '';

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Header Strip */}
        <div className="flex items-baseline justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/60">
          <span className="font-label-stamp text-[11px] text-[#832613] tracking-widest uppercase">
            {isRtl ? 'صحيفة ٧٢ · ظهر الصحيفة · رقم ١٤٤' : 'FOLIO 72 · VERSO · N° 144'}
          </span>
          <div className="flex items-center gap-1.5 font-headline-sm italic text-[#080c12]">
            <button
              onClick={handlePrevWeek}
              className="hover:text-[#832613] px-1 transition-colors"
              title={isRtl ? 'الأسبوع السابق' : 'Previous Week'}
            >
              {isRtl ? '→' : '←'}
            </button>
            <span className="px-1 text-sm sm:text-base">{weekRangeText}</span>
            <button
              onClick={handleNextWeek}
              className="hover:text-[#832613] px-1 transition-colors"
              title={isRtl ? 'الأسبوع التالي' : 'Next Week'}
            >
              {isRtl ? '←' : '→'}
            </button>
          </div>
          <span className="font-caption-caps text-caption-caps text-[#675d52] uppercase tracking-widest hidden sm:inline-block">
            {t('app.week')} {weeklyData?.weekNumber || 42}
          </span>
        </div>

        {/* Section I: Weekly Focus & Major Objectives */}
        <section className="mb-4 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#e5e2dc]">
            <h2 className="font-caption-caps text-caption-caps tracking-widest text-[#080c12] uppercase flex items-center gap-1 font-bold">
              <span>I.</span>
              <span>{t('weekly.semestrialFocus')}</span>
            </h2>
            <span className="font-label-mono text-[10px] text-[#832613] italic">{isRtl ? 'الربع الرابع · أسبوعي' : 'Q4 · Weekly'}</span>
          </div>

          <div className="flex flex-col gap-1 pt-1.5 text-[#1c1c18]">
            {goals.map((goal, idx) => (
              <div key={goal.id} className="group flex items-start gap-2 py-0.5">
                <span className="font-label-stamp text-xs text-[#675d52] pt-0.5 select-none w-3.5">
                  {idx + 1}.
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleGoal(goal.id)}
                  className={`mt-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-[1px] border transition-colors shrink-0 text-[10px] ${
                    goal.isCompleted
                      ? 'bg-[#080c12] text-[#fcf9f3] border-[#080c12]'
                      : 'bg-[#f0eee8] text-[#1c1c18] border-[#76777c]/40 hover:border-[#080c12]'
                  }`}
                >
                  {goal.isCompleted && '✓'}
                </button>
                <span
                  onClick={() => handleToggleGoal(goal.id)}
                  className={`flex-1 font-body-md text-sm leading-tight cursor-pointer ${
                    goal.isCompleted
                      ? 'line-through decoration-[#080c12]/60 text-[#675d52] italic'
                      : 'text-[#080c12]'
                  }`}
                >
                  {goal.text}
                </span>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <span className="font-label-stamp text-xs text-[#675d52]/50 w-3.5">+</span>
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                onKeyDown={handleAddGoal}
                placeholder={t('weekly.addGoalPlaceholder')}
                className="w-full bg-transparent border-0 p-0 font-body-script text-sm text-[#080c12] placeholder:text-[#675d52]/50 placeholder:italic focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section II: Days 1 to 3 */}
        <section className="flex flex-col gap-3.5 pt-1">
          {versoDays.map((day) => {
            const isToday = day.date === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={day.date}
                className={`flex flex-col gap-1 p-2 rounded-sm border ${
                  isToday
                    ? 'bg-[#f6f3ed]/80 border-[#da664d]/40 shadow-inner'
                    : 'bg-[#fcf9f3] border-[#e5e2dc]/60 hover:border-[#dcdad4]'
                }`}
              >
                <div className="flex items-baseline justify-between border-b border-[#e5e2dc]/60 pb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-sm text-lg font-bold text-[#080c12]">
                      {day.dayNumber}
                    </span>
                    <span className="font-caption-caps text-caption-caps text-[#080c12] uppercase tracking-wider font-semibold">
                      {day.dayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="font-label-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#490800] text-[#da664d] uppercase tracking-wider">
                        {t('weekly.currentDay')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenDayAgenda(day.date)}
                      className="font-label-mono text-[10px] text-[#832613] hover:underline flex items-center gap-0.5"
                    >
                      <span>{t('weekly.openDayAgenda')}</span>
                    </button>
                  </div>
                </div>

                {/* Day Tasks / Events List */}
                <div className="flex flex-col gap-1 font-body-script text-sm text-[#1c1c18] pt-0.5">
                  {day.events.slice(0, 2).map((ev) => (
                    <div key={ev.id} className="flex items-baseline gap-2">
                      <span className="font-label-mono text-[11px] text-[#832613] shrink-0">
                        {ev.startTime}
                      </span>
                      <span className="text-[#080c12] truncate">{ev.title}</span>
                    </div>
                  ))}

                  {day.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task)}
                      className="flex items-baseline gap-2 cursor-pointer group"
                    >
                      <span className="text-xs text-[#080c12]">
                        {task.isCompleted ? '☑' : '☐'}
                      </span>
                      <span
                        className={`truncate ${
                          task.isCompleted
                            ? 'line-through text-[#675d52] italic'
                            : 'text-[#080c12]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}

                  {day.events.length === 0 && day.tasks.length === 0 && (
                    <span className="text-xs text-[#675d52]/50 italic">
                      {isRtl ? 'صفحة خالية · لا توجد مواعيد مسجلة' : 'Clean page · No appointments recorded'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <PageFooter side="left" pageNumber={144} subText={isRtl ? `الأسبوع ${weeklyData?.weekNumber || 42} · ظهر الصحيفة` : `Week ${weeklyData?.weekNumber || 42} · Verso`} />
    </div>
  );
};
