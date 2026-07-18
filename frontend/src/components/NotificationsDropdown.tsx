import { useEffect, useState, useRef } from 'react';
import { Check, BellOff, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import type { SystemNotification } from '../types';
import styles from './NotificationsDropdown.module.css';

interface NotificationsDropdownProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationsDropdown({ onClose, onUnreadCountChange }: NotificationsDropdownProps) {
  const user = useAuthStore(s => s.user);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = `portal-read-notifications-${user?.employeeId || 'guest'}`;

  // Load read status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(JSON.parse(stored) as number[]);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Fetch notifications
  useEffect(() => {
    void api.notifications.list()
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Update unread count back to Navbar
  useEffect(() => {
    const unread = notifications.filter(n => !readIds.includes(n.id)).length;
    onUnreadCountChange(unread);
  }, [notifications, readIds, onUnreadCountChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  function markAsRead(id: number) {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function markAllAsRead() {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem(storageKey, JSON.stringify(allIds));
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className={styles.dropdown} ref={dropdownRef} role="dialog" aria-label="הודעות מערכת">
      <div className={styles.header}>
        <h3 className={styles.title}>הודעות מערכת</h3>
        {notifications.length > 0 && notifications.some(n => !readIds.includes(n.id)) && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            <Check size={14} />
            סמן הכל כנקרא
          </button>
        )}
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.stateCenter}>
            <Loader2 className={styles.spinner} size={20} />
            <span>טוען הודעות...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.stateCenter}>
            <BellOff size={24} className={styles.emptyIcon} />
            <span className={styles.emptyText}>אין הודעות חדשות</span>
          </div>
        ) : (
          <ul className={styles.list}>
            {notifications.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <li
                  key={n.id}
                  className={`${styles.item} ${!isRead ? styles.itemUnread : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    {!isRead && <span className={styles.unreadDot} title="לא נקרא" />}
                  </div>
                  <p className={styles.itemMessage}>{n.message}</p>
                  <span className={styles.itemTime}>{formatTime(n.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
