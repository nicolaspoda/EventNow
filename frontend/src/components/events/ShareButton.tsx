import React from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface ShareButtonProps {
  eventId: string;
  eventTitle: string;
  variant?: 'icon' | 'button';
}

const ShareIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ShareButton: React.FC<ShareButtonProps> = ({
  eventId,
  eventTitle,
  variant = 'button',
}) => {
  const { copy, copied } = useCopyToClipboard();
  const shareUrl = `${window.location.origin}/events/${eventId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Découvrez l'événement "${eventTitle}" sur EventNow`,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or not supported — fall through to clipboard
      }
    }
    await copy(shareUrl);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleShare();
        }}
        aria-label="Partager cet événement"
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
          copied
            ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
        }`}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Partager cet événement"
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        copied
          ? 'border-success-500 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 focus:ring-success-500'
          : 'border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:ring-primary-500'
      }`}
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copié !</span>
        </>
      ) : (
        <>
          <ShareIcon />
          <span>Partager</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;
