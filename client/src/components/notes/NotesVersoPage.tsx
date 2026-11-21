import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Pin, Trash2, Settings2 } from 'lucide-react';
import { Note } from '../../types';
import { PageFooter } from '../book/PageFooter';

interface NotesVersoPageProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSelectNote: (id: string) => void;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onCreateNewNote: () => void;
  onTogglePin: (note: Note, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onOpenCategoryManager?: () => void;
}

export const NotesVersoPage: React.FC<NotesVersoPageProps> = ({
  notes,
  selectedNoteId,
  searchQuery,
  selectedCategory,
  categories,
  onSelectNote,
  onSearchChange,
  onCategoryChange,
  onCreateNewNote,
  onTogglePin,
  onDeleteNote,
  onOpenCategoryManager,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const filteredNotes = notes.filter((n) => {
    const matchesCat =
      selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col justify-between relative select-text">
      <div>
        {/* Header Strip */}
        <div className="flex items-baseline justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/60">
          <span className="font-label-stamp text-[11px] text-[#832613] tracking-widest uppercase">
            {isRtl ? 'دفتر الملاحظات الشخصية · مجلد ٤' : 'LIBER PERSONA · VOL. IV'}
          </span>
          <span className="font-caption-caps text-caption-caps text-[#675d52] uppercase tracking-widest">
            {t('notes.subtitle')}
          </span>
          <span className="font-label-mono text-xs text-[#675d52]">
            {notes.length} {isRtl ? 'صحيفة' : 'Folios'}
          </span>
        </div>

        {/* Search & New Inscription Line */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-1.5 bg-[#f6f3ed] border border-[#e5e2dc] px-2.5 py-1.5 rounded-sm">
            <Search className="w-3.5 h-3.5 text-[#675d52]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('notes.searchPlaceholder')}
              className="w-full bg-transparent border-0 p-0 font-body-script text-xs text-[#080c12] placeholder:text-[#675d52]/50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onCreateNewNote}
            className="px-2.5 py-1.5 bg-[#832613] hover:bg-[#6e1e0d] text-[#ffffff] font-label-stamp text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('notes.newNote')}</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-2 border-b border-[#e5e2dc]/60">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-label-stamp uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#490800] text-[#da664d] font-bold'
                  : 'bg-[#f0eee8] text-[#675d52] hover:bg-[#e5e2dc]'
              }`}
            >
              {cat === 'All' ? t('notes.categories.all') : t(`notes.categories.${cat}`, cat)}
            </button>
          ))}

          {/* Manage / Add Categories Button */}
          {onOpenCategoryManager && (
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="px-2 py-0.5 rounded text-[10px] font-label-stamp uppercase tracking-wider bg-[#f6f3ed] border border-dashed border-[#832613]/50 text-[#832613] hover:bg-[#832613]/10 flex items-center gap-1 transition-colors cursor-pointer"
              title={t('categoryManager.manageButton')}
            >
              <Settings2 className="w-3 h-3 text-[#832613]" />
              <span>+ {isRtl ? 'تصنيف جديد / تعديل' : 'Edit / Add'}</span>
            </button>
          )}
        </div>

        {/* Note List */}
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredNotes.map((note) => {
            const isSelected = selectedNoteId === note.id;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`p-2.5 rounded-sm border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#f6f3ed] border-[#832613]/50 shadow-sm'
                    : 'bg-[#fcf9f3] border-[#e5e2dc]/60 hover:bg-[#f6f3ed]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 truncate">
                    {note.isPinned && (
                      <Pin className="w-3 h-3 text-[#832613] shrink-0 fill-current" />
                    )}
                    <h4
                      className={`font-headline-sm text-sm truncate ${
                        isSelected ? 'text-[#832613] font-bold' : 'text-[#080c12]'
                      }`}
                    >
                      {note.title || (isRtl ? 'ملاحظة دون عنوان' : 'Untitled Inscription')}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onTogglePin(note, e)}
                      className="p-1 hover:text-[#832613] text-[#675d52]/50"
                      title={t('notes.pin')}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDeleteNote(note.id, e)}
                      className="p-1 hover:text-[#ba1a1a] text-[#675d52]/50"
                      title={t('notes.delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="font-body-script text-xs text-[#675d52] line-clamp-2 mt-1 leading-snug">
                  {note.content || (isRtl ? 'صفحة مسودة خالية...' : 'Blank folio page...')}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#e5e2dc]/40 text-[10px] font-label-mono text-[#675d52]/70">
                  <span className="uppercase">{t(`notes.categories.${note.category}`, note.category)}</span>
                  <span>{note.date || (isRtl ? 'بدون تاريخ' : 'Undated')}</span>
                </div>
              </div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="py-8 text-center text-xs font-body-script text-[#675d52]/60 italic">
              {isRtl ? 'لا توجد صفحات مسودة تطابق بحثك.' : 'No inscribed folios matching your query.'}
            </div>
          )}
        </div>
      </div>

      <PageFooter side="left" pageNumber={76} subText={isRtl ? 'فهرس الملاحظات والمسودات' : 'Index of Inscriptions'} />
    </div>
  );
};
