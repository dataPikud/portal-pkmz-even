import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, X, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import type { MainCategory, SubCategory, System } from '../types';
import styles from './AdminPage.module.css';

// ===== Inline edit form =====
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
      if (typeof reader.result === 'string') {
        setForm(f => ({ ...f, imageUrl: reader.result as string }));
      }
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
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                title="העלאת קובץ תמונה"
              >
                <Upload size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="תצוגה מקדימה" className={styles.thumbPreview} />
            )}
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
            <div className={styles.tableThumbPlaceholder}>
              <ImageIcon size={14} />
            </div>
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
  subCategories,
  onClose,
  onAdd,
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
      if (typeof reader.result === 'string') {
        setForm(f => ({ ...f, imageUrl: reader.result as string }));
      }
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
              <input
                className={styles.input}
                placeholder="https://example.com/image.png או העלה קובץ"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              />
              <button
                type="button"
                className={styles.fileUploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} />
                העלאת קובץ
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
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
              {subCategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
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

// ===== Main AdminPage =====
export function AdminPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [allSubs, setAllSubs] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSystem, setShowAddSystem] = useState(false);
  const [activeTab, setActiveTab] = useState<'systems' | 'categories'>('systems');

  // Redirect non-admins
  useEffect(() => {
    if (user && !user.isAdmin) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    void Promise.all([
      api.mainCategories.list(),
      api.systems.list(),
    ]).then(([cats, sysList]) => {
      setCategories(cats);
      setSystems(sysList);
      const subs: SubCategory[] = cats.flatMap(c => c.subCategories ?? []);
      setAllSubs(subs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  async function handleDeleteCategory(id: number) {
    if (!confirm('למחוק את הקטגוריה ואת כל תוכנה?')) return;
    await api.mainCategories.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
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
        <button
          role="tab"
          aria-selected={activeTab === 'systems'}
          className={activeTab === 'systems' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('systems')}
        >
          מערכות ({systems.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'categories'}
          className={activeTab === 'categories' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('categories')}
        >
          קטגוריות ({categories.length})
        </button>
      </div>

      {activeTab === 'systems' && (
        <section aria-label="ניהול מערכות">
          <div className={styles.sectionBar}>
            <h2 className={styles.sectionTitle}>מערכות</h2>
            <button className={styles.addBtn} onClick={() => setShowAddSystem(true)}>
              <Plus size={16} />
              הוסף מערכת
            </button>
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
                {systems.map(sys => (
                  <SystemRow
                    key={sys.id}
                    system={sys}
                    onDelete={id => { void handleDeleteSystem(id); }}
                    onSave={(id, data) => { void handleSaveSystem(id, data); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'categories' && (
        <section aria-label="ניהול קטגוריות">
          <h2 className={styles.sectionTitle}>קטגוריות ראשיות</h2>
          <div className={styles.catList}>
            {categories.map(cat => (
              <div key={cat.id} className={styles.catRow}>
                <div className={styles.catInfo}>
                  <span
                    className={styles.catDot}
                    style={{ background: cat.color ?? '#0f766e' }}
                  />
                  <strong>{cat.name}</strong>
                  <span className={styles.mutedText}>
                    {cat.subCategories?.length ?? 0} תת-קטגוריות
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => { void handleDeleteCategory(cat.id); }}
                  aria-label={`מחק ${cat.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAddSystem && (
        <AddSystemModal
          subCategories={allSubs}
          onClose={() => setShowAddSystem(false)}
          onAdd={data => { void handleAddSystem(data); }}
        />
      )}
    </main>
  );
}
