"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/cart-context';

type Props = {
  product: any;
  onOpenDetail: (product: any) => void;
  compact?: boolean;
};

export default function ProductCard({ product, onOpenDetail, compact }: Props) {
  const { addToCart } = useCart();
  const isOutOfStock = (product.stock || 0) <= 0;
  const isLowStock = (product.stock || 0) > 0 && (product.stock || 0) <= 5;

  return (
    <motion.article
      className={`product-card ${compact ? 'compact' : ''}`}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
        {isOutOfStock && <span className="product-badge out">Habis</span>}
        {!isOutOfStock && isLowStock && (
          <span className="product-badge low">Stok Terbatas</span>
        )}
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
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">Rp {product.price.toLocaleString('id-ID')}</div>
        <div className="product-stock-hint">
          {isOutOfStock ? 'Stok habis' : `Stok: ${product.stock || 0}`}
        </div>
      </div>
    </motion.article>
  );
}
