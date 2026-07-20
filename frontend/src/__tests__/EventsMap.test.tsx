import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventsMap } from '../components/map/EventsMap';
import type { Event } from '../types/event.types';

vi.mock('leaflet', () => ({
  Icon: vi.fn().mockImplementation(function () {
    return {};
  }),
  LatLngBounds: vi.fn().mockImplementation(function (positions: unknown) {
    return { positions };
  }),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  CircleMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="circle-marker">{children}</div>
  ),
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn() }),
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    city: 'Paris',
    eventDate: '2026-06-15T20:00:00.000Z',
    organizerId: 'org1',
    ticketCategories: [{ id: 'c1', name: 'Standard', price: 20, initialStock: 100, currentStock: 50 }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    latitude: 48.85,
    longitude: 2.35,
    ...overrides,
  };
}

describe('EventsMap', () => {
  it('shows an empty state when there are no located events and no user position', () => {
    render(<EventsMap events={[makeEvent({ latitude: undefined, longitude: undefined })]} />);

    expect(
      screen.getByText('Aucun événement avec localisation disponible'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('renders the map when there is a user position, even without located events', () => {
    render(
      <EventsMap
        events={[makeEvent({ latitude: undefined, longitude: undefined })]}
        userPosition={{ lat: 48.85, lon: 2.35 }}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
  });

  it('renders a marker only for events with valid coordinates', () => {
    render(
      <EventsMap
        events={[
          makeEvent({ id: 'e1', latitude: 48.85, longitude: 2.35 }),
          makeEvent({ id: 'e2', latitude: undefined, longitude: undefined }),
        ]}
      />,
    );

    expect(screen.getAllByTestId('marker')).toHaveLength(1);
  });

  it('shows the event title, formatted date and price in the popup', () => {
    render(<EventsMap events={[makeEvent()]} />);

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText('À partir de 20€')).toBeInTheDocument();
  });

  it('shows the distance when provided', () => {
    render(<EventsMap events={[makeEvent({ distance: 3.2 })]} />);

    expect(screen.getByText('À 3.2 km de vous')).toBeInTheDocument();
  });

  it('does not show a price for community events', () => {
    render(<EventsMap events={[makeEvent({ type: 'COMMUNITY' })]} />);

    expect(screen.queryByText(/À partir de/)).not.toBeInTheDocument();
  });

  it('calls onEventClick when the popup button is clicked', () => {
    const onEventClick = vi.fn();
    render(<EventsMap events={[makeEvent()]} onEventClick={onEventClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Voir les détails' }));

    expect(onEventClick).toHaveBeenCalledWith('e1');
  });

  it('applies a custom className to the empty state', () => {
    const { container } = render(
      <EventsMap events={[]} className="custom-class" />,
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
