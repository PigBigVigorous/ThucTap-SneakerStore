import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let msg = "Không thể lấy vị trí.";
        switch(err.code) {
          case err.PERMISSION_DENIED: msg = "Vui lòng cho phép quyền truy cập vị trí."; break;
          case err.POSITION_UNAVAILABLE: msg = "Thông tin vị trí không khả dụng."; break;
          case err.TIMEOUT: msg = "Hết thời gian yêu cầu vị trí."; break;
        }
        setError(msg);
        setLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  }, []);

  return { location, error, loading, fetchLocation };
};
