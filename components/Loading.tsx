"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <div className={`fb-spinner ${size === 'md' ? '' : size} ${className}`} />;
}

type LoadingStateProps = {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function LoadingState({ text = 'Memuat…', size = 'md', className = '' }: LoadingStateProps) {
  return (
    <div className={`fb-loading-state ${className}`}>
      <Spinner size={size} />
      <p>{text}</p>
    </div>
  );
}

type LoadingOverlayProps = {
  show: boolean;
  text?: string;
  children?: React.ReactNode;
  className?: string;
};

export function LoadingOverlay({ show, text, children, className = '' }: LoadingOverlayProps) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      {children}
      {show && (
        <div className="fb-loading-overlay">
          {text ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Spinner size="md" />
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>{text}</span>
            </div>
          ) : (
            <Spinner size="md" />
          )}
        </div>
      )}
    </div>
  );
}

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  rounded?: number | string;
};

export function Skeleton({ width = '100%', height = 16, className = '', style = {}, rounded }: SkeletonProps) {
  return (
    <div
      className={`fb-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        ...style,
      }}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  gap?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, gap = 8, className = '' }: SkeletonTextProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
          height={i === 0 ? 18 : 14}
        />
      ))}
    </div>
  );
}

type SkeletonCardProps = {
  className?: string;
  rows?: number;
};

export function SkeletonCard({ className = '', rows = 3 }: SkeletonCardProps) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <Skeleton width="40%" height={18} />
      <SkeletonText lines={rows} />
    </div>
  );
}

export function ButtonSpinner() {
  return <Loader2 size={16} className="spin" style={{ animation: 'fb-spin 0.8s linear infinite' }} />;
}
