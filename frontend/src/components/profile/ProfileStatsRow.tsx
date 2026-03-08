import { useState } from 'react';
import { ProfileListsModal, type ProfileListTab } from './ProfileListsModal';

interface ProfileStatsRowProps {
  profileUserId: string;
  currentUserId: string | undefined;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  onUpdate?: () => void;
}

export function ProfileStatsRow({
  profileUserId,
  currentUserId,
  followersCount,
  followingCount,
  friendsCount,
  onUpdate,
}: ProfileStatsRowProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<ProfileListTab>('followers');

  const openModal = (tab: ProfileListTab) => {
    if (!currentUserId) return;
    setInitialTab(tab);
    setModalOpen(true);
  };

  const canOpen = !!currentUserId;

  return (
    <>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        {canOpen ? (
          <>
            <button
              type="button"
              onClick={() => openModal('followers')}
              className="hover:underline focus:outline-none focus:underline"
            >
              {followersCount} abonné{followersCount !== 1 ? 's' : ''}
            </button>
            {' · '}
            <button
              type="button"
              onClick={() => openModal('following')}
              className="hover:underline focus:outline-none focus:underline"
            >
              {followingCount} abonnement{followingCount !== 1 ? 's' : ''}
            </button>
            {' · '}
            <button
              type="button"
              onClick={() => openModal('friends')}
              className="hover:underline focus:outline-none focus:underline"
            >
              {friendsCount} ami{friendsCount !== 1 ? 's' : ''}
            </button>
          </>
        ) : (
          <>
            {followersCount} abonné{followersCount !== 1 ? 's' : ''}
            {' · '}
            {followingCount} abonnement{followingCount !== 1 ? 's' : ''}
            {' · '}
            {friendsCount} ami{friendsCount !== 1 ? 's' : ''}
          </>
        )}
      </p>
      <ProfileListsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        profileUserId={profileUserId}
        currentUserId={currentUserId}
        initialTab={initialTab}
        followersCount={followersCount}
        followingCount={followingCount}
        friendsCount={friendsCount}
        onUpdate={onUpdate}
      />
    </>
  );
}
