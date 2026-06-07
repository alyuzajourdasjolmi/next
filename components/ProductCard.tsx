"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, ShoppingBag, Star, Flame } from 'lucide-react';
import { useCart } from '../lib/cart-context';

type Props = {
  product: any;
  onOpenDetail: (product: any) => void;
  compact?: boolean;
};

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  frozen: { label: 'Frozen', icon: '🧊' },
  atk: { label: 'ATK', icon: '📝' },
  other: { label: 'Lainnya', icon: '📦' },
};

export default function ProductCard({ product, onOpenDetail, compact }: Props) {
  const { addToCart } = useCart();
  const isOutOfStock = (product.stock || 0) <= 0;
  const isLowStock = (product.stock || 0) > 0 && (product.stock || 0) <= 5;
  const isBestSeller = (product.sold_count || 0) >= 20;
  const cat = CATEGORY_MAP[product.category] || { label: product.category, icon: '📦' };

  return (
    <motion.article
      className={`product-card ${compact ? 'compact' : ''}`}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
    >
      <div
        className="product-img-wrap"
        onClick={() => onOpenDetail(product)}
        style={{ cursor: 'pointer' }}
      >
        {product.img ? (
          <Image
            src={product.img}
            alt={product.name}
            width={400}
            height={300}
            className="product-img"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="product-img-placeholder">
            <ShoppingBag size={32} strokeWidth={1.4} />
          </div>
        )}

        <div className="product-badges">
          {isOutOfStock && <span className="product-badge out">Habis</span>}
          {!isOutOfStock && isLowStock && (
            <span className="product-badge low">Stok Terbatas</span>
          )}
          {isBestSeller && !isOutOfStock && (
            <span className="product-badge best">
              <Star size={10} fill="currentColor" /> Best Seller
            </span>
          )}
          <span className="product-cat-tag">{cat.icon} {cat.label}</span>
        </div>

        <button
          className="product-quick-add"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          disabled={isOutOfStock}
          aria-label="Tambah ke keranjang"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="product-info" onClick={() => onOpenDetail(product)} style={{ cursor: 'pointer' }}>
        <div className="product-meta-row">
          <div className="product-rating">
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
            <span>4.8</span>
          </div>
          {product.sold_count > 0 && (
            <div className="product-sold">
              <Flame size={11} />
              <span>{product.sold_count}+ terjual</span>
            </div>
          )}
        </div>

        <h3 className="product-name">{product.name}</h3>

        <div className="product-price">Rp {product.price.toLocaleString('id-ID')}</div>

        <div className="product-footer">
          <div className={`product-stock-indicator ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'ok'}`}>
            <span className="stock-dot" />
            <span>{isOutOfStock ? 'Stok habis' : `${product.stock} tersedia`}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
