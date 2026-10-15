import { useState, useRef } from 'react';
import { X, Check, Upload, Folder as FolderIcon } from 'lucide-react';
import { api } from '../../lib/api';
import type { CategoryFolder, MainCategory } from '../../types';
import styles from './SystemModal.module.css';

interface FolderModalProps {
  folder?: CategoryFolder | null;
  defaultParentId?: number | null;
  defaultMainCategoryId?: number | null;
  folders?: CategoryFolder[];
  mainCategories?: MainCategory[];
  onClose: () => void;
  onSave: () => void;
}

export function FolderModal({
  folder,
  defaultParentId,
  defaultMainCategoryId,
  mainCategories = [],
  onClose,
  onSave,
}: FolderModalProps) {
  const [form, setForm] = useState({
    name: folder?.name ?? '',
    description: folder?.description ?? '',
    imageUrl: folder?.imageUrl ?? '',
    mainCategoryId: folder?.mainCategoryId ?? defaultMainCategoryId ?? (mainCategories[0]?.id ?? 1),
    parentId: folder?.parentId ?? defaultParentId ?? null,
    sortOrder: folder?.sortOrder ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('שם התיקייה הוא שדה חובה');
      return;
    }

    setSaving(true);
    try {
      if (folder) {
        await api.folders.update(folder.id, form);
      } else {
        await api.folders.create(form);
      }
      onSave();
      onClose();
    } catch {
      alert('שמירת התיקייה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploads.thumbnail(file);
      setForm(p => ({ ...p, imageUrl: `/uploads/thumbnails/${res.fileName}` }));
    } catch {
      alert('העלאת התמונה נכשלה');
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <FolderIcon size={20} color="#f59e0b" />
            <h2>{folder ? 'עריכת תיקייה' : 'יצירת תיקייה חדשה'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>שם התיקייה *</label>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="לדוג׳ בסיסי נתונים ו-SQL"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תיאור התיקייה</label>
              <input
                type="text"
                className={styles.input}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="תיאור קצר..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תמונה / אייקון לתיקייה</label>
              <div className={styles.uploadRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="הדבק URL או לחץ להעלאה..."
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> העלה
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileUpload}
                />
              </div>
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
              <Check size={16} /> {saving ? 'שומר...' : 'שמור תיקייה'}
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
