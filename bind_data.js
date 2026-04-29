const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace products grid
code = code.replace(/<div className="products-grid" id="productsGrid"><\/div>/g, 
  `<div className="products-grid" id="productsGrid">
    {productsData.filter((p: any) => activeTab === 'all' || p.category === activeTab).map((p: any, i: number) => (
      <div key={p.id} className="product-card fade-in visible" style={{ transitionDelay: \`\${i * 0.08}s\` }} data-category={p.category}>
        <span className={\`card-badge badge-\${p.category}\`}>
          {p.category === 'frozen' ? '🧊 Frozen Food' : p.category === 'atk' ? '📝 ATK' : '📦 Other'}
        </span>
        <div className="card-img-wrap"><img src={p.img} alt={p.name} className="card-img" loading="lazy" /></div>
        <div className="card-body">
          <h3>{p.name}</h3>
          <p className="desc">{p.desc}</p>
        </div>
        <div className="card-footer">
          <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
          <button type="button" className="btn-wa" onClick={() => addToCart(p.id)}>
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.606l4.584-1.47A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.332-.726-6.033-1.96l-.424-.316-2.727.874.892-2.654-.346-.55A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Tambah
          </button>
        </div>
      </div>
    ))}
  </div>`);

// Replace cart items
code = code.replace(/<div className="cart-items" id="cartItems"><\/div>/g, 
  `<div className="cart-items" id="cartItems">
    {!cart.length ? (
      <div className="empty-cart">Keranjang masih kosong. Tambahkan produk dari katalog di atas.</div>
    ) : (
      cart.map((item: any) => (
        <div key={item.id} className="cart-item">
          <div>
            <h4>{item.name}</h4>
            <p>Rp {item.price.toLocaleString('id-ID')} x {item.qty}</p>
          </div>
          <div className="cart-item-actions">
            <button type="button" onClick={() => changeQuantity(item.id, -1)}>-</button>
            <span>{item.qty}</span>
            <button type="button" onClick={() => changeQuantity(item.id, 1)}>+</button>
          </div>
        </div>
      ))
    )}
  </div>`);

// Replace testimoni
code = code.replace(/<div className="testimoni-list fade-in" id="testimoniList">[\s\S]*?<\/div>/g, 
  `<div className="testimoni-list fade-in" id="testimoniList">
    {reviews.map((r: any, i: number) => (
      <div key={i} className="testimoni-card">
        <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
        <h4>{r.name}</h4>
        <p>{r.text}</p>
        <small style={{ color: 'var(--gray)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
          {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </small>
      </div>
    ))}
  </div>`);

// Inject IntersectionObserver into the first useEffect
code = code.replace(/setActiveSection\(current\);\n    };\n    window\.addEventListener\('scroll', handleScroll\);/g, 
  `setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 100);`);

fs.writeFileSync('app/page.tsx', code);
