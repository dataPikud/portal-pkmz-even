import { useState, useRef } from 'react';
import { X, Check, Upload, Globe } from 'lucide-react';
import { api } from '../../lib/api';
import { TagInput } from '../TagInput';
import type { System, CategoryFolder, MainCategory } from '../../types';
import styles from './SystemModal.module.css';

interface SystemModalProps {
  system?: System | null;
  defaultFolderId?: number | null;
  folders?: CategoryFolder[];
  mainCategories?: MainCategory[];
  onClose: () => void;
  onSave: () => void;
}

export function SystemModal({ system, defaultFolderId, onClose, onSave }: SystemModalProps) {
  const [form, setForm] = useState({
    name: system?.name ?? '',
    description: system?.description ?? '',
    url: system?.url ?? '',
    imageUrl: system?.imageUrl ?? '',
    sortOrder: system?.sortOrder ?? 0,
    folderId: system?.folderId ?? defaultFolderId ?? null,
    tags: system?.tags ?? [],
  });

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      alert('שם המערכת וכתובת URL הם שדות חובה');
      return;
    }

    setSaving(true);
    try {
      if (system) {
        await api.systems.update(system.id, form);
      } else {
        await api.systems.create(form);
      }
      onSave();
      onClose();
    } catch {
      alert('שמירת המערכת נכשלה');
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
            <Globe size={20} color="#3b82f6" />
            <h2>{system ? 'עריכת מערכת / אתר' : 'הוספת מערכת / אתר חדש'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>שם המערכת / האתר</label>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="לדוג׳ דשבורד מבצעים פיקודי"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תיאור קצר</label>
              <input
                type="text"
                className={styles.input}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="תיאור תפקיד המערכת..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>כתובת URL</label>
              <input
                type="text"
                className={styles.input}
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com/..."
                required
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
              <label>תמונה / לוגו המערכת</label>
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
              <Check size={16} /> {saving ? 'שומר...' : 'שמור מערכת'}
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
