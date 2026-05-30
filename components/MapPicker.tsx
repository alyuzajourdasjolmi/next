"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Check, X, Navigation } from 'lucide-react';

interface MapPickerProps {
  onConfirm: (address: string, lat: number, lng: number) => void;
  onCancel: () => void;
  initialLat?: number;
  initialLng?: number;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapPicker({ onConfirm, onCancel, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [address, setAddress] = useState("Mencari alamat...");
  const [coords, setCoords] = useState({ lat: initialLat || -0.5940091, lng: initialLng || 100.2129566 });
  const [isGmapsLoaded, setIsGmapsLoaded] = useState(false);

  useEffect(() => {
    const checkGmaps = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsGmapsLoaded(true);
        clearInterval(checkGmaps);
      }
    }, 500);
    return () => clearInterval(checkGmaps);
  }, []);

  useEffect(() => {
    if (!isGmapsLoaded || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: coords,
      zoom: 15,
      disableDefaultUI: false,
      mapTypeControl: false,
    });

    const newMarker = new window.google.maps.Marker({
      position: coords,
      map: newMap,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    setMap(newMap);
    setMarker(newMarker);

    // Reverse geocode initial position
    updateAddress(coords.lat, coords.lng);

    // Handle marker drag end
    newMarker.addListener('dragend', () => {
      const pos = newMarker.getPosition();
      const newCoords = { lat: pos.lat(), lng: pos.lng() };
      setCoords(newCoords);
      updateAddress(newCoords.lat, newCoords.lng);
    });

    // Handle map click
    newMap.addListener('click', (e: any) => {
      const newPos = e.latLng;
      newMarker.setPosition(newPos);
      const newCoords = { lat: newPos.lat(), lng: newPos.lng() };
      setCoords(newCoords);
      updateAddress(newCoords.lat, newCoords.lng);
    });

    // Setup Search Box
    if (searchInputRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
      newMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchInputRef.current);

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        const newPos = place.geometry.location;
        newMap.setCenter(newPos);
        newMarker.setPosition(newPos);
        const newCoords = { lat: newPos.lat(), lng: newPos.lng() };
        setCoords(newCoords);
        updateAddress(newCoords.lat, newCoords.lng);
      });
    }

  }, [isGmapsLoaded]);

  const updateAddress = (lat: number, lng: number) => {
    setAddress("Mencari alamat...");
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        if (map && marker) {
          map.setCenter(newCoords);
          marker.setPosition(newCoords);
          updateAddress(newCoords.lat, newCoords.lng);
        }
      });
    }
  };

  if (!isGmapsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-gray-100 rounded-2xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mb-4"></div>
        <p className="text-gray-500 text-sm">Memuat Peta Google...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="relative flex-1">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Cari lokasi atau jalan..."
          className="absolute top-4 left-4 right-4 z-10 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          style={{ width: 'calc(100% - 32px)', marginTop: '10px' }}
        />
        <div ref={mapRef} className="w-full h-[400px] rounded-2xl border border-gray-200" />
        
        <button 
          onClick={useCurrentLocation}
          className="absolute bottom-4 right-4 z-10 bg-white p-3 rounded-full shadow-xl hover:bg-gray-50 text-rose-500 transition-all border border-gray-100"
          title="Gunakan Lokasi Saya"
        >
          <Navigation size={20} />
        </button>
      </div>

      <div className="p-5 bg-white border-t border-gray-100 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
            <MapPin className="text-rose-500" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Alamat Terpilih</p>
            <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2">{address}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={() => onConfirm(address, coords.lat, coords.lng)}
            className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} /> Konfirmasi Lokasi
          </button>
        </div>
      </div>
    </div>
  );
}
