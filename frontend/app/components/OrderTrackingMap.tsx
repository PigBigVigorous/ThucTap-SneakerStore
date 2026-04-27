'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';

// --- Custom Icons using SVG ---
const ShipperIcon = L.divIcon({
  html: `<div class="relative">
          <div class="absolute -top-10 -left-5 bg-orange-600 text-white p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M21 16c0 1.1-.9 2-2 2h-1c0 1.66-1.34 3-3 3s-3-1.34-3-3h-4c0 1.66-1.34 3-3 3s-3-1.34-3-3H2c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2h3l3 3v3zM5 18c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm10 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zM14 8H2v7h12V8zm4 5h-2v2h2.17l-1.17-2z"/>
            </svg>
          </div>
        </div>`,
  className: '',
  iconSize: [0, 0],
});

const DestinationIcon = L.divIcon({
  html: `<div class="relative">
          <div class="absolute -top-10 -left-5 bg-blue-700 text-white p-2 rounded-full shadow-lg border-2 border-white">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        </div>`,
  className: '',
  iconSize: [0, 0],
});

// Component to handle Map Bounds and View
function MapController({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [points, map]);
  return null;
}

type TrackingPoint = {
  id: number;
  status: string;
  latitude: number;
  longitude: number;
  location_text: string;
  created_at: string;
};

type MapProps = {
  trackings: TrackingPoint[];
  destination?: { lat: number; lng: number; address: string };
};

export default function OrderTrackingMap({ trackings, destination }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lọc và format các điểm tọa độ để vẽ Polyline
  const routePoints = useMemo(() => {
    return trackings
      .filter(t => t.latitude && t.longitude)
      .map(t => [Number(t.latitude), Number(t.longitude)] as [number, number])
      .reverse(); // Đảo ngược để vẽ từ điểm cũ đến điểm mới
  }, [trackings]);

  // Tất cả các điểm quan trọng để căn chỉnh khung hình (Shipper + Khách hàng)
  const allKeyPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (routePoints.length > 0) {
      pts.push(routePoints[routePoints.length - 1]); // Vị trí mới nhất của shipper
    }
    if (destination) {
      pts.push([destination.lat, destination.lng]);
    }
    return pts;
  }, [routePoints, destination]);

  if (!mounted) return <div className="h-96 w-full bg-gray-100 animate-pulse rounded-2xl" />;

  const statusMap: Record<string, string> = {
    'picked_up': 'Đã lấy hàng',
    'in_transit': 'Đang trung chuyển',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao thành công',
    'failed': 'Giao hàng thất bại'
  };

  const latestTracking = trackings.length > 0 ? trackings[0] : null;

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0">
      <MapContainer 
        center={allKeyPoints[0] || [10.762622, 106.660172]} 
        zoom={15} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Vẽ đường đi của Shipper */}
        {routePoints.length > 1 && (
          <Polyline 
            positions={routePoints} 
            color="#f97316" 
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}

        {/* Marker Điểm đích (Nhà khách) */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DestinationIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-black text-blue-800 text-sm">Điểm giao hàng</p>
                <p className="text-[11px] text-gray-500">{destination.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Shipper (Vị trí hiện tại) */}
        {latestTracking && latestTracking.latitude && (
          <Marker position={[latestTracking.latitude, latestTracking.longitude]} icon={ShipperIcon}>
            <Popup>
              <div className="p-1 min-w-[150px]">
                <p className="font-black text-orange-600 text-sm">
                  {statusMap[latestTracking.status] || latestTracking.status}
                </p>
                <p className="text-[11px] text-gray-600 font-bold">{latestTracking.location_text}</p>
                <p className="text-[10px] text-gray-400 mt-1 border-t pt-1">
                  Cập nhật: {new Date(latestTracking.created_at).toLocaleTimeString('vi-VN')}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController points={allKeyPoints} />
      </MapContainer>
    </div>
  );
}
