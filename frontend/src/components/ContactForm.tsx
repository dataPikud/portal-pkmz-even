import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import type { ContactType } from '../types';
import styles from './ContactForm.module.css';

const CONTACT_TYPES: ContactType[] = ['תקלה', 'רעיון', 'דיווח', 'אחר'];

interface FormState {
  title: string;
  description: string;
  type: ContactType;
  employeeId: string;
}

export function ContactForm() {
  const user = useAuthStore(s => s.user);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    type: 'תקלה',
    employeeId: user?.employeeId ?? '',
  });

  function handleOpen() {
    setSent(false);
    setError('');
    setForm({
      title: '',
      description: '',
      type: 'תקלה',
      employeeId: user?.employeeId ?? '',
    });
    setOpen(true);
  }

  useEffect(() => {
    const handleOpenEvent = () => handleOpen();
    window.addEventListener('open-contact-form', handleOpenEvent);
    return () => window.removeEventListener('open-contact-form', handleOpenEvent);
  }, [user]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.employeeId.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.contact.send(form);
      setSent(true);
    } catch {
      setError('שגיאה בשליחה – נסה שוב');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* כפתור צף */}
      <button
        className={styles.fab}
        onClick={handleOpen}
        aria-label="שליחת פנייה למנהל"
        title="שלח פנייה"
      >
        <MessageSquarePlus size={22} />
      </button>

      {/* Modal */}
      {open && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="שליחת פנייה למנהל המערכת"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className={styles.modal}>
            <div className={styles.header}>
              <h2 className={styles.headerTitle}>פנייה למנהל המערכת</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className={styles.successState}>
                <CheckCircle size={48} className={styles.successIcon} aria-hidden="true" />
                <p className={styles.successMsg}>הפנייה נשלחה בהצלחה!</p>
                <p className={styles.successSub}>נחזור אליך בהקדם</p>
                <button className={styles.doneBtn} onClick={() => setOpen(false)}>
                  סגור
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={e => { void handleSubmit(e); }} noValidate>
                {/* כותרת */}
                <label className={styles.label}>
                  כותרת <span className={styles.required} aria-hidden="true">*</span>
                  <input
                    required
                    className={styles.input}
                    placeholder="תיאור קצר של הפנייה"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </label>

                {/* סוג פנייה */}
                <label className={styles.label}>
                  סוג פנייה <span className={styles.required} aria-hidden="true">*</span>
                  <div className={styles.typeGrid} role="group" aria-label="בחר סוג פנייה">
                    {CONTACT_TYPES.map(t => (
                      <label key={t} className={styles.typeOption}>
                        <input
                          type="radio"
                          name="contact-type"
                          value={t}
                          checked={form.type === t}
                          onChange={() => setForm(f => ({ ...f, type: t }))}
                          className={styles.radioInput}
                        />
                        <span className={form.type === t ? styles.typePillActive : styles.typePill}>
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                </label>

                {/* תיאור */}
                <label className={styles.label}>
                  תיאור מפורט <span className={styles.required} aria-hidden="true">*</span>
                  <textarea
                    required
                    className={styles.textarea}
                    placeholder="פרט את הפנייה..."
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </label>

                {/* מזהה ארגוני */}
                <label className={styles.label}>
                  מזהה ארגוני <span className={styles.required} aria-hidden="true">*</span>
                  <input
                    required
                    className={styles.input}
                    placeholder="מספר עובד / מזהה ארגוני"
                    value={form.employeeId}
                    onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  />
                </label>

                {error && <p className={styles.errorMsg} role="alert">{error}</p>}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  <Send size={16} aria-hidden="true" />
                  {submitting ? 'שולח...' : 'שלח פנייה'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
