'use client';

import { useState } from 'react';
import { Map, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

type AlertType = 'Trail' | 'LEO' | 'Citation';
type AlertStatus = 'Active' | 'Resolved';

interface Alert {
  id: string;
  type: AlertType;
  status?: AlertStatus;
  category: string;
  location: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  latitude: number;
  longitude: number;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'Trail',
    status: 'Active',
    category: 'Downed Tree',
    location: 'Eldridge Road Trail',
    description: 'Large oak tree blocking the main trail near mile marker 3.2',
    reportedBy: 'TrailMaintainer',
    reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    latitude: 38.0293,
    longitude: -122.6814
  },
  {
    id: '2',
    type: 'Trail',
    status: 'Active',
    category: 'Washout',
    location: 'Tamarancho Trail',
    description: 'Trail washed out after recent rains, impassable for bikes',
    reportedBy: 'WeatherWatcher',
    reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    latitude: 37.9735,
    longitude: -122.5467
  },
  {
    id: '3',
    type: 'LEO',
    category: 'Law Enforcement',
    location: 'Pine Ridge Parking',
    description: 'Increased patrol presence in parking areas',
    reportedBy: 'ParkRanger',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    latitude: 38.0522,
    longitude: -122.7258
  },
  {
    id: '4',
    type: 'Citation',
    category: 'Citation Issued',
    location: 'Bear Creek Trailhead',
    description: 'Vehicle cited for parking in no-parking zone',
    reportedBy: 'ParkOfficer',
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    latitude: 37.9441,
    longitude: -122.5658
  }
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function MHAZApp() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<AlertType[]>(['Trail', 'LEO', 'Citation']);
  
  const filteredAlerts = mockAlerts
    .filter(alert => selectedAlertTypes.includes(alert.type))
    .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  
  const toggleAlertType = (type: AlertType) => {
    setSelectedAlertTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Orange Header Bar */}
      <header className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">MHAZ</h1>
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-orange-600 rounded">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button className="p-1 hover:bg-orange-600 rounded">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Alert Type Toggles and View Toggle */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['Trail', 'LEO', 'Citation'] as AlertType[]).map((type) => {
              const count = mockAlerts.filter(alert => alert.type === type).length;
              const isSelected = selectedAlertTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleAlertType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? type === 'Trail'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : type === 'LEO'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {type === 'Trail' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      <path d="M19 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      <path d="M8.5 12.5l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M14.5 6.5l4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M12 6.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                      <rect x="11" y="8" width="2" height="6" rx="1"/>
                    </svg>
                  )}
                  {type === 'LEO' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  )}
                  {type === 'Citation' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  )}
                  {type} ({count})
                </button>
              );
            })}
          </div>
          
          {/* View Toggle - Show appropriate button based on current view */}
          {viewMode === 'map' ? (
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              Feed
            </button>
          ) : (
            <button
              onClick={() => setViewMode('map')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.01V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z"/>
              </svg>
              Map
            </button>
          )}
        </div>
      </div>

      {/* Content Area - Map or List */}
      {viewMode === 'map' ? (
        <div className="flex-1 relative">
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
            initialViewState={{
              longitude: -122.5814,
              latitude: 38.0293,
              zoom: 10
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
          >
            {filteredAlerts.map((alert) => (
              <Marker
                key={alert.id}
                longitude={alert.longitude}
                latitude={alert.latitude}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md ${
                  alert.type === 'Trail' 
                    ? 'bg-orange-500' 
                    : alert.type === 'LEO'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </Marker>
            ))}
          </Map>
        </div>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'Trail' 
                      ? 'bg-orange-100' 
                      : alert.type === 'LEO'
                      ? 'bg-blue-100'
                      : 'bg-red-100'
                  }`}>
                    {alert.type === 'Trail' && (
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M19 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M8.5 12.5l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M14.5 6.5l4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M12 6.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                        <rect x="11" y="8" width="2" height="6" rx="1"/>
                      </svg>
                    )}
                    {alert.type === 'LEO' && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    )}
                    {alert.type === 'Citation' && (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{alert.category}</h3>
                      {alert.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{getTimeAgo(alert.reportedAt)}</span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <h4 className="font-bold text-gray-700 text-sm">{alert.location}</h4>
              </div>
              
              <p className="text-gray-800 text-sm mb-3 overflow-hidden text-ellipsis" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>{alert.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by {alert.reportedBy}</span>
                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium flex items-center gap-1 text-xs px-2 py-1 rounded">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.01V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z"/>
                  </svg>
                  Show on Map
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-center">
          <button className="p-2 hover:bg-gray-100 rounded">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
