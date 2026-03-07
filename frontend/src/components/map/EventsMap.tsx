import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event } from '../../types/event.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MAP_CONFIG } from '../../config/map.config';

interface EventsMapProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
  className?: string;
}

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: MAP_CONFIG.marker.iconSize,
  iconAnchor: MAP_CONFIG.marker.iconAnchor,
  popupAnchor: MAP_CONFIG.marker.popupAnchor,
  shadowSize: MAP_CONFIG.marker.shadowSize,
});

function MapBoundsUpdater({ events }: { events: Event[] }) {
  const map = useMap();

  useEffect(() => {
    const eventsWithCoords = events.filter(
      (event) => event.latitude != null && event.longitude != null,
    );

    if (eventsWithCoords.length === 0) return;

    if (eventsWithCoords.length === 1) {
      const event = eventsWithCoords[0];
      map.setView([event.latitude!, event.longitude!], MAP_CONFIG.defaultZoom + 7);
    } else {
      const bounds = new LatLngBounds(
        eventsWithCoords.map((event) => [event.latitude!, event.longitude!]),
      );
      map.fitBounds(bounds, { padding: MAP_CONFIG.bounds.padding });
    }
  }, [events, map]);

  return null;
}

export function EventsMap({ events, onEventClick, className = '' }: EventsMapProps) {
  const eventsWithCoords = events.filter(
    (event) => event.latitude != null && event.longitude != null,
  );

  const defaultCenter: [number, number] = [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng];
  const defaultZoom = MAP_CONFIG.defaultZoom;

  if (eventsWithCoords.length === 0) {
    return (
      <div className={`bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-neutral-600 dark:text-neutral-400">
          Aucun événement avec localisation disponible
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        minZoom={MAP_CONFIG.minZoom}
        className="h-full w-full rounded-xl"
        style={{ minHeight: '500px' }}
      >
        <TileLayer
          attribution={MAP_CONFIG.tileLayer.attribution}
          url={MAP_CONFIG.tileLayer.url}
        />
        
        <MapBoundsUpdater events={eventsWithCoords} />

        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude!, event.longitude!]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}
                <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                <p className="text-sm text-neutral-600 mb-1">
                  {format(new Date(event.eventDate), 'PPP', { locale: fr })}
                </p>
                <p className="text-sm text-neutral-600 mb-2">
                  📍 {event.city || event.location}
                </p>
                {event.ticketCategories && event.ticketCategories.length > 0 && (
                  <p className="text-sm font-semibold text-primary-600 mb-2">
                    À partir de {Math.min(...event.ticketCategories.map((c) => Number(c.price)))}€
                  </p>
                )}
                <button
                  onClick={() => onEventClick?.(event.id)}
                  className="w-full mt-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Voir les détails
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
