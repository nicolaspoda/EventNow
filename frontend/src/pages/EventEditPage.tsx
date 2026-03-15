import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Alert } from '../components/Alert';
import { ImageUpload } from '../components/upload/ImageUpload';
import { AddressAutocomplete } from '../components/location/AddressAutocomplete';
import type { AddressSuggestion } from '../services/geocodingService';
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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [categories, setCategories] = useState<CreateTicketCategoryPayload[]>([]);
  const [soldCountByIndex, setSoldCountByIndex] = useState<number[]>([]);
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
        setAddress(ev.address || '');
        setCity(ev.city || '');
        setPostalCode(ev.postalCode || '');
        setCountry(ev.country || 'France');
        setLatitude(ev.latitude);
        setLongitude(ev.longitude);
        setImageUrl(ev.imageUrl || '');
        setImagePublicId('');
        setEventDate(toDateTimeLocal(ev.eventDate));
        setEventEndDate(ev.endDate ? toDateTimeLocal(ev.endDate) : '');
        setCategories(
          ev.ticketCategories.map((c) => ({
            name: c.name,
            description: c.description || '',
            price: parsePrice(c.price),
            initial_stock: c.initialStock,
            current_stock: c.currentStock,
          })),
        );
        setSoldCountByIndex(
          ev.ticketCategories.map((c) =>
            Math.max(0, c.initialStock - c.currentStock),
          ),
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
    setSoldCountByIndex((prev) => [...prev, 0]);
  };

  const removeCategory = (index: number) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((_, i) => i !== index));
    setSoldCountByIndex((prev) => prev.filter((_, i) => i !== index));
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

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    setCity(suggestion.city);
    setPostalCode(suggestion.postcode);
    setLatitude(suggestion.coordinates.lat);
    setLongitude(suggestion.coordinates.lon);
    if (!location.trim()) {
      setLocation(`${suggestion.city}, ${suggestion.postcode}`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!title.trim()) return;
    if (!address.trim()) return;
    if (!city.trim()) return;
    if (!eventDate) return;

    if (event?.type === 'PROFESSIONAL') {
      if (!eventEndDate) return;
      if (new Date(eventEndDate) <= new Date(eventDate)) return;
    }

    const validCategories = categories.filter(
      (c) => c.name.trim() && c.initial_stock >= 1 && c.price >= 0,
    );
    if (validCategories.length === 0) return;

    const payload: UpdateEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || `${city}, ${postalCode}`,
      address: address.trim(),
      city: city.trim(),
      postal_code: postalCode.trim(),
      country: country.trim(),
      latitude,
      longitude,
      image_url: imageUrl.trim() || undefined,
      ...(imagePublicId && { image_public_id: imagePublicId }),
      event_date: toISOString(eventDate),
      ...(event?.type === 'PROFESSIONAL' && eventEndDate
        ? { end_date: toISOString(eventEndDate) }
        : {}),
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
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-center py-12">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400"
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
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Alert message={loadError} />
        <Link
          to="/dashboard/organizer"
          className="mt-4 inline-block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <nav className="mb-5" aria-label="Fil d'Ariane">
        <Link
          to="/dashboard/organizer"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Tableau de bord
        </Link>
        <span className="mx-2 text-neutral-400" aria-hidden="true">/</span>
        <Link
          to={`/events/${id}`}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          {event.title}
        </Link>
        <span className="mx-2 text-neutral-400" aria-hidden="true">/</span>
        <span className="text-neutral-600 dark:text-neutral-400">Modifier</span>
      </nav>

      <header className="mb-5">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100" id="edit-event-title">
          Modifier l'événement
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Modifiez les informations et les catégories de billets.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-labelledby="edit-event-title"
        noValidate
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 xl:gap-10">
          {/* Colonne gauche : infos générales */}
          <div className="space-y-4">
            <FormField
              id="event-title"
              label="Titre"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Concert de jazz"
              compact
            />

            <FormField
              id="event-description"
              label="Description (optionnel)"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre événement"
              compact
            />

            <AddressAutocomplete
              id="event-address"
              value={address}
              onChange={setAddress}
              onAddressSelect={handleAddressSelect}
              label="Adresse de l'événement"
              placeholder="Commencez à taper une adresse (ex: Tou...)"
              required
              compact
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="event-city"
                label="Ville"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="Ex: Toulouse"
                compact
              />
              <FormField
                id="event-postal-code"
                label="Code postal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                placeholder="Ex: 31000"
                compact
              />
            </div>

            <FormField
              id="event-location"
              label="Nom du lieu (optionnel)"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Salle Pleyel, Zénith..."
              compact
            />

            <ImageUpload
              currentImage={imageUrl || undefined}
              onUploadSuccess={(url, publicId) => {
                setImageUrl(url);
                setImagePublicId(publicId);
              }}
              label="Image de couverture (optionnel)"
              compact
            />
          </div>

          {/* Colonne droite : dates et catégories */}
          <div className="space-y-4">
            <FormField
              id="event-date"
              label="Date et heure de début"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              compact
            />
            {event?.type === 'PROFESSIONAL' && (
              <FormField
                id="event-end-date"
                label="Date et heure de fin"
                type="datetime-local"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                required
                compact
              />
            )}

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Catégories de billets
              </legend>
              {categories.map((cat, index) => (
                <div
                  key={index}
                  className="glass-card p-3 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Catégorie {index + 1}
                    </span>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
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
                    compact
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
                    compact
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
                      compact
                    />
                    <FormField
                      id={`cat-stock-${index}`}
                      label="Nombre de places"
                      type="number"
                      min={1}
                      value={cat.initial_stock === 0 ? '' : cat.initial_stock}
                      onChange={(e) =>
                        updateCategory(
                          index,
                          'initial_stock',
                          e.target.value === '' ? 0 : Number(e.target.value) || 0,
                        )
                      }
                      required
                      compact
                    />
                  </div>
                  {(cat.initial_stock !== undefined) && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-0.5">
                      <p>
                        Places déjà vendues : {soldCountByIndex[index] ?? 0} (conservées à l'enregistrement)
                      </p>
                      <p>
                        Places disponibles : {Math.max(0, (cat.initial_stock ?? 0) - (soldCountByIndex[index] ?? 0))}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCategory}
                className="w-full py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Ajouter une catégorie de billets"
              >
                + Ajouter une catégorie
              </button>
            </fieldset>
          </div>
        </div>

        {/* Erreur et boutons en bas */}
        {loadError && (
          <Alert message={loadError} onDismiss={() => setLoadError(null)} />
        )}

        <div className="flex gap-4 pt-2">
          <PrimaryButton type="submit" loading={submitLoading}>
            {submitLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </PrimaryButton>
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center justify-center px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
