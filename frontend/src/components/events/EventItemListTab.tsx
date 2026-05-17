import React, { useState, useEffect, useCallback } from 'react';
import {
  eventItemsService,
  type EventItem,
  type EventItemList,
} from '../../services/eventItemsService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';

interface Props {
  eventId: string;
  currentUserId: string;
  isOrganizer: boolean;
}

const EventItemListTab: React.FC<Props> = ({
  eventId,
  currentUserId,
  isOrganizer,
}) => {
  const [list, setList] = useState<EventItemList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EventItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      setError(null);
      const data = await eventItemsService.getList(eventId);
      setList(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement de la liste'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAdd = async (dto: Parameters<typeof eventItemsService.addItem>[1]) => {
    const updated = await eventItemsService.addItem(eventId, dto);
    setList(updated);
  };

  const handleEdit = async (
    dto: Parameters<typeof eventItemsService.updateItem>[2],
  ) => {
    if (!editItem) return;
    const updated = await eventItemsService.updateItem(eventId, editItem.id, dto);
    setList(updated);
  };

  const handleDelete = async (itemId: string) => {
    setActionError(null);
    try {
      const updated = await eventItemsService.deleteItem(eventId, itemId);
      setList(updated);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Erreur lors de la suppression"));
    }
  };

  const handleClaim = async (itemId: string) => {
    setActionError(null);
    try {
      const updated = await eventItemsService.claimItem(eventId, itemId);
      setList(updated);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Erreur lors de la mise à jour"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
          aria-label="Chargement..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center py-8 text-error-600 dark:text-error-400"
        role="alert"
      >
        {error}
      </div>
    );
  }

  const items = list?.items ?? [];
  const unclaimed = items.filter((i) => i.status === 'UNCLAIMED');
  const claimed = items.filter((i) => i.status === 'CLAIMED');
  const claimedCount = claimed.length;
  const totalCount = items.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((claimedCount / totalCount) * 100);

  const canEditOrDelete = (item: EventItem) =>
    isOrganizer || item.addedById === currentUserId;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            Liste de courses
            <span className="text-sm font-normal bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2.5 py-0.5 rounded-full">
              {totalCount} article{totalCount !== 1 ? 's' : ''} · {claimedCount} pris en charge
            </span>
          </h2>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Progression</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={claimedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
        >
          + Ajouter un article
        </Button>
      </div>

      {actionError && (
        <p
          className="text-sm text-error-600 dark:text-error-400 mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg"
          role="alert"
        >
          {actionError}
        </p>
      )}

      {totalCount === 0 && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <svg
            className="mx-auto h-12 w-12 mb-3 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">Aucun article pour l'instant.</p>
          <p className="text-sm">Ajoutez ce dont vous aurez besoin !</p>
        </div>
      )}

      {/* Unclaimed section */}
      {unclaimed.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            À apporter ({unclaimed.length})
          </h3>
          <ul className="space-y-2">
            {unclaimed.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                canEditOrDelete={canEditOrDelete(item)}
                onClaim={() => handleClaim(item.id)}
                onEdit={() => setEditItem(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Claimed section */}
      {claimed.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            Pris en charge ({claimed.length})
          </h3>
          <ul className="space-y-2">
            {claimed.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                canEditOrDelete={canEditOrDelete(item)}
                onClaim={() => handleClaim(item.id)}
                onEdit={() => setEditItem(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {addModalOpen && (
        <AddItemModal
          onSubmit={handleAdd}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onSubmit={handleEdit}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Item card
// ---------------------------------------------------------------------------

interface ItemCardProps {
  item: EventItem;
  canEditOrDelete: boolean;
  onClaim: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  canEditOrDelete,
  onClaim,
  onEdit,
  onDelete,
}) => {
  const isClaimed = item.status === 'CLAIMED';
  const isClaimedByMe = item.isClaimedByMe;
  const claimerName =
    item.claimedBy?.username ?? 'Quelqu\'un';

  return (
    <li className="flex items-center gap-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {item.name}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            ×{item.quantity}
            {item.unit ? ` ${item.unit}` : ''}
          </span>
          {isClaimedByMe && (
            <span className="text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 px-2 py-0.5 rounded-full">
              Vous apportez cet article
            </span>
          )}
        </div>
        {item.note && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
            {item.note}
          </p>
        )}
        {isClaimed && !isClaimedByMe && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {claimerName} s'en charge
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Claim button */}
        {!isClaimed && (
          <button
            type="button"
            onClick={onClaim}
            className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-success-500 border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white"
          >
            Je m'en charge
          </button>
        )}
        {isClaimedByMe && (
          <button
            type="button"
            onClick={onClaim}
            className="text-xs font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            Annuler
          </button>
        )}

        {/* Edit / Delete — shown only for owner/organizer on UNCLAIMED items */}
        {canEditOrDelete && !isClaimed && (
          <>
            <button
              type="button"
              onClick={onEdit}
              aria-label="Modifier l'article"
              className="text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer l'article"
              className="text-neutral-400 hover:text-error-600 dark:hover:text-error-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-error-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default EventItemListTab;
