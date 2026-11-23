import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Maximize2,
  X,
  Download,
  FileImage,
  Upload,
} from 'lucide-react';
import { ImageAttachment } from '../../types';
import { api } from '../../services/api';

interface ImageAttachmentSectionProps {
  targetType: 'daily' | 'weekly' | 'note';
  targetId: string;
  compact?: boolean;
}

export const ImageAttachmentSection: React.FC<ImageAttachmentSectionProps> = ({
  targetType,
  targetId,
  compact = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load images when targetId changes
  useEffect(() => {
    let isMounted = true;
    if (!targetId) {
      setImages([]);
      return;
    }

    const loadImages = async () => {
      try {
        setIsLoading(true);
        const data = await api.getImages(targetType, targetId);
        if (isMounted) {
          setImages(data || []);
        }
      } catch (err) {
        console.error('Failed to load images', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [targetType, targetId]);

  // Handle escape key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeLightbox) {
        setActiveLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightbox]);

  // Compress image on canvas before upload
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // WebP if supported, otherwise JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processAndUploadFiles = async (files: FileList | File[]) => {
    setError(null);
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const compressedBase64 = await compressImage(file);
        const caption = file.name.replace(/\.[^/.]+$/, '');

        const saved = await api.createImage({
          targetType,
          targetId,
          imageData: compressedBase64,
          caption,
        });

        setImages((prev) => [saved, ...prev]);
        setIsExpanded(true);
      }
    } catch (err: any) {
      console.error('Image upload failed', err);
      setError(t('images.uploadError'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightbox?.id === id) {
      setActiveLightbox(null);
    }
    try {
      await api.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  const hasImages = images.length > 0;

  return (
    <div
      className={`${compact ? 'contents' : 'w-full my-1.5'} text-[#080c12] ${
        isDragging ? 'ring-2 ring-[#832613] bg-[#832613]/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Action Strip */}
      <div
        className={
          compact
            ? 'flex flex-wrap items-center gap-1.5 text-xs'
            : 'flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#f6f3ed]/70 border border-[#e5e2dc] rounded-sm text-xs'
        }
      >
        {/* Left: Upload Button & Status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#fcf9f3] border border-[#832613]/30 hover:border-[#832613] text-[#832613] font-label-stamp uppercase tracking-wider text-[11px] shadow-2xs hover:bg-[#832613]/5 transition-all cursor-pointer disabled:opacity-50"
            title={t('images.addImage')}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#832613]" />
            <span>{isUploading ? (isRtl ? 'جارٍ التحميل...' : 'Uploading...') : t('images.addImage')}</span>
          </button>

          {isDragging && (
            <span className="font-label-mono text-[10px] text-[#832613] animate-pulse">
              {t('images.dropPrompt')}
            </span>
          )}
        </div>

        {/* Right: Images Count and Toggle */}
        <div className="flex items-center gap-2">
          {hasImages && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-[11px] font-label-mono text-[#675d52] hover:text-[#832613] cursor-pointer"
            >
              <FileImage className="w-3.5 h-3.5 text-[#832613]" />
              <span>
                {images.length} {t('images.count')}
              </span>
              <span className="text-[10px] opacity-70">
                {isExpanded ? (isRtl ? '▲ إخفاء' : '▲ Hide') : (isRtl ? '▼ عرض' : '▼ View')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="mt-1.5 p-1.5 text-[11px] text-[#ba1a1a] bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-sm">
          {error}
        </div>
      )}

      {/* Gallery Strip: Tipped-In Archival Photographic Plates */}
      {(isExpanded || hasImages) && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setActiveLightbox(img)}
              className="group relative bg-[#fcf9f3] p-1.5 rounded-sm border border-[#e5e2dc] shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Tipped-in print image */}
              <div className="relative aspect-4/3 w-full bg-[#f0eee8] overflow-hidden rounded-xs">
                <img
                  src={img.imageData}
                  alt={img.caption || 'Archival plate'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Hover overlay with action icons */}
                <div className="absolute inset-0 bg-[#200200]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span
                    className="p-1 rounded bg-[#fcf9f3]/90 text-[#832613] hover:scale-110 transition-transform shadow-xs"
                    title={t('images.viewFull')}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    className="p-1 rounded bg-[#fcf9f3]/90 text-[#ba1a1a] hover:scale-110 transition-transform shadow-xs"
                    title={t('images.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Caption / Timestamp footer */}
              {img.caption && (
                <div className="mt-1 px-0.5 flex items-center justify-between text-[10px] font-label-mono text-[#675d52]">
                  <span className="truncate max-w-[120px]" title={img.caption}>
                    {img.caption}
                  </span>
                  <span className="opacity-60 text-[9px] shrink-0">
                    {new Date(img.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#200200]/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#fcf9f3] p-3 sm:p-4 rounded-sm shadow-2xl border-4 border-[#e5e2dc] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e5e2dc]">
              <div className="flex items-center gap-2">
                <span className="font-caption-caps text-caption-caps text-[#832613] uppercase tracking-wider font-semibold text-xs">
                  {t('images.title')}
                </span>
                {activeLightbox.caption && (
                  <span className="font-label-mono text-xs text-[#675d52]">
                    — {activeLightbox.caption}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Download image */}
                <a
                  href={activeLightbox.imageData}
                  download={activeLightbox.caption || 'agenda-plate.jpg'}
                  className="p-1 rounded text-[#675d52] hover:text-[#832613] transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>

                {/* Delete in modal */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteImage(activeLightbox.id, e)}
                  className="p-1 rounded text-[#675d52] hover:text-[#ba1a1a] transition-colors"
                  title={t('images.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveLightbox(null)}
                  className="p-1 rounded text-[#675d52] hover:text-[#080c12] transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Frame */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-[#f0eee8] rounded-xs p-1">
              <img
                src={activeLightbox.imageData}
                alt={activeLightbox.caption || 'Plate'}
                className="max-h-[75vh] w-auto max-w-full object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
