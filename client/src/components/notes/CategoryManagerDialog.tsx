import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Edit2, Trash2, Check, Tag } from 'lucide-react';
import { Category } from '../../types';

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('categoryManager.categoryExists'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateCategory(trimmed);
      setNewCatName('');
    } catch (err: any) {
      setError(err.message || 'Error creating category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('categoryManager.categoryExists'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdateCategory(id, trimmed);
      setEditingId(null);
      setEditingName('');
    } catch (err: any) {
      setError(err.message || 'Error updating category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(t('categoryManager.confirmDelete'))) {
      try {
        setError(null);
        await onDeleteCategory(id);
      } catch (err: any) {
        setError(err.message || 'Error deleting category');
      }
    }
  };

  // Get display name (i18n if known default, or raw custom name)
  const getCategoryDisplayName = (name: string) => {
    return t(`notes.categories.${name}`, name);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#200200]/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#fcf9f3] p-5 sm:p-6 rounded-sm shadow-2xl border-2 border-[#832613]/50 flex flex-col max-h-[85vh] text-[#080c12]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-[#e5e2dc]">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#832613]" />
              <h3 className="font-headline-md text-xl text-[#080c12] tracking-wide">
                {t('categoryManager.title')}
              </h3>
            </div>
            <p className="font-label-mono text-xs text-[#675d52] mt-0.5">
              {t('categoryManager.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#675d52] hover:text-[#080c12] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3 p-2 text-xs text-[#ba1a1a] bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-sm">
            {error}
          </div>
        )}

        {/* Add New Category Form */}
        <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={t('categoryManager.newCategoryPlaceholder')}
            className="flex-1 bg-[#f6f3ed] border border-[#e5e2dc] focus:border-[#832613] px-3 py-1.5 rounded-sm font-body-script text-base text-[#080c12] placeholder:text-[#675d52]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCatName.trim()}
            className="px-3 py-2 bg-[#832613] hover:bg-[#681c0d] disabled:opacity-50 text-[#fcf9f3] font-label-stamp text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('categoryManager.addCategory')}</span>
          </button>
        </form>

        {/* List of Existing Categories */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 bg-[#fdfbf7] border border-[#e5e2dc] rounded-sm hover:border-[#832613]/30 transition-colors"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-[#f6f3ed] border border-[#832613] px-2 py-1 rounded-sm font-body-script text-base text-[#080c12] focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(cat.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={isSubmitting || !editingName.trim()}
                      className="p-1 rounded bg-[#832613] text-[#fcf9f3] hover:bg-[#681c0d]"
                      title={t('categoryManager.save')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="p-1 rounded text-[#675d52] hover:text-[#080c12]"
                      title={t('categoryManager.cancel')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#832613] opacity-70" />
                      <span className="font-body-script text-base text-[#080c12]">
                        {getCategoryDisplayName(cat.name)}
                      </span>
                      {cat.name !== getCategoryDisplayName(cat.name) && (
                        <span className="font-label-mono text-[10px] text-[#675d52] opacity-60">
                          ({cat.name})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(cat)}
                        className="p-1 text-[#675d52] hover:text-[#832613] rounded transition-colors"
                        title={t('categoryManager.editCategory')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 text-[#675d52] hover:text-[#ba1a1a] rounded transition-colors"
                        title={t('categoryManager.deleteCategory')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-4 border-t border-[#e5e2dc] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#e5e2dc] hover:bg-[#f6f3ed] font-label-stamp text-xs uppercase tracking-wider rounded-sm text-[#675d52] transition-colors cursor-pointer"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
