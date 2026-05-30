"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Check, Navigation, Layers } from 'lucide-react';
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
  const [tileLayer, setTileLayer] = useState<any>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  
  const [address, setAddress] = useState("Mencari alamat...");
  const [coords, setCoords] = useState({ lat: initialLat || -0.5940091, lng: initialLng || 100.2129566 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    
    if (map) {
      map.setView([newCoords.lat, newCoords.lng], 17);
    }
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || map || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;
    
    const newMap = L.map(mapRef.current, {
      zoomControl: false
    }).setView([coords.lat, coords.lng], 16);
    
    L.control.zoom({ position: 'bottomleft' }).addTo(newMap);
    
    const newTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20
    }).addTo(newMap);

    setMap(newMap);
    setTileLayer(newTileLayer);
    setIsMapLoaded(true);
    updateAddress(coords.lat, coords.lng);

    newMap.on('dragstart', () => {
      setIsDragging(true);
    });

    newMap.on('moveend', () => {
      setIsDragging(false);
      const center = newMap.getCenter();
      const newCoords = { lat: center.lat, lng: center.lng };
      setCoords(newCoords);
      updateAddress(newCoords.lat, newCoords.lng);
    });

    setTimeout(() => {
      newMap.invalidateSize();
    }, 200);
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

  const toggleMapType = () => {
    if (!map || !tileLayer) return;
    
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    const url = newType === 'roadmap' 
      ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' 
      : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    
    tileLayer.setUrl(url);
    setMapType(newType);
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setAddress("Mendapatkan lokasi saat ini...");
      navigator.geolocation.getCurrentPosition((pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        if (map) {
          map.setView([newCoords.lat, newCoords.lng], 17);
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
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .leaflet-container { width: 100%; height: 100%; z-index: 10; font-family: inherit; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important; border-radius: 12px !important; overflow: hidden; margin-bottom: 20px !important; margin-left: 12px !important; }
        .leaflet-control-zoom a { color: #334155 !important; background-color: white !important; width: 36px !important; height: 36px !important; line-height: 36px !important; }
        .leaflet-control-zoom a:hover { color: #e11d48 !important; background-color: #fff1f2 !important; }
      `}</style>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="lazyOnload" />
      
      <div className="flex flex-col w-full h-full overflow-hidden bg-slate-100">
        <div className="relative flex-1 w-full min-h-[300px] flex flex-col">
          {/* Search Overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1000]">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi atau nama tempat..."
                className="w-full bg-white border-none rounded-2xl px-5 py-3.5 pr-12 text-[14px] shadow-[0_6px_20px_rgb(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium text-slate-800"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                disabled={isSearching}
              >
                {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-rose-500 rounded-full border-t-transparent"></div> : <Search size={18} />}
              </button>
            </form>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 max-h-48 overflow-y-auto overflow-x-hidden">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-5 py-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors focus:bg-slate-50 focus:outline-none"
                  >
                    <p className="font-semibold text-slate-800 truncate text-[13px] mb-0.5">{result.name || result.display_name.split(',')[0]}</p>
                    <p className="text-[11px] text-slate-500 truncate">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Map Container */}
          <div className="relative w-full flex-1 z-[10]">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Center Fixed Marker */}
            {isMapLoaded && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] z-[1000] pointer-events-none flex flex-col items-center">
                
                {/* Tooltip Overlay */}
                <div className="mb-2 whitespace-nowrap bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-medium shadow-lg transition-opacity duration-300">
                  Geser peta untuk akurasi
                </div>

                {/* Marker Pin */}
                <div className={`relative transition-transform duration-200 ${isDragging ? '-translate-y-2 scale-110' : 'translate-y-0 scale-100'}`}>
                  <div className="flex items-center justify-center w-10 h-10 bg-rose-600 rounded-[50%_50%_50%_0] border-4 border-white shadow-[0_6px_16px_rgba(225,29,72,0.4)] -rotate-45">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                </div>
                {/* Marker Shadow */}
                <div className={`w-3 h-1.5 bg-black/20 rounded-full mt-1 blur-[1px] transition-all duration-200 ${isDragging ? 'scale-75 opacity-50' : 'scale-100 opacity-100'}`}></div>
              </div>
            )}
          </div>
          
          {!isMapLoaded && (
            <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-rose-500 mb-4"></div>
              <p className="text-slate-600 text-sm font-semibold">Memuat Peta...</p>
            </div>
          )}
          
          {/* Action Buttons on Map */}
          <div className="absolute bottom-6 right-3 z-[1000] flex flex-col gap-2">
            <button 
              onClick={toggleMapType}
              className="bg-white p-3 rounded-xl shadow-[0_4px_15px_rgb(0,0,0,0.15)] hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-all border border-slate-100 group"
              title="Ganti Tampilan Peta"
            >
              <Layers size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={useCurrentLocation}
              className="bg-white p-3 rounded-xl shadow-[0_4px_15px_rgb(0,0,0,0.15)] hover:bg-slate-50 text-slate-700 hover:text-rose-600 transition-all border border-slate-100 group"
              title="Gunakan Lokasi Saya"
            >
              <Navigation size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full p-4 sm:p-5 bg-white space-y-4 z-[20] border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-3xl relative shrink-0">
          <div className="flex items-start gap-3 w-full">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-rose-600 border border-rose-100">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Lokasi Pengiriman
              </p>
              <p className="text-[13px] sm:text-[14px] text-slate-800 font-semibold leading-relaxed truncate whitespace-normal line-clamp-2">
                {isDragging ? "Menyesuaikan titik..." : address}
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:gap-3 pt-1">
            <button 
              onClick={onCancel}
              className="flex-[0.35] min-w-[80px] px-2 py-3 sm:py-3.5 rounded-xl text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all focus:ring-4 focus:ring-slate-100 focus:outline-none text-center"
            >
              Batal
            </button>
            <button 
              onClick={() => onConfirm(address, coords.lat, coords.lng)}
              disabled={isDragging}
              className={`flex-[0.65] min-w-[150px] px-2 py-3 sm:py-3.5 rounded-xl text-[14px] font-bold text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                isDragging 
                  ? 'bg-rose-400 cursor-not-allowed shadow-none' 
                  : 'bg-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.3)] hover:bg-rose-700 hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 focus:ring-4 focus:ring-rose-200'
              }`}
            >
              <Check size={18} strokeWidth={2.5} /> Konfirmasi Lokasi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
