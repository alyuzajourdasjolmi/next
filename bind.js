const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Bind order form inputs
code = code.replace(/<input type="text" id="customerName" name="customerName" placeholder="Masukkan nama lengkap" required \/>/, 
  '<input type="text" id="customerName" name="customerName" placeholder="Masukkan nama lengkap" required value={orderInfo.customerName} onChange={e => setOrderInfo({...orderInfo, customerName: e.target.value})} />');

code = code.replace(/<input type="tel" id="customerPhone" name="customerPhone" placeholder="08xxxxxxxxxx" required \/>/, 
  '<input type="tel" id="customerPhone" name="customerPhone" placeholder="08xxxxxxxxxx" required value={orderInfo.customerPhone} onChange={e => setOrderInfo({...orderInfo, customerPhone: e.target.value})} />');

code = code.replace(/<input type="date" id="pickupDate" name="pickupDate" required \/>/, 
  '<input type="date" id="pickupDate" name="pickupDate" required value={orderInfo.pickupDate} onChange={e => setOrderInfo({...orderInfo, pickupDate: e.target.value})} />');

// Bind delivery and payment method
code = code.replace(/<input type="radio" name="deliveryMethod" value="pickup" checked \/>/, 
  '<input type="radio" name="deliveryMethod" value="pickup" checked={orderInfo.deliveryMethod === "pickup"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "pickup"})} />');
code = code.replace(/<input type="radio" name="deliveryMethod" value="delivery" \/>/, 
  '<input type="radio" name="deliveryMethod" value="delivery" checked={orderInfo.deliveryMethod === "delivery"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "delivery"})} />');

code = code.replace(/<input type="radio" name="paymentMethod" value="COD" checked \/>/, 
  '<input type="radio" name="paymentMethod" value="COD" checked={orderInfo.paymentMethod === "COD"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "COD"})} />');
code = code.replace(/<input type="radio" name="paymentMethod" value="Mandiri" \/>/, 
  '<input type="radio" name="paymentMethod" value="Mandiri" checked={orderInfo.paymentMethod === "Mandiri"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "Mandiri"})} />');
code = code.replace(/<input type="radio" name="paymentMethod" value="BSI" \/>/, 
  '<input type="radio" name="paymentMethod" value="BSI" checked={orderInfo.paymentMethod === "BSI"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "BSI"})} />');

code = code.replace(/<textarea id="customerAddress" name="customerAddress" rows=\{4\} placeholder="Masukkan alamat lengkap atau gunakan lokasi saat ini" \/>/, 
  '<textarea id="customerAddress" name="customerAddress" rows={4} placeholder="Masukkan alamat lengkap atau gunakan lokasi saat ini" value={orderInfo.customerAddress} onChange={e => setOrderInfo({...orderInfo, customerAddress: e.target.value})} />');

// Bind reviews form
code = code.replace(/<input type="hidden" id="reviewRating" value="5" \/>/, 
  '<input type="hidden" id="reviewRating" value={reviewForm.rating} />');
code = code.replace(/<input type="text" id="reviewName" placeholder="Nama Anda" required \/>/, 
  '<input type="text" id="reviewName" placeholder="Nama Anda" required value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />');
code = code.replace(/<textarea id="reviewText" rows=\{3\} placeholder="Tuliskan ulasan Anda tentang toko atau produk kami" required><\/textarea>/, 
  '<textarea id="reviewText" rows={3} placeholder="Tuliskan ulasan Anda tentang toko atau produk kami" required value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})}></textarea>');

// Map star ratings logic
code = code.replace(/<span className="star active" data-value="1">★<\/span>[\s\S]*?<span className="star active" data-value="5">★<\/span>/,
  `{[1, 2, 3, 4, 5].map(val => (
    <span key={val} className={\`star \${val <= reviewForm.rating ? 'active' : ''}\`} onClick={() => setReviewForm({...reviewForm, rating: val})}>★</span>
  ))}`);

// Bind form submits
code = code.replace(/<form id="orderForm" className="order-form">/, '<form id="orderForm" className="order-form" onSubmit={submitOrder}>');
code = code.replace(/<form id="reviewForm" className="order-form">/, '<form id="reviewForm" className="order-form" onSubmit={submitReview}>');

// Update delivery fields and dynamic UI elements
code = code.replace(/<div id="deliveryFields" className="delivery-fields hidden">/, 
  '<div id="deliveryFields" className={`delivery-fields ${orderInfo.deliveryMethod === \'delivery\' ? \'\' : \'hidden\'}`}>');
code = code.replace(/<p id="paymentInstructionText">.*?<\/p>/, 
  '<p id="paymentInstructionText">{PAYMENT_INFO[orderInfo.paymentMethod as keyof typeof PAYMENT_INFO]}</p>');
code = code.replace(/<strong id="checkoutItemCount">0<\/strong>/, '<strong id="checkoutItemCount">{cartCount}</strong>');
code = code.replace(/<strong id="checkoutTotal">Rp 0<\/strong>/, '<strong id="checkoutTotal">Rp {getCartSubtotal().toLocaleString(\'id-ID\')}</strong>');
code = code.replace(/<strong id="subtotalPrice\">Rp 0<\/strong>/, '<strong id="subtotalPrice">Rp {getCartSubtotal().toLocaleString(\'id-ID\')}</strong>');
code = code.replace(/<strong id="shippingCost">Rp 0<\/strong>/, '<strong id="shippingCost">{shipInfo.shippingCost === null ? \'-\' : `Rp ${shipInfo.shippingCost.toLocaleString(\'id-ID\')}`}</strong>');
code = code.replace(/<strong id="shippingDiscount">Rp 0<\/strong>/, '<strong id="shippingDiscount">Rp {shipInfo.discount.toLocaleString(\'id-ID\')}</strong>');
code = code.replace(/<strong id="grandTotal\">Rp 0<\/strong>/, '<strong id="grandTotal">Rp {grandTotal.toLocaleString(\'id-ID\')}</strong>');

code = code.replace(/<p id="distanceInfo\">Jarak tempuh: -<\/p>/, '<p id="distanceInfo">Jarak tempuh: {shipInfo.distanceKm === null ? \'-\' : `${shipInfo.distanceKm.toLocaleString(\'id-ID\')} km`}</p>');
code = code.replace(/<p id="shippingDetail\">Detail ongkir akan muncul setelah lokasi dipilih.<\/p>/, '<p id="shippingDetail">{shipInfo.detail}</p>');

code = code.replace(/<h3 id="inboxTitle\">Belum ada pesanan<\/h3>/, '<h3 id="inboxTitle">{inbox.title || \'Belum ada pesanan\'}</h3>');
code = code.replace(/<p id="inboxMessage\">Silakan pilih produk dan kirim pesanan Anda melalui form checkout.<\/p>/, '<p id="inboxMessage">{inbox.message || \'Silakan pilih produk dan kirim pesanan Anda melalui form checkout.\'}</p>');
code = code.replace(/<div className="inbox-card fade-in" id="inboxCard">/, '<div className={`inbox-card fade-in ${inbox.title ? \'active\' : \'\'}`} id="inboxCard">');

code = code.replace(/<span className="cart-count" id="cartCount\">0<\/span>/, '<span className="cart-count" id="cartCount">{cartCount}</span>');
code = code.replace(/<button className="cart-btn" >/, '<button className="cart-btn" onClick={() => document.getElementById(\'checkout\')?.scrollIntoView({ behavior: \'smooth\' })}>');

code = code.replace(/<button className="btn-secondary" type="button" id="useLocationBtn\">Gunakan Lokasi Saya<\/button>/, '<button className="btn-secondary" type="button" id="useLocationBtn" onClick={useCurrentLocation}>Gunakan Lokasi Saya</button>');
code = code.replace(/<button className="btn-secondary btn-small" type="button" >Kosongkan<\/button>/, '<button className="btn-secondary btn-small" type="button" onClick={clearCart}>Kosongkan</button>');

code = code.replace(/<button className="filter-btn active" >🏪 Semua<\/button>/, '<button className={`filter-btn ${activeTab === \'all\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'all\')}>🏪 Semua</button>');
code = code.replace(/<button className="filter-btn" >🧊 Frozen Food<\/button>/, '<button className={`filter-btn ${activeTab === \'frozen\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'frozen\')}>🧊 Frozen Food</button>');
code = code.replace(/<button className="filter-btn" >📝 ATK<\/button>/, '<button className={`filter-btn ${activeTab === \'atk\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'atk\')}>📝 ATK</button>');
code = code.replace(/<button className="filter-btn" >📦 Other<\/button>/, '<button className={`filter-btn ${activeTab === \'other\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'other\')}>📦 Other</button>');

code = code.replace(/<a href="#frozen" >Frozen Food<\/a>/, '<a href="#frozen" onClick={(e) => navToCategory(e, \'frozen\')}>Frozen Food</a>');
code = code.replace(/<a href="#atk" >ATK<\/a>/, '<a href="#atk" onClick={(e) => navToCategory(e, \'atk\')}>ATK</a>');
code = code.replace(/<a href="#other" >Other<\/a>/, '<a href="#other" onClick={(e) => navToCategory(e, \'other\')}>Other</a>');

code = code.replace(/<button className="theme-toggle" id="themeToggle" type="button" aria-label="Ubah tema">/, '<button className="theme-toggle" id="themeToggle" type="button" aria-label="Ubah tema" onClick={toggleTheme}>');
code = code.replace(/<span className="theme-icon" id="themeIcon">🌙<\/span>/, '<span className="theme-icon" id="themeIcon">{theme === \'dark\' ? \'☀️\' : \'🌙\'}</span>');

code = code.replace(/<div className="mobile-nav" id="mobileNav">/, '<div className={`mobile-nav ${mobileNavOpen ? \'open\' : \'\'}`} id="mobileNav">');
code = code.replace(/<button className="mobile-toggle" id="mobileToggle" aria-label="Menu">/, '<button className="mobile-toggle" id="mobileToggle" aria-label="Menu" onClick={() => setMobileNavOpen(true)}>');
code = code.replace(/<button className="mobile-nav-close" id="mobileClose">&times;<\/button>/, '<button className="mobile-nav-close" id="mobileClose" onClick={() => setMobileNavOpen(false)}>&times;</button>');

code = code.replace(/<nav className="navbar" id="navbar">/, '<nav className={`navbar ${scrolled ? \'scrolled\' : \'\'}`} id="navbar">');
code = code.replace(/<button className="scroll-top" id="scrollTop" aria-label="Scroll to top">/, '<button className={`scroll-top ${scrolled ? \'visible\' : \'\'}`} id="scrollTop" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: \'smooth\' })}>');

fs.writeFileSync('app/page.tsx', code);
