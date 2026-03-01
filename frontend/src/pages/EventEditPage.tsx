import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Alert } from '../components/Alert';
import { ImageUpload } from '../components/upload/ImageUpload';
import type {
  Event,
  UpdateEventPayload,
  CreateTicketCategoryPayload,
} from '../types/event.types';
import { parsePrice } from '../utils/price';

function toISOString(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString();
}

function toDateTimeLocal(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [categories, setCategories] = useState<CreateTicketCategoryPayload[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    eventService
      .getEventById(id)
      .then((ev) => {
        if (cancelled) return;
        setEvent(ev);
        setTitle(ev.title);
        setDescription(ev.description || '');
        setLocation(ev.location);
        setImageUrl(ev.imageUrl || '');
        setImagePublicId('');
        setEventDate(toDateTimeLocal(ev.eventDate));
        setCategories(
          ev.ticketCategories.map((c) => ({
            name: c.name,
            description: c.description || '',
            price: parsePrice(c.price),
            initial_stock: c.initialStock,
            current_stock: c.currentStock,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message || 'Erreur lors du chargement de l\'événement';
          setLoadError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      { name: '', description: '', price: 0, initial_stock: 10 },
    ]);
  };

  const removeCategory = (index: number) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategory = (
    index: number,
    field: keyof CreateTicketCategoryPayload,
    value: string | number,
  ) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!title.trim()) return;
    if (!location.trim()) return;
    if (!eventDate) return;

    const validCategories = categories.filter(
      (c) => c.name.trim() && c.initial_stock >= 1 && c.price >= 0,
    );
    if (validCategories.length === 0) return;

    const payload: UpdateEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim(),
      image_url: imageUrl.trim() || undefined,
      ...(imagePublicId && { image_public_id: imagePublicId }),
      event_date: toISOString(eventDate),
      ticket_categories: validCategories.map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || undefined,
        price: Number(c.price),
        initial_stock: Number(c.initial_stock),
        current_stock: c.current_stock !== undefined ? Number(c.current_stock) : undefined,
      })),
    };

    setSubmitLoading(true);
    try {
      await eventService.updateEvent(id, payload);
      navigate(`/events/${id}`, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setLoadError(msg || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
            role="status"
            aria-label="Chargement"
          />
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  if (loadError && !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert message={loadError} />
        <Link
          to="/dashboard/organizer"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="mb-6" aria-label="Fil d'Ariane">
        <Link
          to="/dashboard/organizer"
          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Tableau de bord
        </Link>
        <span className="mx-2 text-gray-400" aria-hidden="true">/</span>
        <Link
          to={`/events/${id}`}
          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          {event.title}
        </Link>
        <span className="mx-2 text-gray-400" aria-hidden="true">/</span>
        <span className="text-gray-700">Modifier</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" id="edit-event-title">
          Modifier l'événement
        </h1>
        <p className="text-gray-600 mt-2">
          Modifiez les informations et les catégories de billets.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-labelledby="edit-event-title"
        noValidate
      >
        {loadError && <Alert message={loadError} />}

        <FormField
          id="event-title"
          label="Titre"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ex: Concert de jazz"
        />

        <FormField
          id="event-description"
          label="Description (optionnel)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre événement"
        />

        <FormField
          id="event-location"
          label="Lieu"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="Ex: Salle Pleyel, Paris"
        />

        <ImageUpload
          currentImage={imageUrl || undefined}
          onUploadSuccess={(url, publicId) => {
            setImageUrl(url);
            setImagePublicId(publicId);
          }}
          label="Image de couverture (optionnel)"
        />

        <FormField
          id="event-date"
          label="Date et heure"
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-900">
            Catégories de billets
          </legend>
          {categories.map((cat, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Catégorie {index + 1}
                </span>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    aria-label={`Supprimer la catégorie ${index + 1}`}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <FormField
                id={`cat-name-${index}`}
                label="Nom"
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(index, 'name', e.target.value)}
                required
                placeholder="Ex: Standard, VIP"
              />
              <FormField
                id={`cat-desc-${index}`}
                label="Description (optionnel)"
                type="text"
                value={cat.description || ''}
                onChange={(e) =>
                  updateCategory(index, 'description', e.target.value)
                }
                placeholder="Ex: Place assise"
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id={`cat-price-${index}`}
                  label="Prix (€)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={cat.price === 0 ? '' : cat.price}
                  onChange={(e) =>
                    updateCategory(
                      index,
                      'price',
                      e.target.value === '' ? 0 : Number(e.target.value),
                    )
                  }
                  placeholder="0"
                />
                <FormField
                  id={`cat-stock-${index}`}
                  label="Nombre de places"
                  type="number"
                  min={1}
                  value={cat.initial_stock}
                  onChange={(e) =>
                    updateCategory(
                      index,
                      'initial_stock',
                      Number(e.target.value) || 1,
                    )
                  }
                  required
                />
              </div>
              {cat.current_stock !== undefined && (
                <p className="text-xs text-gray-500">
                  Places déjà vendues : {cat.current_stock} (conservées à l'enregistrement)
                </p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCategory}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Ajouter une catégorie de billets"
          >
            + Ajouter une catégorie
          </button>
        </fieldset>

        <div className="flex gap-4">
          <PrimaryButton type="submit" loading={submitLoading}>
            {submitLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </PrimaryButton>
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
