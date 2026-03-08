import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { followService } from '../../services/followService';
import Button from '../ui/Button';

export type ProfileListTab = 'followers' | 'following' | 'friends';

export interface ProfileListUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  followedAt: string;
  isFollowingByCurrentUser?: boolean;
  isFriendWithCurrentUser?: boolean;
}

interface ProfileListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUserId: string;
  currentUserId: string | undefined;
  initialTab: ProfileListTab;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  onUpdate?: () => void;
}

const UNFOLLOW_CONFIRM_ABONNE = 'Se désabonner ? Vous ne verrez plus les publications de cette personne.';
const UNFOLLOW_CONFIRM_AMI = 'Se désabonner ? Vous ne serez plus amis.';

export function ProfileListsModal({
  isOpen,
  onClose,
  profileUserId,
  currentUserId,
  initialTab,
  followersCount,
  followingCount,
  friendsCount,
  onUpdate,
}: ProfileListsModalProps) {
  const [tab, setTab] = useState<ProfileListTab>(initialTab);
  const [list, setList] = useState<ProfileListUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [confirmUnfollow, setConfirmUnfollow] = useState<{
    userId: string;
    displayName: string;
    isFriend: boolean;
  } | null>(null);

  const fetchList = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      if (tab === 'followers') {
        const data = await followService.getFollowers(profileUserId);
        setList(Array.isArray(data) ? data : []);
      } else if (tab === 'following') {
        const data = await followService.getFollowing(profileUserId);
        setList(Array.isArray(data) ? data : []);
      } else {
        const data = await followService.getFriends(profileUserId);
        setList(Array.isArray(data) ? data : []);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [profileUserId, tab, currentUserId]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchList();
    } else {
      setList([]);
    }
  }, [isOpen, tab, currentUserId, fetchList]);

  const getDisplayName = (u: ProfileListUser) =>
    u.firstName && u.lastName
      ? `${u.firstName} ${u.lastName}`.trim()
      : u.email?.split('@')[0] ?? 'Utilisateur';

  const handleFollow = async (userId: string) => {
    if (!currentUserId || userId === currentUserId) return;
    setActionUserId(userId);
    try {
      await followService.follow(userId);
      await fetchList();
      onUpdate?.();
    } finally {
      setActionUserId(null);
    }
  };

  const handleUnfollowClick = (u: ProfileListUser) => {
    setConfirmUnfollow({
      userId: u.id,
      displayName: getDisplayName(u),
      isFriend: u.isFriendWithCurrentUser === true,
    });
  };

  const handleConfirmUnfollow = async () => {
    if (!confirmUnfollow || !currentUserId) return;
    setActionUserId(confirmUnfollow.userId);
    try {
      await followService.unfollow(confirmUnfollow.userId);
      setConfirmUnfollow(null);
      await fetchList();
      onUpdate?.();
    } finally {
      setActionUserId(null);
    }
  };

  const handleClose = () => {
    setConfirmUnfollow(null);
    onClose();
  };

  if (!isOpen) return null;

  const tabs: { key: ProfileListTab; label: string; count: number }[] = [
    { key: 'followers', label: 'Abonnés', count: followersCount },
    { key: 'following', label: 'Abonnements', count: followingCount },
    { key: 'friends', label: 'Amis', count: friendsCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-lists-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 id="profile-lists-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
            Liste
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-0 ${
                tab === key
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-12 px-4">
              Aucun utilisateur dans cette liste.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {list.map((user) => (
                <li key={user.id} className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                  <Link
                    to={`/user/${user.id}/profile`}
                    onClick={handleClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {getDisplayName(user)}
                    </span>
                  </Link>
                  {currentUserId && user.id !== currentUserId && (
                    <div className="flex-shrink-0">
                      {user.isFollowingByCurrentUser ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!actionUserId}
                          onClick={() => handleUnfollowClick(user)}
                          className="min-w-[90px]"
                        >
                          {user.isFriendWithCurrentUser ? 'Amis' : 'Abonné'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!!actionUserId}
                          onClick={() => handleFollow(user.id)}
                        >
                          {actionUserId === user.id ? 'Chargement...' : 'Suivre'}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {confirmUnfollow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setConfirmUnfollow(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-neutral-700 dark:text-neutral-200 mb-2">
              {confirmUnfollow.isFriend ? UNFOLLOW_CONFIRM_AMI : UNFOLLOW_CONFIRM_ABONNE}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {confirmUnfollow.displayName}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmUnfollow(null)}
                disabled={!!actionUserId}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmUnfollow}
                disabled={!!actionUserId}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {actionUserId ? 'Chargement...' : 'Se désabonner'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
