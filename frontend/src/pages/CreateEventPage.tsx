import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { eventService } from '../services/eventService';
import { FormField, FormSelect } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Alert } from '../components/Alert';
import { ImageUpload } from '../components/upload/ImageUpload';
import type {
  CreateEventPayload,
  CreateTicketCategoryPayload,
  EventTypeCreate,
} from '../types/event.types';

const EVENT_TYPE_OPTIONS: { value: EventTypeCreate; label: string }[] = [
  { value: 'PROFESSIONAL', label: 'Professionnel (concert, conférence...)' },
  { value: 'COMMUNITY', label: 'Communautaire (soirée, barbecue...)' },
];

const initialCategory: CreateTicketCategoryPayload = {
  name: '',
  description: '',
  price: 0,
  initial_stock: 10,
};

function toISOString(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString();
}

export function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [type, setType] = useState<EventTypeCreate>(
    user?.role === 'CLIENT' ? 'COMMUNITY' : 'PROFESSIONAL',
  );
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!location.trim()) {
      setError('Le lieu est obligatoire');
      return;
    }
    if (!eventDate) {
      setError('La date de l\'événement est obligatoire');
      return;
    }

    const validCategories = categories.filter(
      (c) => c.name.trim() && c.initial_stock >= 1 && c.price >= 0,
    );
    if (validCategories.length === 0) {
      setError('Ajoutez au moins une catégorie de billets avec un nom et un stock');
      return;
    }

    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim(),
      image_url: imageUrl.trim() || undefined,
      image_public_id: imagePublicId.trim() || undefined,
      event_date: toISOString(eventDate),
      type,
      ticket_categories: validCategories.map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || undefined,
        price: Number(c.price),
        initial_stock: Number(c.initial_stock),
      })),
    };

    setLoading(true);
    try {
      const created = await eventService.createEvent(payload);
      if (created?.id) {
        navigate(`/events/${created.id}`, { replace: true });
      } else if (user?.role === 'ORGANIZER') {
        navigate('/dashboard/organizer');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(msg || 'Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" id="create-event-title">
          Créer un événement
        </h1>
        <p className="text-gray-600 mt-2">
          Renseignez les informations de votre événement et les catégories de
          billets.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-labelledby="create-event-title"
        noValidate
      >
        {error && (
          <Alert message={error} />
        )}

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

        <FormSelect
          id="event-type"
          label="Type d'événement"
          value={type}
          onChange={(e) => setType(e.target.value as EventTypeCreate)}
          options={EVENT_TYPE_OPTIONS}
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
          <PrimaryButton type="submit" loading={loading}>
            {loading ? 'Création...' : 'Créer l\'événement'}
          </PrimaryButton>
          <Link
            to="/events"
            className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
