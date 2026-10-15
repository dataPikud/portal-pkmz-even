import { useState } from 'react';
import { X, Check, Bell } from 'lucide-react';
import { api } from '../../lib/api';
import styles from './SystemModal.module.css';

interface NotificationModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function NotificationModal({ onClose, onSave }: NotificationModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('כותרת ותוכן ההודעה הם שדות חובה');
      return;
    }

    setSaving(true);
    try {
      await api.notifications.create({ title, message });
      onSave();
      onClose();
    } catch {
      alert('יצירת ההודעה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <Bell size={20} color="#3b82f6" />
            <h2>יצירת הודעת מערכת חדשה</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>כותרת ההודעה *</label>
              <input
                type="text"
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="לדוג׳ תחזוקה מתוכננת בפורטל"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>תוכן ההודעה *</label>

              <textarea
                className={styles.input}
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="פירוט ההודעה שתוצג בפעמון ההתראות של המשתמשים..."
                required
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              <Check size={16} /> {saving ? 'שולח...' : 'פרסם הודעה'}
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
