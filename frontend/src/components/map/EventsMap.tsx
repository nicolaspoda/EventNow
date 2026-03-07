import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event } from '../../types/event.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MAP_CONFIG } from '../../config/map.config';

interface UserPosition {
  lat: number;
  lon: number;
}

interface EventsMapProps {
  events: Event[];
  userPosition?: UserPosition | null;
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

function MapBoundsUpdater({
  events,
  userPosition,
}: {
  events: Event[];
  userPosition?: UserPosition | null;
}) {
  const map = useMap();

  useEffect(() => {
    const eventsWithCoords = events.filter(
      (event) => event.latitude != null && event.longitude != null,
    );

    const positions: [number, number][] = eventsWithCoords.map((event) => [
      event.latitude!,
      event.longitude!,
    ]);
    if (userPosition) {
      positions.push([userPosition.lat, userPosition.lon]);
    }

    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], MAP_CONFIG.defaultZoom + 7);
    } else {
      const bounds = new LatLngBounds(positions);
      map.fitBounds(bounds, { padding: MAP_CONFIG.bounds.padding });
    }
  }, [events, userPosition, map]);

  return null;
}

export function EventsMap({ events, userPosition, onEventClick, className = '' }: EventsMapProps) {
  const eventsWithCoords = events.filter(
    (event) => event.latitude != null && event.longitude != null,
  );

  const defaultCenter: [number, number] = [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng];
  const defaultZoom = MAP_CONFIG.defaultZoom;

  if (eventsWithCoords.length === 0 && !userPosition) {
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
        
        <MapBoundsUpdater events={eventsWithCoords} userPosition={userPosition} />

        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lon]}
            radius={10}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Ma position</span>
            </Popup>
          </CircleMarker>
        )}

        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude!, event.longitude!]}
            icon={defaultIcon}
          >
            <Popup className="events-map-popup">
              <div className="min-w-[280px] max-w-[320px]">
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-36 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100 mb-3 leading-tight">
                  {event.title}
                </h3>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">📅</span>
                    {format(new Date(event.eventDate), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">📍</span>
                    {event.city || event.location}
                  </p>
                  {event.distance != null && (
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center gap-2">
                      <span aria-hidden="true">↔</span>
                      À {event.distance} km de vous
                    </p>
                  )}
                  {event.ticketCategories && event.ticketCategories.length > 0 && (
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      À partir de {Math.min(...event.ticketCategories.map((c) => Number(c.price)))}€
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onEventClick?.(event.id)}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
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
