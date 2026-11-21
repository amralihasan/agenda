import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  Calendar,
  Check,
  ArrowRight,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Task, DailyNote } from '../../types';
import { PageFooter } from '../book/PageFooter';
import { VoiceNoteSection } from '../audio/VoiceNoteSection';
import { ImageAttachmentSection } from '../media/ImageAttachmentSection';
import { CodeOrTextEditor } from '../notes/CodeOrTextEditor';

interface DailyRectoPageProps {
  date: string;
  tasks: Task[];
  dailyNote: DailyNote;
  weekNumber: number;
  dayOfYear: number;
  onToggleTask: (task: Task) => void;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTaskClick: (task: Task) => void;
  onSaveDailyNote: (content: string, noteType?: 'text' | 'code') => void;
}

export const DailyRectoPage: React.FC<DailyRectoPageProps> = ({
  date,
  tasks,
  dailyNote,
  weekNumber,
  dayOfYear,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onMoveTaskClick,
  onSaveDailyNote,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [noteContent, setNoteContent] = useState(dailyNote?.content || '');
  const [noteType, setNoteType] = useState<'text' | 'code'>(dailyNote?.noteType || 'text');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Sync state when dailyNote changes externally (e.g. date change)
  useEffect(() => {
    setNoteContent(dailyNote?.content || '');
    setNoteType(dailyNote?.noteType || 'text');
  }, [dailyNote, date]);

  // Debounced auto-save for daily note
  useEffect(() => {
    if (
      noteContent === (dailyNote?.content || '') &&
      noteType === (dailyNote?.noteType || 'text')
    ) {
      return;
    }

    setIsSavingNote(true);
    const timeout = setTimeout(() => {
      onSaveDailyNote(noteContent, noteType);
      setIsSavingNote(false);
    }, 750);

    return () => clearTimeout(timeout);
  }, [noteContent, noteType, dailyNote, onSaveDailyNote]);

  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim() !== '') {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const folioNumber = 141 + (dayOfYear % 100);

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Top Running Sub-header (Recto) */}
        <div className="flex items-baseline justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/60">
          <div className="flex items-center gap-2">
            <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-[0.2em] font-semibold">
              {t('app.week')} {weekNumber}
            </span>
            <span className="font-label-mono text-xs text-[#675d52] opacity-40">§</span>
            <span className="font-caption-caps text-caption-caps text-[#675d52] uppercase tracking-widest">
              {isRtl ? 'المذكرات والخواطر' : 'Memoranda & Notes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-label-stamp text-[10px] text-[#675d52]">{isRtl ? 'أرشيف' : 'ARCHIVUM'}</span>
            <span className="font-label-mono text-xs text-[#675d52] opacity-40">·</span>
            <span className="font-label-mono text-xs text-[#675d52]">{isRtl ? `رقم ${folioNumber}` : `N° ${folioNumber}`}</span>
          </div>
        </div>

        {/* Section: Daily Obligations & Tasks with Interactive Rules */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between border-b border-[#e5e2dc] pb-1.5 mb-2">
            <h2 className="font-headline-md text-xl sm:text-2xl text-[#080c12] tracking-wide">
              {t('daily.obligationsTitle')}
            </h2>
            <span className="font-label-stamp text-[10px] text-[#675d52] uppercase">
              {t('daily.obligationsTag')}
            </span>
          </div>

          {/* Ruled Task Ledger with Checkboxes */}
          <div className="space-y-0.5 divide-y divide-[#e5e2dc]/70">
            {tasks.map((task) => {
              const isDone = task.isCompleted;

              return (
                <div
                  key={task.id}
                  className="py-1.5 flex items-start gap-2.5 group hover:bg-[#f6f3ed]/50 px-1 rounded transition-colors"
                >
                  {/* Square Ink Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleTask(task)}
                    className="w-4 h-4 mt-0.5 rounded-none border border-[#080c12] flex items-center justify-center bg-transparent transition-colors shrink-0 cursor-pointer"
                    title={isDone ? (isRtl ? 'تحديد كغير مكتمل' : 'Mark incomplete') : (isRtl ? 'تحديد كمكتمل' : 'Mark complete')}
                  >
                    <span
                      className={`font-label-mono text-[11px] text-[#080c12] font-bold ${
                        isDone ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                      }`}
                    >
                      ✕
                    </span>
                  </button>

                  {/* Task Title sitting on ruled line */}
                  <span
                    onClick={() => onToggleTask(task)}
                    className={`font-body-script text-base flex-1 cursor-pointer transition-all ${
                      isDone
                        ? 'line-through decoration-[#080c12]/60 text-[#675d52] italic'
                        : 'text-[#080c12]'
                    }`}
                  >
                    {task.title}
                  </span>

                  {/* Optional Time or Category */}
                  {task.startTime && (
                    <span className="font-label-mono text-[10px] text-[#675d52] opacity-60 shrink-0 select-none">
                      {task.startTime}
                    </span>
                  )}

                  {/* Task Actions (Move to tomorrow / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => onMoveTaskClick(task)}
                        className="p-1 hover:text-[#832613] text-[#675d52]"
                        title={t('daily.moveToTomorrow')}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 hover:text-[#ba1a1a] text-[#675d52]"
                      title={t('daily.deleteTask')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Migrated Tag */}
                  {task.status === 'migrated' && (
                    <span className="font-label-stamp text-[10px] uppercase text-[#832613] shrink-0">
                      {t('daily.migrated')}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Interactive Ruled Ink Line for New Task Entry */}
            <div className="py-2 flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-none border border-dashed border-[#675d52]/50 flex items-center justify-center shrink-0">
                <span className="font-label-mono text-[10px] text-[#675d52]/50">+</span>
              </div>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleTaskKeyDown}
                placeholder={t('daily.addTaskPlaceholder')}
                className="w-full bg-transparent border-0 p-0 font-body-script text-base text-[#080c12] placeholder:text-[#675d52]/50 placeholder:italic focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </section>

        {/* Section: Notebook Ruled Lines for Personal Notes */}
        <section className="flex-1 min-h-[300px] sm:min-h-[340px] pt-3 relative rounded-sm border border-[#e5e2dc]/70 p-3 sm:p-4 bg-[#fcf9f3]">
          {/* Header inside Note Field */}
          <div className="flex items-center justify-between mb-2 relative z-10 border-b border-[#e5e2dc]/80 pb-1.5">
            <div className="flex items-center gap-1.5 font-caption-caps text-caption-caps text-[#675d52] uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#da664d]" />
              <span>{t('daily.notesTitle')}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSavingNote && (
                <span className="font-label-mono text-[10px] text-[#832613] italic animate-pulse">
                  {isRtl ? 'جارٍ الحفظ...' : 'Saving notes...'}
                </span>
              )}
              <span className="font-label-stamp text-[10px] text-[#675d52] opacity-70 uppercase">
                {date}
              </span>
            </div>
          </div>

          {/* Voice Notes & Media Attachments Toolbar */}
          <div className="relative z-10 mb-2 space-y-1.5">
            <VoiceNoteSection
              targetType="daily"
              targetId={date}
              onTranscribeText={(text) => {
                setNoteContent((prev) => (prev ? prev + ' ' + text : text));
              }}
            />
            <ImageAttachmentSection targetType="daily" targetId={date} />
          </div>

          {/* Auto-saving editor: styled as notebook lines or formatted code terminal */}
          <div className="relative z-10 flex-1 flex flex-col">
            <CodeOrTextEditor
              content={noteContent}
              onChange={setNoteContent}
              noteType={noteType}
              onNoteTypeChange={(type) => {
                setNoteType(type);
                onSaveDailyNote(noteContent, type);
              }}
              paperStyle="ruled"
              rows={14}
              minHeight="380px"
              placeholder={t('daily.notesPlaceholder')}
            />
          </div>

          {/* Delicate Botanical Leaf Sketch Watermark Accent */}
          <div className="absolute bottom-2 right-2 pointer-events-none opacity-25">
            <svg
              className="text-[#832613] stroke-current"
              fill="none"
              height="80"
              viewBox="0 0 100 100"
              width="80"
            >
              <path
                d="M50 90 C 50 60, 30 40, 20 20 C 40 25, 60 45, 50 90 Z"
                strokeLinecap="round"
                strokeWidth="1.2"
              ></path>
              <path d="M50 70 C 42 55, 34 45, 26 38" strokeWidth="0.8"></path>
              <path d="M50 55 C 44 45, 38 37, 32 30" strokeWidth="0.8"></path>
              <path d="M50 40 C 46 34, 42 28, 38 24" strokeWidth="0.8"></path>
              <circle cx="50" cy="50" r="42" strokeDasharray="2 3" strokeWidth="0.7"></circle>
            </svg>
          </div>
        </section>
      </div>

      {/* Right Page Footer */}
      <PageFooter
        side="right"
        pageNumber={folioNumber}
        subText={t('app.smythsonParis')}
      />
    </div>
  );
};
