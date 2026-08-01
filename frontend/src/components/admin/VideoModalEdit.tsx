import { useState, useRef } from 'react';
import { X, Check, Upload, Film } from 'lucide-react';
import { api } from '../../lib/api';
import { TagInput } from '../TagInput';
import type { Video, CategoryFolder, MainCategory } from '../../types';
import styles from './SystemModal.module.css';

interface VideoModalEditProps {
  video?: Video | null;
  defaultFolderId?: number | null;
  folders?: CategoryFolder[];
  mainCategories?: MainCategory[];
  onClose: () => void;
  onSave: () => void;
}

export function VideoModalEdit({ video, defaultFolderId, onClose, onSave }: VideoModalEditProps) {
  const [form, setForm] = useState({
    title: video?.title ?? '',
    description: video?.description ?? '',
    fileName: video?.fileName ?? '',
    thumbnailName: video?.thumbnailName ?? '',
    duration: video?.duration ?? 0,
    sortOrder: video?.sortOrder ?? 0,
    folderId: video?.folderId ?? defaultFolderId ?? null,
    tags: video?.tags ?? [],
  });

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('כותרת הסרטון היא שדה חובה');
      return;
    }

    setSaving(true);
    try {
      if (video) {
        await api.videos.update(video.id, {
          title: form.title,
          description: form.description || undefined,
          thumbnailName: form.thumbnailName || null,
          duration: Number(form.duration) || undefined,
          sortOrder: Number(form.sortOrder),
          folderId: form.folderId,
          tags: form.tags,
        });
      } else {
        if (!form.fileName) {
          alert('יש להעלות קובץ וידאו ראשית');
          setSaving(false);
          return;
        }
        await api.videos.create({
          title: form.title,
          description: form.description || undefined,
          fileName: form.fileName,
          thumbnailName: form.thumbnailName || undefined,
          duration: Number(form.duration) || undefined,
          sortOrder: Number(form.sortOrder),
          folderId: form.folderId,
          tags: form.tags,
        });
      }
      onSave();
      onClose();
    } catch {
      alert('שמירת הסרטון נכשלה');
    } finally {
      setSaving(false);
    }
  }

  async function handleVideoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      const res = await api.uploads.video(file, pct => setUploadProgress(pct));
      setForm(p => ({
        ...p,
        fileName: res.fileName,
        title: p.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch {
      alert('העלאת קובץ הוידאו נכשלה');
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleThumbFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploads.thumbnail(file);
      setForm(p => ({ ...p, thumbnailName: res.fileName }));
    } catch {
      alert('העלאת תמונת ה-Thumbnail נכשלה');
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <Film size={20} color="#a855f7" />
            <h2>{video ? 'עריכת סרטון הדרכה' : 'העלאת סרטון הדרכה חדש'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGrid}>
            {!video && (
              <div className={styles.fieldGroup}>
                <label>קובץ וידאו (MP4 / WebM)</label>
                <div className={styles.uploadRow}>
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload size={14} /> {form.fileName ? `קובץ: ${form.fileName}` : 'בחר קובץ וידאו להעלאה...'}
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={handleVideoFileUpload}
                  />
                </div>
                {uploadProgress !== null && (
                  <div style={{ fontSize: 12, color: '#a855f7', marginTop: 4 }}>
                    מעלה וידאו... {uploadProgress}%
                  </div>
                )}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label>כותרת הסרטון</label>
              <input
                type="text"
                className={styles.input}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="לדוג׳ הדרכה מקיפה לשימוש בפורטל"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תיאור הסרטון</label>
              <input
                type="text"
                className={styles.input}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="תיאור קצר..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תגיות</label>
              <TagInput
                tags={form.tags}
                onChange={tags => setForm({ ...form, tags })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תמונת Thumbnail לסרטון</label>
              <div className={styles.uploadRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={form.thumbnailName}
                  onChange={e => setForm({ ...form, thumbnailName: e.target.value })}
                  placeholder="שם קובץ thumbnail..."
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <Upload size={14} /> העלה
                </button>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleThumbFileUpload}
                />
              </div>
            </div>

            <div className={styles.fieldGroupShort}>
              <label>משך בשניות</label>
              <input
                type="number"
                className={styles.input}
                value={form.duration}
                onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>

            <div className={styles.fieldGroupShort}>
              <label>סדר הצגה</label>
              <input
                type="number"
                className={styles.input}
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              <Check size={16} /> {saving ? 'שומר...' : 'שמור סרטון'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
