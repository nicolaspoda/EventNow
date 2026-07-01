import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { eventService } from '../services/eventService';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Alert } from '../components/Alert';
import { ImageUpload } from '../components/upload/ImageUpload';
import { AddressAutocomplete } from '../components/location/AddressAutocomplete';
import type { AddressSuggestion } from '../services/geocodingService';
import type {
  CreateEventPayload,
  CreateTicketCategoryPayload,
  EventTypeCreate,
} from '../types/event.types';

const initialCategory: CreateTicketCategoryPayload = {
  name: '',
  description: '',
  price: 0,
  initial_stock: 0,
};

function toISOString(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString();
}

export function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCommunity = user?.role === 'USER';
  const minTicketPrice = 0.5;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('France');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [communityPlaces, setCommunityPlaces] = useState(0);
  const [categories, setCategories] = useState<CreateTicketCategoryPayload[]>([
    { ...initialCategory },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addCategory = () => {
    setCategories((prev) => [...prev, { ...initialCategory }]);
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

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    setCity(suggestion.city);
    setPostalCode(suggestion.postcode);
    setLatitude(suggestion.coordinates.lat);
    setLongitude(suggestion.coordinates.lon);
    setLocation(`${suggestion.city}, ${suggestion.postcode}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!address.trim()) {
      setError('L\'adresse est obligatoire');
      return;
    }
    if (!city.trim()) {
      setError('La ville est obligatoire');
      return;
    }
    if (!eventDate) {
      setError('La date de l\'événement est obligatoire');
      return;
    }

    if (!isCommunity) {
      if (!eventEndDate) {
        setError('La date et heure de fin sont obligatoires pour un événement professionnel');
        return;
      }
      if (new Date(eventEndDate) <= new Date(eventDate)) {
        setError('La date de fin doit être postérieure à la date de début');
        return;
      }
    }

    const eventType: EventTypeCreate = isCommunity ? 'COMMUNITY' : 'PROFESSIONAL';
    let ticketCategories: { name: string; description?: string; price: number; initial_stock: number }[];

    if (isCommunity) {
      if (communityPlaces < 1) {
        setError('Indiquez le nombre de places (au moins 1)');
        return;
      }
      ticketCategories = [
        {
          name: 'Participation',
          price: minTicketPrice,
          initial_stock: communityPlaces,
        },
      ];
    } else {
      const validCategories = categories.filter(
        (c) =>
          c.name.trim() && c.initial_stock >= 1 && Number(c.price) >= minTicketPrice,
      );
      if (validCategories.length === 0) {
        setError(
          `Ajoutez au moins une catégorie de billets avec un nom, un stock et un prix ≥ ${minTicketPrice.toFixed(
            2,
          )} €`,
        );
        return;
      }
      ticketCategories = validCategories.map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || undefined,
        price: Number(c.price),
        initial_stock: Number(c.initial_stock),
      }));
    }

    const payload: CreateEventPayload = {
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
      image_public_id: imagePublicId.trim() || undefined,
      event_date: toISOString(eventDate),
      ...(isCommunity ? {} : { end_date: toISOString(eventEndDate) }),
      type: eventType,
      ticket_categories: ticketCategories,
    };

    setLoading(true);
    try {
      const created = await eventService.createEvent(payload);
      const eventId = created?.id ?? (created as { id?: string } | undefined)?.id;
      if (eventId) {
        navigate(`/events/${eventId}`, { replace: true });
        return;
      }
      if (user?.role === 'ORGANIZER') {
        navigate('/dashboard/organizer');
      } else {
        navigate('/dashboard/user');
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: unknown; status?: number } }).response
        : undefined;
      const data = res?.data;
      let msg = 'Erreur lors de la création de l\'événement';
      if (data && typeof data === 'object') {
        const d = data as { message?: string | string[] };
        if (typeof d.message === 'string') msg = d.message;
        else if (Array.isArray(d.message)) msg = d.message.join(', ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100" id="create-event-title">
          Créer un événement
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {isCommunity
            ? 'Renseignez les informations de votre événement et le nombre de places disponibles.'
            : 'Renseignez les informations de votre événement et les catégories de billets.'}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-labelledby="create-event-title"
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
              compact
            />

            <FormField
              id="event-description"
              label="Description (optionnel)"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              compact
            />

            <AddressAutocomplete
              id="event-address"
              value={address}
              onChange={setAddress}
              onAddressSelect={handleAddressSelect}
              label="Adresse de l'événement"
              placeholder=""
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
                compact
              />
              <FormField
                id="event-postal-code"
                label="Code postal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                compact
              />
            </div>

            <FormField
              id="event-location"
              label="Nom du lieu (optionnel)"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
              hideEmptyHelperText
            />
          </div>

          {/* Colonne droite : dates, places/catégories */}
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
            {!isCommunity && (
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

            {isCommunity ? (
              <FormField
                id="event-places"
                label="Nombre de places"
                type="number"
                min={1}
                value={communityPlaces === 0 ? '' : communityPlaces}
                onChange={(e) =>
                  setCommunityPlaces(
                    e.target.value === '' ? 0 : Number(e.target.value) || 0,
                  )
                }
                required
                compact
              />
            ) : (
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
                      compact
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        id={`cat-price-${index}`}
                        label="Prix (€)"
                        type="number"
                        min={minTicketPrice}
                        step={0.01}
                        value={cat.price === 0 ? '' : cat.price}
                        onChange={(e) =>
                          updateCategory(
                            index,
                            'price',
                            e.target.value === '' ? 0 : Number(e.target.value),
                          )
                        }
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
            )}
          </div>
        </div>

        {/* Erreur et boutons en bas : l'erreur reste visible au clic sur "Créer l'événement" */}
        {error && (
          <Alert message={error} onDismiss={() => setError('')} />
        )}

        <div className="flex gap-4 pt-2">
          <PrimaryButton type="submit" loading={loading}>
            {loading ? 'Création...' : 'Créer l\'événement'}
          </PrimaryButton>
          <Link
            to="/events"
            className="inline-flex items-center justify-center px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
