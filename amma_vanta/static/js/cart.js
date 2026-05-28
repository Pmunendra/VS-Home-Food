// ========== CART UI LOGIC ==========

// Sample product data (replace with Flask API later)
const PRODUCTS = [
    { id: 1, name: 'Hyderabadi Biryani', category: 'biryani', emoji: '🍛', price: 280, origPrice: 350, rating: 4.9, reviews: 210, desc: 'Authentic dum biryani with tender mutton, fragrant rice & secret spices.', weights: ['250g', '500g', '1kg'], badge: 'bestseller', veg: false },
    { id: 2, name: 'Gongura Mutton Curry', category: 'curry', emoji: '🥘', price: 320, origPrice: 400, rating: 4.8, reviews: 165, desc: 'Tangy gongura leaves with succulent mutton in a spicy gravy.', weights: ['250g', '500g', '1kg'], badge: 'popular', veg: false },
    { id: 3, name: 'Avakaya Pickle', category: 'pickles', emoji: '🫙', price: 180, origPrice: 220, rating: 4.9, reviews: 320, desc: 'Traditional Andhra raw mango pickle with mustard & red chilli.', weights: ['250g', '500g', '1kg'], badge: 'hot', veg: true },
    { id: 4, name: 'Double Ka Meetha', category: 'sweets', emoji: '🍮', price: 120, origPrice: 150, rating: 4.7, reviews: 98, desc: 'Rich bread pudding with dry fruits, saffron & rose water.', weights: ['250g', '500g'], badge: '', veg: true },
    { id: 5, name: 'Pesarattu', category: 'tiffins', emoji: '🫓', price: 80, origPrice: 100, rating: 4.6, reviews: 145, desc: 'Crispy green moong dal crepes served with ginger chutney.', weights: ['2pcs', '4pcs', '6pcs'], badge: '', veg: true },
    { id: 6, name: 'Tomato Pappu', category: 'dals', emoji: '🫕', price: 90, origPrice: 120, rating: 4.8, reviews: 187, desc: 'Creamy toor dal with tomatoes, tempered with mustard & curry leaves.', weights: ['250g', '500g', '1kg'], badge: '', veg: true },
    { id: 7, name: 'Pulihora', category: 'rice', emoji: '🍚', price: 110, origPrice: 140, rating: 4.7, reviews: 134, desc: 'Tangy tamarind rice with peanuts and sesame, festival favourite.', weights: ['250g', '500g', '1kg'], badge: '', veg: true },
    { id: 8, name: 'Garelu (Vada)', category: 'snacks', emoji: '🥐', price: 60, origPrice: 80, rating: 4.5, reviews: 89, desc: 'Crispy urad dal donuts, golden fried and served with coconut chutney.', weights: ['4pcs', '8pcs', '12pcs'], badge: '', veg: true },
    { id: 9, name: 'Vankaya Masala', category: 'curry', emoji: '🍆', price: 150, origPrice: 190, rating: 4.6, reviews: 112, desc: 'Baby brinjals stuffed with spiced peanut masala in tangy gravy.', weights: ['250g', '500g', '1kg'], badge: '', veg: true },
    { id: 10, name: 'Chicken Keema Curry', category: 'curry', emoji: '🍗', price: 260, origPrice: 320, rating: 4.8, reviews: 203, desc: 'Minced chicken in a rich tomato-onion gravy with aromatic spices.', weights: ['250g', '500g', '1kg'], badge: '', veg: false },
    { id: 11, name: 'Gongura Pachadi', category: 'pickles', emoji: '🌿', price: 140, origPrice: 170, rating: 4.7, reviews: 156, desc: 'Sorrel leaves chutney with garlic and red chilli, quintessential Andhra.', weights: ['200g', '400g'], badge: '', veg: true },
    { id: 12, name: 'Ariselu', category: 'sweets', emoji: '🍯', price: 100, origPrice: 130, rating: 4.8, reviews: 78, desc: 'Traditional rice flour and jaggery sesame sweets, crispy and delicious.', weights: ['250g', '500g'], badge: '', veg: true },
];

// ========== RENDER PRODUCT CARD ==========
function renderProductCard(product) {
    const cart = Storage.getCart();
    const inCart = cart.find(i => i.id === product.id);
    const badgeHTML = product.badge ? `<div class="product-badge ${product.badge === 'bestseller' ? 'bestseller' : ''}">${product.badge === 'bestseller' ? '⭐ Best Seller' : product.badge === 'hot' ? '🔥 Hot' : '❤️ Popular'}</div>` : '';
    const vegBadge = product.veg ? '<div class="product-badge veg" style="right:12px;left:auto;">🌿 Veg</div>' : '';
    const weightOptions = product.weights.map(w => `<option value="${w}">${w}</option>`).join('');
    const cartControl = inCart
        ? `<div class="qty-control">
                <button class="qty-btn" onclick="updateCartQty(${product.id}, -1)">−</button>
                <span class="qty-num">${inCart.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${product.id}, 1)">+</button>
           </div>`
        : `<button class="add-to-cart-btn" onclick="addToCart(${product.id})">+</button>`;

    return `
    <div class="product-card fade-in" data-id="${product.id}" data-category="${product.category}">
        <div class="product-card-img">
            ${badgeHTML}${vegBadge}
            <span>${product.emoji}</span>
        </div>
        <div class="product-card-body">
            <div class="product-category">${product.category}</div>
            <h3 class="product-name"><a href="/product/${product.id}">${product.name}</a></h3>
            <p class="product-desc">${product.desc}</p>
            <div class="product-meta">
                <div class="product-rating"><span>★</span>${product.rating} (${product.reviews})</div>
            </div>
            <select class="weight-select" id="weight-${product.id}">
                ${weightOptions}
            </select>
            <div class="product-footer">
                <div>
                    <span class="product-price">₹${product.price}</span>
                    <span class="product-price-orig">₹${product.origPrice}</span>
                </div>
                ${cartControl}
            </div>
        </div>
    </div>`;
}

// ========== ADD TO CART ==========
function addToCart(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    const weight = document.getElementById(`weight-${id}`)?.value || product.weights[0];
    Storage.addItem({ id: product.id, name: product.name, emoji: product.emoji, price: product.price, weight });
    updateCartUI();
    showCartNotif(product.name);
}

function updateCartQty(id, delta) {
    const cart = Storage.getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    Storage.updateQty(id, item.weight, item.qty + delta);
    updateCartUI();
    // Re-render visible product cards
    document.querySelectorAll(`[data-id="${id}"]`).forEach(card => {
        const newCart = Storage.getCart();
        const newItem = newCart.find(i => i.id === id);
        const footerRight = card.querySelector('.product-footer > :last-child');
        if (footerRight) {
            if (newItem) {
                footerRight.outerHTML = `<div class="qty-control"><button class="qty-btn" onclick="updateCartQty(${id}, -1)">−</button><span class="qty-num">${newItem.qty}</span><button class="qty-btn" onclick="updateCartQty(${id}, 1)">+</button></div>`;
            } else {
                footerRight.outerHTML = `<button class="add-to-cart-btn" onclick="addToCart(${id})">+</button>`;
            }
        }
    });
}

// ========== UPDATE ALL CART UI ==========
function updateCartUI() {
    const cart = Storage.getCart();
    const count = Storage.getCount();
    const total = Storage.getTotal();
    const delivery = total > 0 ? 40 : 0;

    // Badge
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = count;

    // Sidebar
    const container = document.getElementById('cartItemsContainer');
    const empty = document.getElementById('cartEmpty');
    const footer = document.getElementById('cartSidebarFooter');

    if (container && empty && footer) {
        if (cart.length === 0) {
            empty.style.display = 'block';
            footer.style.display = 'none';
            container.innerHTML = '';
            container.appendChild(empty);
        } else {
            empty.style.display = 'none';
            footer.style.display = 'block';
            const itemsHTML = cart.map(item => `
                <div class="cart-item fade-in">
                    <div class="cart-item-emoji">${item.emoji}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-weight">${item.weight}</div>
                        <div class="cart-item-price">₹${item.price * item.qty}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-remove-btn" onclick="removeFromCart(${item.id}, '${item.weight}')">✕ Remove</button>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
                            <span class="qty-num">${item.qty}</span>
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>`).join('');
            container.innerHTML = itemsHTML;
        }
        document.getElementById('sidebarSubtotal').textContent = `₹${total}`;
        document.getElementById('sidebarDelivery').textContent = `₹${delivery}`;
        document.getElementById('sidebarTotal').textContent = `₹${total + delivery}`;
    }
}

function removeFromCart(id, weight) {
    Storage.removeItem(id, weight);
    updateCartUI();
    renderCartPage();
}

// ========== CART PAGE ==========
function renderCartPage() {
    const cartPageItems = document.getElementById('cartPageItems');
    const summarySection = document.getElementById('cartSummarySection');
    if (!cartPageItems) return;
    const cart = Storage.getCart();
    if (cart.length === 0) {
        cartPageItems.innerHTML = `<div class="cart-empty-state"><span>🍽️</span><h3>Your cart is empty</h3><p>Looks like you haven't added anything yet!</p><a href="/menu" class="btn-primary">Browse Menu</a></div>`;
        if (summarySection) summarySection.style.display = 'none';
        return;
    }
    if (summarySection) summarySection.style.display = 'block';
    cartPageItems.innerHTML = cart.map(item => `
        <div class="cart-item fade-in">
            <div class="cart-item-emoji">${item.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-weight">${item.weight}</div>
                <div class="cart-item-price">₹${item.price * item.qty}</div>
            </div>
            <div class="cart-item-actions">
                <button class="cart-remove-btn" onclick="removeFromCart(${item.id}, '${item.weight}')">✕ Remove</button>
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateCartQty(${item.id},-1);renderCartPage()">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id},1);renderCartPage()">+</button>
                </div>
            </div>
        </div>`).join('');
    updateSummary(0);
}

function updateSummary(discount) {
    const sub = Storage.getTotal();
    const delivery = sub > 0 ? 40 : 0;
    const total = sub + delivery - discount;
    if (document.getElementById('pageSubtotal')) document.getElementById('pageSubtotal').textContent = `₹${sub}`;
    if (document.getElementById('pageDelivery')) document.getElementById('pageDelivery').textContent = `₹${delivery}`;
    if (document.getElementById('pageTotal')) document.getElementById('pageTotal').textContent = `₹${total}`;
}

function applyCoupon() {
    const code = document.getElementById('couponInput')?.value?.toUpperCase();
    const msg = document.getElementById('couponMsg');
    const discountRow = document.getElementById('discountRow');
    if (code === 'FIRST10') {
        const discount = Math.round(Storage.getTotal() * 0.1);
        msg.textContent = `✅ 10% discount applied! You save ₹${discount}`;
        msg.className = 'coupon-msg success';
        if (discountRow) discountRow.style.display = 'flex';
        if (document.getElementById('pageDiscount')) document.getElementById('pageDiscount').textContent = `-₹${discount}`;
        updateSummary(discount);
    } else if (code === 'FIRST20') {
        const discount = Math.round(Storage.getTotal() * 0.2);
        msg.textContent = `✅ 20% discount applied! You save ₹${discount}`;
        msg.className = 'coupon-msg success';
        updateSummary(discount);
    } else {
        msg.textContent = '❌ Invalid coupon code';
        msg.className = 'coupon-msg error';
    }
}

// ========== CART NOTIFICATION ==========
function showCartNotif(name) {
    const notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:white;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:600;z-index:999;animation:fadeIn 0.3s ease;box-shadow:0 8px 24px rgba(0,0,0,0.3)';
    notif.textContent = `✅ ${name} added to cart!`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// ========== RENDER PRODUCT DETAIL ==========
function renderProductDetail(id) {
    const product = PRODUCTS.find(p => p.id === id);
    const container = document.getElementById('productDetail');
    if (!product || !container) return;
    container.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-img">${product.emoji}</div>
            <div class="product-detail-info">
                <div class="product-category">${product.category}</div>
                <h1>${product.name}</h1>
                <div class="product-detail-rating">
                    <span style="color:#F59E0B">★ ${product.rating}</span>
                    <span style="color:#888">(${product.reviews} reviews)</span>
                    ${product.veg ? '<span style="color:#22C55E;font-weight:600">🌿 Veg</span>' : '<span style="color:#EF4444;font-weight:600">🥩 Non-Veg</span>'}
                </div>
                <div class="product-detail-price">₹${product.price} <span style="font-size:20px;font-weight:400;color:#888;text-decoration:line-through">₹${product.origPrice}</span></div>
                <p class="product-detail-desc">${product.desc}</p>
                <div class="product-detail-weight">
                    <label>Select Weight/Quantity</label>
                    <select class="weight-select" id="detail-weight-${id}" style="max-width:200px">
                        ${product.weights.map(w => `<option>${w}</option>`).join('')}
                    </select>
                </div>
                <div class="product-detail-actions">
                    <button class="btn-primary" onclick="addToCart(${id})">Add to Cart 🛒</button>
                    <a href="/cart" class="btn-outline">View Cart</a>
                </div>
            </div>
        </div>`;
    // Related
    const related = PRODUCTS.filter(p => p.category === product.category && p.id !== id).slice(0, 4);
    const relatedGrid = document.getElementById('relatedGrid');
    if (relatedGrid) relatedGrid.innerHTML = related.map(renderProductCard).join('');
}

// ========== HOME PAGE GRIDS ==========
function renderHomeGrids() {
    const popularGrid = document.getElementById('popularGrid');
    const bestsellersGrid = document.getElementById('bestsellersGrid');
    if (popularGrid) {
        const popular = PRODUCTS.slice(0, 4);
        popularGrid.innerHTML = popular.map(renderProductCard).join('');
    }
    if (bestsellersGrid) {
        const bests = PRODUCTS.slice(4, 8);
        bestsellersGrid.innerHTML = bests.map(renderProductCard).join('');
    }
}

// ========== MENU PAGE ==========
function renderMenuPage() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(renderProductCard).join('');

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterProducts(tab.dataset.filter);
        });
    });

    // Sort
    const sort = document.getElementById('sortSelect');
    if (sort) sort.addEventListener('change', () => sortProducts(sort.value));
}

function filterProducts(cat) {
    const cards = document.querySelectorAll('#menuGrid .product-card');
    let visible = 0;
    cards.forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    const noResults = document.getElementById('noResults');
    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
}

function sortProducts(val) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    let sorted = [...PRODUCTS];
    if (val === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (val === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else if (val === 'popular') sorted.sort((a, b) => b.reviews - a.reviews);
    grid.innerHTML = sorted.map(renderProductCard).join('');
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    renderHomeGrids();
});
