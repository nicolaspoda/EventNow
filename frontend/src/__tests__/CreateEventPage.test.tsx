import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateEventPage } from '../pages/CreateEventPage';
import { useAuth } from '../utils/useAuth';
import { eventService } from '../services/eventService';
import { geocodingService } from '../services/geocodingService';
import type { Event } from '../types/event.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/eventService', () => ({
  eventService: {
    createEvent: vi.fn(),
  },
}));

vi.mock('../services/geocodingService', () => ({
  geocodingService: {
    searchAddress: vi.fn(),
  },
}));

vi.mock('../components/upload/ImageUpload', () => ({
  ImageUpload: ({ onUploadSuccess }: { onUploadSuccess: (url: string, id: string) => void }) => (
    <button
      type="button"
      onClick={() => onUploadSuccess('https://cdn.example.com/img.png', 'pub1')}
    >
      Uploader une image
    </button>
  ),
}));

function mockAuthRole(role: 'USER' | 'ORGANIZER') {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'me', username: 'me', email: 'me@example.com', role },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(geocodingService.searchAddress).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateEventPage />
    </MemoryRouter>,
  );
}

function byId(container: HTMLElement, id: string): HTMLInputElement {
  const el = container.querySelector(`#${id}`);
  if (!el) throw new Error(`No element with id ${id}`);
  return el as HTMLInputElement;
}

function fillCommonFields(container: HTMLElement, { endDate = '2026-07-01T22:00' }: { endDate?: string } = {}) {
  fireEvent.change(byId(container, 'event-title'), { target: { value: 'Concert de jazz' } });
  fireEvent.change(byId(container, 'event-address'), { target: { value: '10 Rue de Rivoli' } });
  fireEvent.change(byId(container, 'event-city'), { target: { value: 'Paris' } });
  fireEvent.change(byId(container, 'event-postal-code'), { target: { value: '75001' } });
  fireEvent.change(byId(container, 'event-date'), { target: { value: '2026-07-01T20:00' } });
  if (endDate) {
    fireEvent.change(byId(container, 'event-end-date'), { target: { value: endDate } });
  }
}

describe('CreateEventPage - rendering by role', () => {
  it('shows ticket-category fields for an organizer', () => {
    mockAuthRole('ORGANIZER');
    const { container } = renderPage();

    expect(screen.getByText('Catégories de billets')).toBeInTheDocument();
    expect(container.querySelector('#event-places')).not.toBeInTheDocument();
  });

  it('shows a places field instead of categories for a community (USER) organizer', () => {
    mockAuthRole('USER');
    const { container } = renderPage();

    expect(container.querySelector('#event-places')).toBeInTheDocument();
    expect(screen.queryByText('Catégories de billets')).not.toBeInTheDocument();
  });
});

describe('CreateEventPage - client-side validation', () => {
  it('requires a title', () => {
    mockAuthRole('ORGANIZER');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(screen.getByText('Le titre est obligatoire')).toBeInTheDocument();
    expect(eventService.createEvent).not.toHaveBeenCalled();
  });

  it('requires an end date for a professional event', () => {
    mockAuthRole('ORGANIZER');
    const { container } = renderPage();

    fillCommonFields(container, { endDate: '' });
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(
      screen.getByText('La date et heure de fin sont obligatoires pour un événement professionnel'),
    ).toBeInTheDocument();
  });

  it('rejects an end date earlier than the start date', () => {
    mockAuthRole('ORGANIZER');
    const { container } = renderPage();

    fillCommonFields(container, { endDate: '2026-07-01T19:00' });
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(
      screen.getByText('La date de fin doit être postérieure à la date de début'),
    ).toBeInTheDocument();
  });

  it('requires at least one valid ticket category for a professional event', () => {
    mockAuthRole('ORGANIZER');
    const { container } = renderPage();

    fillCommonFields(container);
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(screen.getByText(/Ajoutez au moins une catégorie de billets/)).toBeInTheDocument();
  });

  it('requires at least 1 place for a community event', () => {
    mockAuthRole('USER');
    const { container } = renderPage();

    fillCommonFields(container, { endDate: '' });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(screen.getByText('Indiquez le nombre de places (au moins 1)')).toBeInTheDocument();
  });
});

describe('CreateEventPage - ticket categories management', () => {
  it('adds and removes ticket categories', () => {
    mockAuthRole('ORGANIZER');
    renderPage();

    expect(screen.getByText('Catégorie 1')).toBeInTheDocument();
    expect(screen.queryByText('Catégorie 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une catégorie de billets' }));
    expect(screen.getByText('Catégorie 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la catégorie 2' }));
    expect(screen.queryByText('Catégorie 2')).not.toBeInTheDocument();
  });

  it('does not allow removing the last remaining category', () => {
    mockAuthRole('ORGANIZER');
    renderPage();

    expect(screen.queryByRole('button', { name: /Supprimer la catégorie/ })).not.toBeInTheDocument();
  });
});

describe('CreateEventPage - submission', () => {
  const createdEvent: Event = {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris, 75001',
    eventDate: '2026-07-01T20:00:00.000Z',
    organizerId: 'me',
    ticketCategories: [],
    createdAt: '',
    updatedAt: '',
  };

  it('auto-geocodes the address on submit when no suggestion was selected, then creates the event', async () => {
    mockAuthRole('ORGANIZER');
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([
      {
        label: '10 Rue de Rivoli 75001 Paris',
        name: '10 Rue de Rivoli',
        city: 'Paris',
        postcode: '75001',
        context: 'Paris',
        coordinates: { lat: 48.85, lon: 2.35 },
      },
    ]);
    vi.mocked(eventService.createEvent).mockResolvedValue(createdEvent);

    const { container } = renderPage();
    fillCommonFields(container);
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    await waitFor(() => expect(eventService.createEvent).toHaveBeenCalled());
    const payload = vi.mocked(eventService.createEvent).mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Concert de jazz',
      type: 'PROFESSIONAL',
      latitude: 48.85,
      longitude: 2.35,
      ticket_categories: [{ name: 'Standard', price: 20, initial_stock: 50 }],
    });
    expect(mockNavigate).toHaveBeenCalledWith('/events/e1', { replace: true });
  });

  it('shows an error when the address cannot be geocoded', async () => {
    mockAuthRole('ORGANIZER');
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([]);

    const { container } = renderPage();
    fillCommonFields(container);
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(
      await screen.findByText(/Impossible de localiser cette adresse automatiquement/),
    ).toBeInTheDocument();
    expect(eventService.createEvent).not.toHaveBeenCalled();
  });

  it('shows the backend error message when creation fails', async () => {
    mockAuthRole('ORGANIZER');
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([
      {
        label: 'x', name: '10 Rue de Rivoli', city: 'Paris', postcode: '75001', context: '',
        coordinates: { lat: 48.85, lon: 2.35 },
      },
    ]);
    vi.mocked(eventService.createEvent).mockRejectedValue({
      response: { data: { message: 'Événement déjà existant' } },
    });

    const { container } = renderPage();
    fillCommonFields(container);
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    expect(await screen.findByText('Événement déjà existant')).toBeInTheDocument();
  });

  it('creates a community event with a single "Participation" category', async () => {
    mockAuthRole('USER');
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([
      {
        label: 'x', name: '10 Rue de Rivoli', city: 'Paris', postcode: '75001', context: '',
        coordinates: { lat: 48.85, lon: 2.35 },
      },
    ]);
    vi.mocked(eventService.createEvent).mockResolvedValue({ ...createdEvent, id: 'e2' });

    const { container } = renderPage();
    fillCommonFields(container, { endDate: '' });
    fireEvent.change(byId(container, 'event-places'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    await waitFor(() => expect(eventService.createEvent).toHaveBeenCalled());
    const payload = vi.mocked(eventService.createEvent).mock.calls[0][0];
    expect(payload).toMatchObject({
      type: 'COMMUNITY',
      ticket_categories: [{ name: 'Participation', price: 0.5, initial_stock: 30 }],
    });
    expect(mockNavigate).toHaveBeenCalledWith('/events/e2', { replace: true });
  });

  it('sets the uploaded image url/publicId on the payload', async () => {
    mockAuthRole('ORGANIZER');
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([
      {
        label: 'x', name: '10 Rue de Rivoli', city: 'Paris', postcode: '75001', context: '',
        coordinates: { lat: 48.85, lon: 2.35 },
      },
    ]);
    vi.mocked(eventService.createEvent).mockResolvedValue(createdEvent);

    const { container } = renderPage();
    fillCommonFields(container);
    fireEvent.change(byId(container, 'cat-name-0'), { target: { value: 'Standard' } });
    fireEvent.change(byId(container, 'cat-price-0'), { target: { value: '20' } });
    fireEvent.change(byId(container, 'cat-stock-0'), { target: { value: '50' } });
    fireEvent.click(screen.getByText('Uploader une image'));
    fireEvent.click(screen.getByRole('button', { name: /Créer l'événement/ }));

    await waitFor(() =>
      expect(eventService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://cdn.example.com/img.png',
          image_public_id: 'pub1',
        }),
      ),
    );
  });
});
