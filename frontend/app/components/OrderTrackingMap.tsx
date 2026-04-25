'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Leaflet with Webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ShipperIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Delivery motorcycle icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const DestinationIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275214.png', // House/Home icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

// Component to auto-center map when trackings change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function OrderTrackingMap({ trackings, destination }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl" />;

  const latestTracking = trackings.length > 0 ? trackings[0] : null;
  
  // Default to Vietnam's center if no data
  const center: [number, number] = latestTracking?.latitude 
    ? [latestTracking.latitude, latestTracking.longitude] 
    : destination?.lat 
      ? [destination.lat, destination.lng] 
      : [10.762622, 106.660172];

  const statusMap: Record<string, string> = {
    'picked_up': 'Đã lấy hàng',
    'in_transit': 'Đang trung chuyển',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao thành công',
    'failed': 'Giao hàng thất bại'
  };

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
      <MapContainer center={center} zoom={15} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DestinationIcon}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-gray-800">Điểm giao hàng</p>
                <p className="text-xs text-gray-500">{destination.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Latest Shipper Location */}
        {latestTracking && (
          <Marker position={[latestTracking.latitude, latestTracking.longitude]} icon={ShipperIcon}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-blue-600">{statusMap[latestTracking.status] || latestTracking.status}</p>
                <p className="text-xs text-gray-600">{latestTracking.location_text}</p>
                <p className="text-[10px] text-gray-400 mt-1">Cập nhật: {new Date(latestTracking.created_at).toLocaleString('vi-VN')}</p>
              </div>
            </Popup>
          </Marker>
        )}

        <ChangeView center={center} />
      </MapContainer>
    </div>
  );
}
