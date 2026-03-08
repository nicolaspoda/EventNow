import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { participationService } from '../services/participationService';
import type { Notification } from '../types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getForUser(false);
      setNotifications(data);
      await fetchUnreadCount();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    setIsOpen(false);

    if (notification.relatedId) {
      switch (notification.type) {
        case 'NEW_EVENT_FROM_FOLLOWED':
        case 'EVENT_UPDATED':
        case 'EVENT_REMINDER_7_DAYS':
        case 'EVENT_REMINDER_1_DAY':
          navigate(`/events/${notification.relatedId}`);
          break;
        case 'PARTICIPATION_REQUEST': {
          try {
            const { eventId } = await participationService.resolveEventIdForNotification(
              notification.relatedId,
            );
            navigate(`/events/${eventId}/participation-requests`);
          } catch (err) {
            console.error('Impossible de résoudre la redirection:', err);
          }
          break;
        }
        case 'ORDER_CONFIRMED':
        case 'REFUND_APPROVED':
        case 'REFUND_REJECTED':
          navigate(`/my-orders`);
          break;
        case 'PARTICIPATION_ACCEPTED':
        case 'PARTICIPATION_REFUSED':
          navigate(`/my-upcoming-events`);
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_EVENT_FROM_FOLLOWED':
        return '🎉';
      case 'EVENT_REMINDER_7_DAYS':
      case 'EVENT_REMINDER_1_DAY':
        return '⏰';
      case 'ORDER_CONFIRMED':
        return '✅';
      case 'REFUND_APPROVED':
        return '💰';
      case 'REFUND_REJECTED':
        return '❌';
      case 'PARTICIPATION_REQUEST':
        return '🙋';
      case 'PARTICIPATION_ACCEPTED':
        return '✅';
      case 'PARTICIPATION_REFUSED':
        return '❌';
      case 'EVENT_UPDATED':
        return '📝';
      default:
        return '🔔';
    }
  };

  const formatNotificationDate = (createdAt: string | undefined): string => {
    if (!createdAt) return '—';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '—';
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-96 max-h-[500px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <svg
                  className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                  Aucune notification
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                        !notification.read
                          ? 'bg-primary-50/50 dark:bg-primary-900/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium ${
                                !notification.read
                                  ? 'text-neutral-900 dark:text-white'
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {notification.body}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                            {formatNotificationDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
