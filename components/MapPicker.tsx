"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Check, Navigation } from 'lucide-react';
import Script from 'next/script';

interface MapPickerProps {
  onConfirm: (address: string, lat: number, lng: number) => void;
  onCancel: () => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onConfirm, onCancel, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [address, setAddress] = useState("Mencari alamat...");
  const [coords, setCoords] = useState({ lat: initialLat || -0.5940091, lng: initialLng || 100.2129566 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const updateAddress = async (lat: number, lng: number) => {
    setAddress("Mencari alamat...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (err) {
      setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setCoords(newCoords);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery(result.name || result.display_name.split(',')[0]);
    
    if (map && marker) {
      map.setView([newCoords.lat, newCoords.lng], 16);
      marker.setLatLng([newCoords.lat, newCoords.lng]);
    }
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || map || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;
    
    const newMap = L.map(mapRef.current).setView([coords.lat, coords.lng], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    }).addTo(newMap);

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#e11d48;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.3);'></div>",
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const newMarker = L.marker([coords.lat, coords.lng], { 
      draggable: true,
      icon: customIcon
    }).addTo(newMap);

    setMap(newMap);
    setMarker(newMarker);
    setIsMapLoaded(true);
    updateAddress(coords.lat, coords.lng);

    newMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      const newCoords = { lat: pos.lat, lng: pos.lng };
      setCoords(newCoords);
      updateAddress(newCoords.lat, newCoords.lng);
    });

    newMap.on('click', (e: any) => {
      const newPos = e.latlng;
      newMarker.setLatLng(newPos);
      const newCoords = { lat: newPos.lat, lng: newPos.lng };
      setCoords(newCoords);
      updateAddress(newCoords.lat, newCoords.lng);
    });

    // Fix map sizing issues in modal
    setTimeout(() => {
      newMap.invalidateSize();
    }, 100);
  }, [coords.lat, coords.lng, map]);

  useEffect(() => {
    const checkLeaflet = setInterval(() => {
      if ((window as any).L) {
        initMap();
        clearInterval(checkLeaflet);
      }
    }, 100);
    return () => clearInterval(checkLeaflet);
  }, [initMap]);

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setAddress("Mendapatkan lokasi saat ini...");
      navigator.geolocation.getCurrentPosition((pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        if (map && marker) {
          map.setView([newCoords.lat, newCoords.lng], 16);
          marker.setLatLng([newCoords.lat, newCoords.lng]);
          updateAddress(newCoords.lat, newCoords.lng);
        }
      }, () => {
        setAddress("Gagal mendapatkan lokasi. Pastikan izin GPS diberikan.");
      });
    } else {
       setAddress("Browser Anda tidak mendukung geolokasi.");
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="lazyOnload" />
      
      <div className="flex flex-col h-full overflow-hidden">
        <div className="relative flex-1 min-h-[400px] bg-slate-50">
          {/* Search Overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1000]">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi atau jalan..."
                className="w-full bg-white border-none rounded-xl px-4 py-3.5 pr-12 text-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium text-slate-700"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                disabled={isSearching}
              >
                {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-rose-500 rounded-full border-t-transparent"></div> : <Search size={18} />}
              </button>
            </form>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 max-h-56 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors focus:bg-slate-50 focus:outline-none"
                  >
                    <p className="font-semibold text-slate-800 truncate">{result.name || result.display_name.split(',')[0]}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Map Container */}
          <div ref={mapRef} className="w-full h-[400px] z-[10]" />
          
          {!isMapLoaded && (
            <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mb-4"></div>
              <p className="text-slate-500 text-sm font-medium">Memuat Peta...</p>
            </div>
          )}
          
          <button 
            onClick={useCurrentLocation}
            className="absolute bottom-6 right-4 z-[1000] bg-white p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-50 text-slate-700 hover:text-rose-500 transition-all border border-slate-100"
            title="Gunakan Lokasi Saya"
          >
            <Navigation size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 bg-white space-y-4 z-[20] border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-rose-500">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Alamat Terpilih</p>
              <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">{address}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              Batal
            </button>
            <button 
              onClick={() => onConfirm(address, coords.lat, coords.lng)}
              className="flex-1 px-4 py-3.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 hover:bg-rose-600 hover:shadow-rose-500/40 transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-rose-400 focus:outline-none transform hover:-translate-y-0.5"
            >
              <Check size={18} /> Konfirmasi Lokasi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
