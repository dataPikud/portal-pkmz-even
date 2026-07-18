import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, X, Check, Upload, Image as ImageIcon, Search, ChevronDown, ChevronUp, Film, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import type { MainCategory, SubCategory, System, Video, UpdateVideoDto } from '../types';
import { thumbnailUrl, videoUrl } from './ContentPage';
import styles from './AdminPage.module.css';

// ===== System inline edit row =====
interface SystemFormData {
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  sortOrder: number;
  subCategoryId: number | '';
}

const EMPTY_SYSTEM: SystemFormData = {
  name: '', description: '', url: '', imageUrl: '', sortOrder: 0, subCategoryId: '',
};

function SystemRow({
  system,
  onDelete,
  onSave,
}: {
  system: System;
  onDelete: (id: number) => void;
  onSave: (id: number, data: Partial<System>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SystemFormData>({
    name: system.name,
    description: system.description ?? '',
    url: system.url,
    imageUrl: system.imageUrl ?? '',
    sortOrder: system.sortOrder,
    subCategoryId: system.subCategoryId ?? '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    onSave(system.id, {
      name: form.name,
      description: form.description || undefined,
      url: form.url,
      imageUrl: form.imageUrl || undefined,
      sortOrder: form.sortOrder,
      subCategoryId: form.subCategoryId === '' ? undefined : form.subCategoryId,
    });
    setEditing(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setForm(f => ({ ...f, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  if (editing) {
    return (
      <tr className={styles.editRow}>
        <td colSpan={5}>
          <div className={styles.inlineForm}>
            <input className={styles.input} placeholder="שם" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className={styles.input} placeholder="תיאור" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className={styles.input} placeholder="URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            <div className={styles.imageInputWrap}>
              <input className={styles.input} placeholder="תמונה URL" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} title="העלאת קובץ תמונה">
                <Upload size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="תצוגה מקדימה" className={styles.thumbPreview} />}
            <div className={styles.inlineActions}>
              <button className={styles.saveBtn} onClick={handleSave} aria-label="שמור"><Check size={14} /></button>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)} aria-label="ביטול"><X size={14} /></button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div className={styles.nameWithThumb}>
          {system.imageUrl ? (
            <img src={system.imageUrl} alt={system.name} className={styles.tableThumb} />
          ) : (
            <div className={styles.tableThumbPlaceholder}><ImageIcon size={14} /></div>
          )}
          <span>{system.name}</span>
        </div>
      </td>
      <td className={styles.mutedCell}>{system.description ?? '—'}</td>
      <td><a href={system.url} target="_blank" rel="noopener noreferrer" className={styles.link}>{system.url}</a></td>
      <td>
        <div className={styles.rowActions}>
          <button className={styles.editBtn} onClick={() => setEditing(true)} aria-label="עריכה"><Pencil size={14} /></button>
          <button className={styles.deleteBtn} onClick={() => onDelete(system.id)} aria-label="מחיקה"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

// ===== Add System Modal =====
function AddSystemModal({
  subCategories, onClose, onAdd,
}: {
  subCategories: SubCategory[];
  onClose: () => void;
  onAdd: (data: SystemFormData) => void;
}) {
  const [form, setForm] = useState<SystemFormData>(EMPTY_SYSTEM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    onAdd(form);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setForm(f => ({ ...f, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="הוספת מערכת">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>הוספת מערכת</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="סגור"><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>שם <span aria-hidden="true">*</span>
            <input required className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </label>
          <label className={styles.label}>תיאור
            <input className={styles.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </label>
          <label className={styles.label}>כתובת URL <span aria-hidden="true">*</span>
            <input required type="url" className={styles.input} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </label>
          <label className={styles.label}>תמונה למערכת (קובץ או כתובת URL)
            <div className={styles.imageUploadRow}>
              <input className={styles.input} placeholder="https://example.com/image.png או העלה קובץ" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              <button type="button" className={styles.fileUploadBtn} onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} />
                העלאת קובץ
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </label>
          {form.imageUrl && (
            <div className={styles.previewBox}>
              <span className={styles.previewLabel}>תצוגה מקדימה לתמונה:</span>
              <img src={form.imageUrl} alt="תצוגה מקדימה" className={styles.modalImgPreview} />
            </div>
          )}
          <label className={styles.label}>קטגוריית משנה
            <select className={styles.input} value={form.subCategoryId} onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value === '' ? '' : Number(e.target.value) }))}>
              <option value="">ללא</option>
              {subCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </label>
          <label className={styles.label}>סדר תצוגה
            <input type="number" className={styles.input} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </label>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.submitBtn}>הוסף מערכת</button>
            <button type="button" className={styles.cancelOutlineBtn} onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Category form data =====
interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}

const EMPTY_CATEGORY: CategoryFormData = {
  name: '', description: '', icon: '', color: '#0f766e', sortOrder: 0,
};

// ===== SubCategory form data =====
interface SubCategoryFormData {
  name: string;
  description: string;
  sortOrder: number;
}

const EMPTY_SUBCATEGORY: SubCategoryFormData = { name: '', description: '', sortOrder: 0 };

// ===== SubCategory inline row =====
function SubCategoryRow({
  sub,
  onDelete,
  onSave,
}: {
  sub: SubCategory;
  onDelete: (id: number) => void;
  onSave: (id: number, data: Partial<SubCategoryFormData>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SubCategoryFormData>({
    name: sub.name,
    description: sub.description ?? '',
    sortOrder: sub.sortOrder,
  });

  function handleSave() {
    onSave(sub.id, { name: form.name, description: form.description || undefined, sortOrder: form.sortOrder });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={styles.subRow}>
        <div className={styles.subEditForm}>
          <input className={styles.input} placeholder="שם *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
          <input className={styles.input} placeholder="תיאור" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 3 }} />
          <input type="number" className={styles.input} placeholder="סדר" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 70, flex: 'none' }} />
          <div className={styles.inlineActions}>
            <button className={styles.saveBtn} onClick={handleSave} aria-label="שמור"><Check size={13} /></button>
            <button className={styles.cancelBtn} onClick={() => setEditing(false)} aria-label="ביטול"><X size={13} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.subRow}>
      <div className={styles.subInfo}>
        <span className={styles.subBullet} />
        <span className={styles.subName}>{sub.name}</span>
        {sub.description && <span className={styles.mutedText}>{sub.description}</span>}
      </div>
      <div className={styles.rowActions}>
        <button className={styles.editBtn} onClick={() => setEditing(true)} aria-label="עריכה תת-קטגוריה"><Pencil size={13} /></button>
        <button className={styles.deleteBtn} onClick={() => onDelete(sub.id)} aria-label={`מחק ${sub.name}`}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ===== Add SubCategory inline form =====
function AddSubCategoryForm({
  onAdd, onCancel,
}: {
  onAdd: (data: SubCategoryFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SubCategoryFormData>(EMPTY_SUBCATEGORY);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form);
  }

  return (
    <form className={styles.subAddForm} onSubmit={handleSubmit}>
      <input required className={styles.input} placeholder="שם תת-קטגוריה *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
      <input className={styles.input} placeholder="תיאור" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 3 }} />
      <input type="number" className={styles.input} placeholder="סדר" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 70, flex: 'none' }} />
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.saveBtn} aria-label="הוסף"><Check size={13} /></button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel} aria-label="ביטול"><X size={13} /></button>
      </div>
    </form>
  );
}

// ===== Category inline edit row (with expandable subcategory panel) =====
function CategoryRow({
  cat,
  onDelete,
  onSave,
  onAddSub,
  onSaveSub,
  onDeleteSub,
}: {
  cat: MainCategory;
  onDelete: (id: number) => void;
  onSave: (id: number, data: Partial<MainCategory>) => void;
  onAddSub: (catId: number, data: SubCategoryFormData) => void;
  onSaveSub: (subId: number, data: Partial<SubCategoryFormData>) => void;
  onDeleteSub: (catId: number, subId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [form, setForm] = useState<CategoryFormData>({
    name: cat.name,
    description: cat.description ?? '',
    icon: cat.icon ?? '',
    color: cat.color ?? '#0f766e',
    sortOrder: cat.sortOrder,
  });

  function handleSave() {
    onSave(cat.id, {
      name: form.name,
      description: form.description || undefined,
      icon: form.icon || undefined,
      color: form.color || undefined,
      sortOrder: form.sortOrder,
    });
    setEditing(false);
  }

  const subs = cat.subCategories ?? [];

  if (editing) {
    return (
      <div className={`${styles.catRow} ${styles.catRowEditing}`}>
        <div className={styles.catEditForm}>
          <input className={styles.input} placeholder="שם קטגוריה *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
          <input className={styles.input} placeholder="תיאור" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 3 }} />
          <input className={styles.input} placeholder="אייקון (emoji / שם)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={{ flex: 1, minWidth: 80 }} />
          <div className={styles.colorPickerWrap}>
            <label className={styles.colorLabel}>צבע</label>
            <input type="color" className={styles.colorInput} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} title="בחר צבע" />
          </div>
          <input type="number" className={styles.input} placeholder="סדר" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 70, flex: 'none' }} />
          <div className={styles.inlineActions}>
            <button className={styles.saveBtn} onClick={handleSave} aria-label="שמור"><Check size={14} /></button>
            <button className={styles.cancelBtn} onClick={() => setEditing(false)} aria-label="ביטול"><X size={14} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.catBlock}>
      {/* Main category row */}
      <div className={styles.catRow}>
        <div className={styles.catInfo}>
          {/* Expand toggle */}
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'כווץ' : 'הרחב'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <span className={styles.catDot} style={{ background: cat.color ?? '#0f766e' }} />
          {cat.icon && <span className={styles.catIcon}>{cat.icon}</span>}
          <strong>{cat.name}</strong>
          {cat.description && <span className={styles.mutedText}>{cat.description}</span>}
          <span className={styles.subCountBadge}>{subs.length} תת-קטגוריות</span>
        </div>
        <div className={styles.rowActions}>
          <button className={styles.editBtn} onClick={() => setEditing(true)} aria-label="עריכה"><Pencil size={14} /></button>
          <button className={styles.deleteBtn} onClick={() => onDelete(cat.id)} aria-label={`מחק ${cat.name}`}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Subcategories panel */}
      {expanded && (
        <div className={styles.subPanel}>
          <div className={styles.subPanelHeader}>
            <span className={styles.subPanelTitle}>תת-קטגוריות</span>
            <button
              className={styles.addSubBtn}
              onClick={() => setShowAddSub(v => !v)}
              aria-label="הוסף תת-קטגוריה"
            >
              <Plus size={13} />
              הוסף
            </button>
          </div>

          {showAddSub && (
            <AddSubCategoryForm
              onAdd={data => { onAddSub(cat.id, data); setShowAddSub(false); }}
              onCancel={() => setShowAddSub(false)}
            />
          )}

          {subs.length === 0 && !showAddSub && (
            <div className={styles.subEmpty}>אין תת-קטגוריות עדיין</div>
          )}

          {subs.map(sub => (
            <SubCategoryRow
              key={sub.id}
              sub={sub}
              onDelete={subId => onDeleteSub(cat.id, subId)}
              onSave={(subId, data) => onSaveSub(subId, data)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Video management =====

interface VideoRowProps {
  video: Video;
  onDelete: (id: number) => void;
  onSave: (id: number, data: UpdateVideoDto) => void;
}

function VideoRow({ video, onDelete, onSave }: VideoRowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateVideoDto>({
    title: video.title,
    description: video.description ?? '',
    sortOrder: video.sortOrder,
    isActive: video.isActive,
  });
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [localThumb, setLocalThumb] = useState<string | null>(null);

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const res = await api.uploads.thumbnail(file);
      setForm(f => ({ ...f, thumbnailName: res.fileName }));
      setLocalThumb(URL.createObjectURL(file));
    } catch (err) {
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setThumbUploading(false);
    }
  }

  function handleSave() {
    onSave(video.id, {
      title: form.title,
      description: form.description || undefined,
      thumbnailName: form.thumbnailName,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    });
    setEditing(false);
  }

  const thumb = localThumb ?? (video.thumbnailName ? thumbnailUrl(video.thumbnailName) : null);

  if (editing) {
    return (
      <tr className={styles.editRow}>
        <td colSpan={5}>
          <div className={styles.inlineForm}>
            <input className={styles.input} placeholder="כותרת *" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ flex: 2 }} />
            <input className={styles.input} placeholder="תיאור" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 3 }} />
            <input type="number" className={styles.input} placeholder="סדר" value={form.sortOrder ?? 0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 70, flex: 'none' }} />
            <div className={styles.imageInputWrap}>
              {thumb && <img src={thumb} alt="thumb" className={styles.thumbPreview} />}
              <button type="button" className={styles.uploadBtn} onClick={() => thumbInputRef.current?.click()} disabled={thumbUploading} title="העלה thumbnail">
                {thumbUploading ? '...' : <Upload size={14} />}
              </button>
              <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbUpload} />
            </div>
            <div className={styles.inlineActions}>
              <button className={styles.saveBtn} onClick={handleSave} aria-label="שמור"><Check size={14} /></button>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)} aria-label="ביטול"><X size={14} /></button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div className={styles.nameWithThumb}>
          {thumb ? (
            <img src={thumb} alt={video.title} className={styles.tableThumb} />
          ) : (
            <div className={styles.tableThumbPlaceholder}><Film size={14} /></div>
          )}
          <div>
            <span style={{ fontWeight: 600 }}>{video.title}</span>
            {!video.isActive && <span className={styles.inactiveBadge}>לא פעיל</span>}
          </div>
        </div>
      </td>
      <td className={styles.mutedCell}>{video.description ?? '—'}</td>
      <td>
        <a href={videoUrl(video.fileName)} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {video.fileName}
        </a>
      </td>
      <td>
        <div className={styles.rowActions}>
          <button className={styles.editBtn} onClick={() => setEditing(true)} aria-label="עריכה"><Pencil size={14} /></button>
          <button
            className={styles.editBtn}
            onClick={() => onSave(video.id, { isActive: !video.isActive })}
            aria-label={video.isActive ? 'הסתר' : 'הצג'}
            title={video.isActive ? 'הסתר מהמשתמשים' : 'הצג למשתמשים'}
          >
            {video.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button className={styles.deleteBtn} onClick={() => onDelete(video.id)} aria-label="מחיקה"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

// ===== Upload Video Form =====
function UploadVideoForm({ onAdded }: { onAdded: (v: Video) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideoFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  function handleThumbFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile || !title.trim()) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // 1. Upload video with progress
      const videoRes = await api.uploads.video(videoFile, pct => setProgress(pct));

      // 2. Upload thumbnail if provided
      let thumbFileName: string | undefined;
      if (thumbFile) {
        const thumbRes = await api.uploads.thumbnail(thumbFile);
        thumbFileName = thumbRes.fileName;
      }

      // 3. Create video record
      const created = await api.videos.create({
        title: title.trim(),
        description: description.trim() || undefined,
        fileName: videoRes.fileName,
        thumbnailName: thumbFileName,
        mimeType: videoRes.mimeType,
        fileSize: videoRes.fileSize,
        sortOrder,
      });

      onAdded(created);
      // Reset form
      setTitle(''); setDescription(''); setSortOrder(0);
      setVideoFile(null); setThumbFile(null); setThumbPreview(null);
      setProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className={styles.uploadForm} onSubmit={handleSubmit}>
      <h3 className={styles.uploadTitle}>
        <Film size={16} />
        הוספת סרטון חדש
      </h3>

      <div className={styles.uploadGrid}>
        {/* Left – file pickers */}
        <div className={styles.uploadFiles}>
          <div
            className={`${styles.dropZone} ${videoFile ? styles.dropZoneReady : ''}`}
            onClick={() => videoInputRef.current?.click()}
          >
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFile} />
            <Film size={24} />
            {videoFile ? (
              <span className={styles.fileName}>{videoFile.name}</span>
            ) : (
              <span>לחץ לבחירת קובץ וידאו</span>
            )}
          </div>

          <div
            className={`${styles.dropZone} ${styles.dropZoneThumb} ${thumbFile ? styles.dropZoneReady : ''}`}
            onClick={() => thumbInputRef.current?.click()}
          >
            <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbFile} />
            {thumbPreview ? (
              <img src={thumbPreview} alt="thumbnail preview" className={styles.thumbDropPreview} />
            ) : (
              <>
                <ImageIcon size={20} />
                <span>תמונת thumbnail (אופציונלי)</span>
              </>
            )}
          </div>
        </div>

        {/* Right – metadata fields */}
        <div className={styles.uploadMeta}>
          <label className={styles.label}>כותרת <span aria-hidden="true">*</span>
            <input required className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
          </label>
          <label className={styles.label}>תיאור
            <textarea className={`${styles.input} ${styles.textarea}`} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label className={styles.label}>סדר תצוגה
            <input type="number" className={styles.input} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
          </label>
        </div>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      )}

      {error && <p className={styles.uploadError}>{error}</p>}

      <div className={styles.modalFooter}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={uploading || !videoFile || !title.trim()}
        >
          {uploading ? `מעלה... ${progress}%` : 'העלה סרטון'}
        </button>
      </div>
    </form>
  );
}

// ===== Add Category Modal =====
function AddCategoryModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: CategoryFormData) => void;
}) {
  const [form, setForm] = useState<CategoryFormData>(EMPTY_CATEGORY);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="הוספת קטגוריה">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>הוספת קטגוריה ראשית</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="סגור"><X size={18} /></button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>שם <span aria-hidden="true">*</span>
            <input required className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </label>
          <label className={styles.label}>תיאור
            <input className={styles.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </label>
          <label className={styles.label}>אייקון (emoji או שם)
            <input className={styles.input} placeholder="לדוג׳ 📁 או folder" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          </label>
          <label className={styles.label}>צבע
            <div className={styles.colorPickerRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              />
              <input
                className={styles.input}
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="#0f766e"
                style={{ flex: 1 }}
              />
              <span className={styles.colorPreviewDot} style={{ background: form.color }} />
            </div>
          </label>
          <label className={styles.label}>סדר תצוגה
            <input type="number" className={styles.input} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </label>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.submitBtn}>הוסף קטגוריה</button>
            <button type="button" className={styles.cancelOutlineBtn} onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Main AdminPage =====
export function AdminPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [allSubs, setAllSubs] = useState<SubCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSystem, setShowAddSystem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // isContentAdmin sees only the content tab; isAdmin sees all
  const isAdmin = user?.isAdmin ?? false;
  const isContentAdmin = user?.isContentAdmin ?? false;
  const canManageContent = isAdmin || isContentAdmin;

  const defaultTab = isAdmin ? 'systems' : 'content';
  const [activeTab, setActiveTab] = useState<'systems' | 'categories' | 'content'>(defaultTab as 'systems' | 'categories' | 'content');
  const [searchSystems, setSearchSystems] = useState('');
  const [searchCategories, setSearchCategories] = useState('');
  const [searchVideos, setSearchVideos] = useState('');

  // Filtered lists
  const filteredSystems = useMemo(() => {
    const q = searchSystems.trim().toLowerCase();
    if (!q) return systems;
    return systems.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q)
    );
  }, [systems, searchSystems]);

  const filteredCategories = useMemo(() => {
    const q = searchCategories.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    );
  }, [categories, searchCategories]);

  const filteredVideos = useMemo(() => {
    const q = searchVideos.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      (v.description ?? '').toLowerCase().includes(q)
    );
  }, [videos, searchVideos]);

  // Redirect users with no management permissions at all
  useEffect(() => {
    if (user && !user.isAdmin && !user.isContentAdmin) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    const promises: Promise<unknown>[] = [];

    if (isAdmin) {
      promises.push(
        api.mainCategories.list(),
        api.systems.list(),
      );
    }

    if (canManageContent) {
      promises.push(api.videos.listAll());
    }

    void Promise.all(promises).then(results => {
      let idx = 0;
      if (isAdmin) {
        const cats = results[idx++] as MainCategory[];
        const sysList = results[idx++] as System[];
        setCategories(cats);
        setSystems(sysList);
        setAllSubs(cats.flatMap(c => c.subCategories ?? []));
      }
      if (canManageContent) {
        setVideos(results[idx] as Video[]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isAdmin, canManageContent]);

  // --- System handlers ---
  async function handleDeleteSystem(id: number) {
    if (!confirm('למחוק את המערכת?')) return;
    await api.systems.delete(id);
    setSystems(prev => prev.filter(s => s.id !== id));
  }

  async function handleSaveSystem(id: number, data: Partial<System>) {
    const updated = await api.systems.update(id, data);
    setSystems(prev => prev.map(s => s.id === id ? updated : s));
  }

  async function handleAddSystem(data: SystemFormData) {
    const created = await api.systems.create({
      name: data.name,
      description: data.description || undefined,
      url: data.url,
      imageUrl: data.imageUrl || undefined,
      sortOrder: data.sortOrder,
      subCategoryId: data.subCategoryId === '' ? undefined : data.subCategoryId,
    });
    setSystems(prev => [...prev, created]);
    setShowAddSystem(false);
  }

  // --- Category handlers ---
  async function handleDeleteCategory(id: number) {
    if (!confirm('למחוק את הקטגוריה ואת כל תוכנה?')) return;
    await api.mainCategories.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  async function handleSaveCategory(id: number, data: Partial<MainCategory>) {
    const updated = await api.mainCategories.update(id, data);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  }

  async function handleAddCategory(data: CategoryFormData) {
    const created = await api.mainCategories.create({
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
      color: data.color || undefined,
      sortOrder: data.sortOrder,
    });
    setCategories(prev => [...prev, created]);
    setShowAddCategory(false);
  }

  // --- Video handlers ---
  async function handleDeleteVideo(id: number) {
    if (!confirm('למחוק את הסרטון ואת הקובץ?')) return;
    await api.videos.delete(id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  async function handleSaveVideo(id: number, data: UpdateVideoDto) {
    const updated = await api.videos.update(id, data);
    setVideos(prev => prev.map(v => v.id === id ? updated : v));
  }

  // --- SubCategory handlers ---
  async function handleAddSub(catId: number, data: SubCategoryFormData) {
    const created = await api.subCategories.create({
      name: data.name,
      description: data.description || undefined,
      sortOrder: data.sortOrder,
      mainCategoryId: catId,
    });
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subCategories: [...(c.subCategories ?? []), created] }
        : c
    ));
    // Keep allSubs in sync
    setAllSubs(prev => [...prev, created]);
  }

  async function handleSaveSub(subId: number, data: Partial<SubCategoryFormData>) {
    const updated = await api.subCategories.update(subId, data);
    setCategories(prev => prev.map(c => ({
      ...c,
      subCategories: (c.subCategories ?? []).map(s => s.id === subId ? { ...s, ...updated } : s),
    })));
    setAllSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
  }

  async function handleDeleteSub(catId: number, subId: number) {
    if (!confirm('למחוק את תת-הקטגוריה?')) return;
    await api.subCategories.delete(subId);
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subCategories: (c.subCategories ?? []).filter(s => s.id !== subId) }
        : c
    ));
    setAllSubs(prev => prev.filter(s => s.id !== subId));
  }

  if (loading) return <main className={styles.page}><p>טוען...</p></main>;

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="חזרה">
          <ArrowRight size={16} />
          חזרה לפורטל
        </button>
        <h1 className={styles.title}>פאנל ניהול</h1>
      </div>

      <div className={styles.tabs} role="tablist">
        {isAdmin && (
          <button
            role="tab"
            aria-selected={activeTab === 'systems'}
            className={activeTab === 'systems' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('systems')}
          >
            מערכות ({systems.length})
          </button>
        )}
        {isAdmin && (
          <button
            role="tab"
            aria-selected={activeTab === 'categories'}
            className={activeTab === 'categories' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('categories')}
          >
            קטגוריות ({categories.length})
          </button>
        )}
        {canManageContent && (
          <button
            role="tab"
            aria-selected={activeTab === 'content'}
            className={activeTab === 'content' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('content')}
          >
            <Film size={14} style={{ display: 'inline', marginLeft: 6 }} />
            חומרי הטמעה ({videos.length})
          </button>
        )}
      </div>

      {/* ===== Systems tab ===== */}
      {activeTab === 'systems' && (
        <section aria-label="ניהול מערכות">
          <div className={styles.sectionBar}>
            <h2 className={styles.sectionTitle}>מערכות</h2>
            <button className={styles.addBtn} onClick={() => setShowAddSystem(true)}>
              <Plus size={16} />
              הוסף מערכת
            </button>
          </div>
          <div className={styles.searchBar}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="חיפוש לפי שם, תיאור או URL..."
              value={searchSystems}
              onChange={e => setSearchSystems(e.target.value)}
              aria-label="חיפוש מערכות"
            />
            {searchSystems && (
              <button className={styles.searchClear} onClick={() => setSearchSystems('')} aria-label="נקה חיפוש">
                <X size={13} />
              </button>
            )}
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>שם ומצב תמונה</th>
                  <th>תיאור</th>
                  <th>URL</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredSystems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      {searchSystems ? `לא נמצאו תוצאות עבור "${searchSystems}"` : 'אין מערכות'}
                    </td>
                  </tr>
                ) : (
                  filteredSystems.map(sys => (
                    <SystemRow
                      key={sys.id}
                      system={sys}
                      onDelete={id => { void handleDeleteSystem(id); }}
                      onSave={(id, data) => { void handleSaveSystem(id, data); }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== Categories tab ===== */}
      {activeTab === 'categories' && (
        <section aria-label="ניהול קטגוריות">
          <div className={styles.sectionBar}>
            <h2 className={styles.sectionTitle}>קטגוריות ראשיות</h2>
            <button className={styles.addBtn} onClick={() => setShowAddCategory(true)}>
              <Plus size={16} />
              הוסף קטגוריה
            </button>
          </div>
          <div className={styles.searchBar}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="חיפוש לפי שם קטגוריה..."
              value={searchCategories}
              onChange={e => setSearchCategories(e.target.value)}
              aria-label="חיפוש קטגוריות"
            />
            {searchCategories && (
              <button className={styles.searchClear} onClick={() => setSearchCategories('')} aria-label="נקה חיפוש">
                <X size={13} />
              </button>
            )}
          </div>
          <div className={styles.catList}>
            {filteredCategories.length === 0 ? (
              <div className={styles.emptyRow}>
                {searchCategories ? `לא נמצאו תוצאות עבור "${searchCategories}"` : 'אין קטגוריות'}
              </div>
            ) : (
              filteredCategories.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onDelete={id => { void handleDeleteCategory(id); }}
                  onSave={(id, data) => { void handleSaveCategory(id, data); }}
                  onAddSub={(catId, data) => { void handleAddSub(catId, data); }}
                  onSaveSub={(subId, data) => { void handleSaveSub(subId, data); }}
                  onDeleteSub={(catId, subId) => { void handleDeleteSub(catId, subId); }}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* ===== Content (videos) tab ===== */}
      {activeTab === 'content' && (
        <section aria-label="ניהול חומרי הטמעה">
          <div className={styles.sectionBar}>
            <h2 className={styles.sectionTitle}>חומרי הטמעה</h2>
            <button
              className={styles.addBtn}
              onClick={() => setShowUploadForm(v => !v)}
            >
              {showUploadForm ? <X size={16} /> : <Plus size={16} />}
              {showUploadForm ? 'סגור' : 'הוסף סרטון'}
            </button>
          </div>

          {showUploadForm && (
            <UploadVideoForm
              onAdded={v => {
                setVideos(prev => [v, ...prev]);
                setShowUploadForm(false);
              }}
            />
          )}

          <div className={styles.searchBar}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="חיפוש לפי כותרת או תיאור..."
              value={searchVideos}
              onChange={e => setSearchVideos(e.target.value)}
              aria-label="חיפוש סרטונים"
            />
            {searchVideos && (
              <button className={styles.searchClear} onClick={() => setSearchVideos('')} aria-label="נקה חיפוש">
                <X size={13} />
              </button>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>כותרת</th>
                  <th>תיאור</th>
                  <th>קובץ</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      {searchVideos ? `לא נמצאו תוצאות עבור "${searchVideos}"` : 'אין סרטונים'}
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map(v => (
                    <VideoRow
                      key={v.id}
                      video={v}
                      onDelete={id => { void handleDeleteVideo(id); }}
                      onSave={(id, data) => { void handleSaveVideo(id, data); }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== Modals ===== */}
      {showAddSystem && (
        <AddSystemModal
          subCategories={allSubs}
          onClose={() => setShowAddSystem(false)}
          onAdd={data => { void handleAddSystem(data); }}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onAdd={data => { void handleAddCategory(data); }}
        />
      )}
    </main>
  );
}
