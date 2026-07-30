import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEditPage } from '../pages/EventEditPage';
import { eventService } from '../services/eventService';
import { geocodingService } from '../services/geocodingService';
import type { Event } from '../types/event.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/eventService', () => ({
  eventService: {
    getEventById: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

vi.mock('../services/geocodingService', () => ({
  geocodingService: {
    searchAddress: vi.fn(),
  },
}));

vi.mock('../components/upload/ImageUpload', () => ({
  ImageUpload: ({
    onUploadSuccess,
  }: {
    onUploadSuccess: (url: string, publicId: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onUploadSuccess('https://cdn.example.com/img.png', 'pub1')}
    >
      Uploader une image
    </button>
  ),
}));

function byId(container: HTMLElement, id: string): HTMLInputElement {
  const el = container.querySelector(`#${id}`);
  if (!el) throw new Error(`No element with id ${id}`);
  return el as HTMLInputElement;
}

function makeProfessionalEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    description: 'Un super concert',
    location: 'Salle Pleyel',
    address: '10 Rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    latitude: 48.85,
    longitude: 2.35,
    imageUrl: '',
    eventDate: '2099-06-01T20:00:00.000Z',
    endDate: '2099-06-01T23:00:00.000Z',
    organizerId: 'organizer-1',
    type: 'PROFESSIONAL',
    ticketCategories: [
      {
        id: 'cat1',
        name: 'Standard',
        price: 20,
        initialStock: 100,
        currentStock: 90,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCommunityEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e2',
    title: 'Pique-nique du quartier',
    location: 'Parc',
    address: '1 Avenue des Fleurs',
    city: 'Lyon',
    postalCode: '69000',
    country: 'France',
    latitude: 45.75,
    longitude: 4.85,
    imageUrl: '',
    eventDate: '2099-07-01T12:00:00.000Z',
    endDate: null,
    organizerId: 'organizer-1',
    type: 'COMMUNITY',
    ticketCategories: [
      {
        id: 'cat2',
        name: 'Participation',
        price: 0.5,
        initialStock: 20,
        currentStock: 15,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(geocodingService.searchAddress).mockResolvedValue([]);
});

function renderPage(eventId = 'e1') {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}/edit`]}>
      <Routes>
        <Route path="/events/:id/edit" element={<EventEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventEditPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(eventService.getEventById).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the backend error message and a link back to the dashboard on failure', async () => {
    vi.mocked(eventService.getEventById).mockRejectedValue({
      response: { data: { message: 'Événement introuvable' } },
    });

    renderPage();

    expect(await screen.findByText('Événement introuvable')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Retour au tableau de bord' }),
    ).toHaveAttribute('href', '/dashboard/organizer');
  });

  it('shows a default error message on a plain error', async () => {
    vi.mocked(eventService.getEventById).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText("Erreur lors du chargement de l'événement"),
    ).toBeInTheDocument();
  });
});

describe('EventEditPage - professional event', () => {
  it('prefills the form fields from the loaded event', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();

    await screen.findByRole('heading', { name: "Modifier l'événement" });
    expect(byId(container, 'event-title').value).toBe('Concert de jazz');
    expect(byId(container, 'event-city').value).toBe('Paris');
    expect(byId(container, 'event-postal-code').value).toBe('75001');
    expect(screen.getByText('Catégories de billets')).toBeInTheDocument();
    expect(byId(container, 'cat-name-0').value).toBe('Standard');
  });

  it('requires a title', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-title'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByText('Le titre est obligatoire')).toBeInTheDocument();
    expect(eventService.updateEvent).not.toHaveBeenCalled();
  });

  it('requires an end date for a professional event', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-end-date'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText(
        'La date et heure de fin sont obligatoires pour un événement professionnel',
      ),
    ).toBeInTheDocument();
  });

  it('rejects an end date before the start date', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-end-date'), {
      target: { value: '2099-05-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText('La date de fin doit être postérieure à la date de début'),
    ).toBeInTheDocument();
  });

  it('submits the updated event with the existing categories', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());
    vi.mocked(eventService.updateEvent).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-title'), { target: { value: 'Concert de rock' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(eventService.updateEvent).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({
          title: 'Concert de rock',
          ticket_categories: [
            expect.objectContaining({ name: 'Standard', price: 20, initial_stock: 100 }),
          ],
        }),
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('adds and removes ticket categories', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une catégorie de billets' }));
    expect(byId(container, 'cat-name-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la catégorie 2' }));
    expect(container.querySelector('#cat-name-1')).not.toBeInTheDocument();
  });

  it('shows an error when no category remains valid', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText(/Ajoutez au moins une catégorie de billets/),
    ).toBeInTheDocument();
  });

  it('re-geocodes the address on submit when it was changed and no suggestion was selected', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([
      {
        label: '5 Rue de la Paix 75002 Paris',
        name: '5 Rue de la Paix',
        city: 'Paris',
        postcode: '75002',
        context: 'Île-de-France',
        coordinates: { lat: 48.87, lon: 2.33 },
      },
    ]);
    vi.mocked(eventService.updateEvent).mockResolvedValue(makeProfessionalEvent());

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-address'), {
      target: { value: '5 Rue de la Paix' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(eventService.updateEvent).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({ latitude: 48.87, longitude: 2.33 }),
      ),
    );
  });

  it('shows an error when the address cannot be geocoded', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([]);

    const { container } = renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-address'), {
      target: { value: 'Adresse introuvable' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText(/Impossible de localiser cette adresse automatiquement/),
    ).toBeInTheDocument();
    expect(eventService.updateEvent).not.toHaveBeenCalled();
  });

  it('shows the backend error message when saving fails', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());
    const err = Object.assign(new Error('Conflict'), {
      response: { data: { message: 'Conflit de version' } },
    });
    vi.mocked(eventService.updateEvent).mockRejectedValue(err);

    renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByText('Conflit de version')).toBeInTheDocument();
  });

  it('uploads a new cover image', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());
    vi.mocked(eventService.updateEvent).mockResolvedValue(makeProfessionalEvent());

    renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.click(screen.getByRole('button', { name: 'Uploader une image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(eventService.updateEvent).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({
          image_url: 'https://cdn.example.com/img.png',
          image_public_id: 'pub1',
        }),
      ),
    );
  });

  it('cancels and navigates back', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeProfessionalEvent());

    renderPage();
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

describe('EventEditPage - community event', () => {
  it('shows the places field instead of ticket categories', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeCommunityEvent());

    const { container } = renderPage('e2');

    await screen.findByRole('heading', { name: "Modifier l'événement" });
    expect(byId(container, 'event-places').value).toBe('20');
    expect(screen.getByText('Places déjà réservées : 5')).toBeInTheDocument();
    expect(screen.queryByText('Catégories de billets')).not.toBeInTheDocument();
  });

  it('rejects a place count below already-sold places', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeCommunityEvent());

    const { container } = renderPage('e2');
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-places'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText(/ne peut pas être inférieur aux places déjà réservées \(5\)/),
    ).toBeInTheDocument();
  });

  it('submits the updated community event with a single Participation category', async () => {
    vi.mocked(eventService.getEventById).mockResolvedValue(makeCommunityEvent());
    vi.mocked(eventService.updateEvent).mockResolvedValue(makeCommunityEvent());

    const { container } = renderPage('e2');
    await screen.findByRole('heading', { name: "Modifier l'événement" });
    fireEvent.change(byId(container, 'event-places'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(eventService.updateEvent).toHaveBeenCalledWith(
        'e2',
        expect.objectContaining({
          ticket_categories: [
            { name: 'Participation', price: 0.5, initial_stock: 30 },
          ],
        }),
      ),
    );
  });
});
