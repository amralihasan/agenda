import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { Note } from '../../types';
import { PageFooter } from '../book/PageFooter';
import { VoiceNoteSection } from '../audio/VoiceNoteSection';
import { ImageAttachmentSection } from '../media/ImageAttachmentSection';
import { CodeOrTextEditor } from './CodeOrTextEditor';

interface NotesRectoPageProps {
  activeNote: Note | null;
  categories: string[];
  onUpdateNote: (id: string, data: Partial<Note>) => Promise<void>;
}

export const NotesRectoPage: React.FC<NotesRectoPageProps> = ({
  activeNote,
  categories,
  onUpdateNote,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');
  const [noteType, setNoteType] = useState<'text' | 'code'>(activeNote?.noteType || 'text');
  const [paperStyle, setPaperStyle] = useState<'ruled' | 'grid' | 'blank'>(
    activeNote?.paperStyle || 'ruled'
  );
  const [category, setCategory] = useState(activeNote?.category || 'General');
  const [date, setDate] = useState(activeNote?.date || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isFolioFullscreen, setIsFolioFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFolioFullscreen) {
        setIsFolioFullscreen(false);
      }
    };
    if (isFolioFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFolioFullscreen]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setNoteType(activeNote.noteType || 'text');
      setPaperStyle(activeNote.paperStyle || 'ruled');
      setCategory(activeNote.category || 'General');
      setDate(activeNote.date || '');
    }
  }, [activeNote?.id]);

  // Debounced auto-save
  useEffect(() => {
    if (!activeNote) return;
    if (
      title === activeNote.title &&
      content === activeNote.content &&
      noteType === (activeNote.noteType || 'text') &&
      paperStyle === activeNote.paperStyle &&
      category === activeNote.category &&
      date === activeNote.date
    ) {
      return;
    }

    setIsSaving(true);
    const timeout = setTimeout(async () => {
      await onUpdateNote(activeNote.id, {
        title,
        content,
        noteType,
        paperStyle,
        category,
        date: date || null,
      });
      setIsSaving(false);
    }, 700);

    return () => clearTimeout(timeout);
  }, [title, content, noteType, paperStyle, category, date, activeNote, onUpdateNote]);

  return (
    <div
      className={`flex-1 flex flex-col justify-between relative select-text transition-all duration-200 ${
        isFolioFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen bg-[#fcf9f3] p-3 sm:p-6 lg:p-8 overflow-y-auto animate-in fade-in'
          : ''
      }`}
    >
      {activeNote ? (
        <div className="flex-1 flex flex-col">
          {/* Header Controls for Active Note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-[#e5e2dc] gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Paper Style Selector */}
              <div className="flex items-center gap-1 bg-[#f0eee8] p-0.5 rounded text-[10px] font-label-stamp">
                <button
                  type="button"
                  onClick={() => setPaperStyle('ruled')}
                  className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                    paperStyle === 'ruled'
                      ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-sm'
                      : 'text-[#675d52]'
                  }`}
                >
                  {t('notes.ruled')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaperStyle('grid')}
                  className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                    paperStyle === 'grid'
                      ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-sm'
                      : 'text-[#675d52]'
                  }`}
                >
                  {t('notes.grid')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaperStyle('blank')}
                  className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                    paperStyle === 'blank'
                      ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-sm'
                      : 'text-[#675d52]'
                  }`}
                >
                  {t('notes.blank')}
                </button>
              </div>

              {/* Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFolioFullscreen(!isFolioFullscreen)}
                className="px-2 py-1 rounded bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#080c12] text-xs font-label-stamp flex items-center gap-1 transition-colors cursor-pointer border border-[#dcd8ce] shadow-2xs"
                title={isFolioFullscreen ? t('notes.exitFullscreen') : t('notes.fullscreen')}
              >
                {isFolioFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-[#832613]" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-[#832613]" />
                )}
                <span className="hidden sm:inline">
                  {isFolioFullscreen ? t('notes.exitFullscreen') : t('notes.fullscreen')}
                </span>
              </button>

              {isSaving && (
                <span className="font-label-mono text-[10px] text-[#832613] italic animate-pulse">
                  {isRtl ? 'جارٍ الحفظ...' : 'Preserving...'}
                </span>
              )}
            </div>

            {/* Category & Date Pickers */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-b border-[#76777c]/40 pb-0.5 font-label-mono text-xs text-[#080c12] focus:outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent border-b border-[#76777c]/40 pb-0.5 font-label-stamp text-[10px] uppercase text-[#832613] focus:outline-none cursor-pointer"
              >
                {categories
                  .filter((c) => c !== 'All')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`notes.categories.${cat}`, cat)}
                    </option>
                  ))}
                {!categories.includes(category) && category !== 'All' && (
                  <option value={category}>
                    {t(`notes.categories.${category}`, category)}
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Note Title Input */}
          <div className="mb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notes.noteTitlePlaceholder')}
              className="w-full bg-transparent border-b border-[#e5e2dc] pb-1.5 font-headline-lg text-2xl text-[#080c12] placeholder:text-[#675d52]/40 focus:outline-none focus:border-[#832613]"
            />
          </div>

          {/* Voice Notes & Media Attachments Toolbar */}
          <div className="mb-2 space-y-1.5">
            <VoiceNoteSection
              targetType="note"
              targetId={activeNote.id}
              onTranscribeText={(text) => {
                setContent((prev) => (prev ? prev + ' ' + text : text));
              }}
            />
            <ImageAttachmentSection
              targetType="note"
              targetId={activeNote.id}
            />
          </div>

          {/* Note Manuscript Writing Area (Text or Code) */}
          <div
            className="p-3 sm:p-4 rounded-sm min-h-[640px] border border-[#e5e2dc]/60 relative bg-[#fdfbf7] flex-1 flex flex-col shadow-xs"
          >
            <CodeOrTextEditor
              content={content}
              onChange={setContent}
              noteType={noteType}
              onNoteTypeChange={(type) => {
                setNoteType(type);
                onUpdateNote(activeNote.id, { noteType: type });
              }}
              paperStyle={paperStyle}
              rows={22}
              minHeight="580px"
              placeholder={t('notes.noteContentPlaceholder')}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#675d52]">
          <BookOpen className="w-12 h-12 opacity-30 mb-2" />
          <p className="font-body-script text-base italic">
            {isRtl ? 'اختر أو دوّن صفحة ملاحظات جديدة لقراءة مخطوطتها.' : 'Select or inscribe a folio note to read its manuscript.'}
          </p>
        </div>
      )}

      <PageFooter side="right" pageNumber={77} subText={t('app.smythsonParis')} />
    </div>
  );
};
