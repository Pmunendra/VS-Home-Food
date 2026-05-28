// ============================================================
//  CHECKOUT PAGE JS
// ============================================================

// ── Load logged-in user details into form ──────────────────
async function prefillUserDetails() {
    try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.logged_in && data.user) {
            const u   = data.user;
            const set = (id, val) => { const el = document.getElementById(id); if (el && !el.value) el.value = val || ''; };
            set('fullName', u.full_name);
            set('phone',    u.phone);
            set('email',    u.email);
            let hidden = document.getElementById('_userEmail');
            if (!hidden) {
                hidden = document.createElement('input');
                hidden.type = 'hidden'; hidden.id = '_userEmail';
                document.body.appendChild(hidden);
            }
            hidden.value = u.email;
        }
    } catch (e) {}
}

function initCheckout() {
    const checkoutItems = document.getElementById('checkoutItems');
    if (!checkoutItems) return;
    const cart = Storage.getCart();
    if (cart.length === 0) { window.location.href = '/cart'; return; }

    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span class="checkout-item-name">${item.emoji} ${item.name}${item.weight ? ' (' + item.weight + ')' : ''}</span>
            <span class="checkout-item-qty">×${item.qty}</span>
            <span class="checkout-item-price">₹${item.price * item.qty}</span>
        </div>`).join('');

    const sub = Storage.getTotal();
    if (document.getElementById('coSubtotal')) document.getElementById('coSubtotal').textContent = `₹${sub}`;
    if (document.getElementById('coTotal'))    document.getElementById('coTotal').textContent    = `₹${sub + 40}`;
}

function applyCheckoutCoupon() {
    const code = document.getElementById('coCoupon')?.value?.toUpperCase();
    const msg  = document.getElementById('coCouponMsg');
    if (code === 'FIRST10' || code === 'FIRST20') {
        const pct      = code === 'FIRST10' ? 0.1 : 0.2;
        const discount = Math.round(Storage.getTotal() * pct);
        if (msg) { msg.textContent = `✅ ₹${discount} discount applied!`; msg.className = 'coupon-msg success'; }
        if (document.getElementById('coTotal')) document.getElementById('coTotal').textContent = `₹${Storage.getTotal() + 40 - discount}`;
    } else {
        if (msg) { msg.textContent = '❌ Invalid coupon'; msg.className = 'coupon-msg error'; }
    }
}

async function placeOrder() {
    const fields = {
        fullName    : document.getElementById('fullName')?.value?.trim(),
        phone       : document.getElementById('phone')?.value?.trim(),
        email       : (document.getElementById('email')?.value?.trim()) ||
                      (document.getElementById('_userEmail')?.value?.trim()) || '',
        address1    : document.getElementById('address1')?.value?.trim(),
        address2    : document.getElementById('address2')?.value?.trim() || '',
        city        : document.getElementById('city')?.value?.trim(),
        pincode     : document.getElementById('pincode')?.value?.trim(),
        instructions: document.getElementById('instructions')?.value?.trim() || '',
    };

    if (!fields.fullName)  { showFormError('Please enter your full name!'); return; }
    if (!fields.phone || fields.phone.length < 10) { showFormError('Please enter a valid phone number!'); return; }
    if (!fields.email || !fields.email.includes('@')) { showFormError('Please enter your email address for order confirmation!'); return; }
    if (!fields.address1)  { showFormError('Please enter your delivery address!'); return; }
    if (!fields.city)      { showFormError('Please enter your city!'); return; }
    if (!fields.pincode || fields.pincode.length < 5) { showFormError('Please enter a valid PIN code!'); return; }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'upi';
    const cart = Storage.getCart();
    if (cart.length === 0) { window.location.href = '/cart'; return; }

    const btn = document.getElementById('placeOrderBtn');
    btn.innerHTML = '<span class="btn-spinner"></span> Placing Order...';
    btn.disabled  = true;
    clearFormError();

    try {
        const response = await fetch('/api/order/place', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...fields,
                paymentMethod,
                items: cart.map(i => ({
                    id:     i.id,
                    name:   i.name,
                    emoji:  i.emoji || '🍱',
                    weight: i.weight || '',
                    qty:    i.qty,
                    price:  i.price
                }))
            })
        });

        if (!response.ok) {
            showFormError('Server error. Please refresh and try again.');
            btn.innerHTML = 'Place Order 🎉'; btn.disabled = false; return;
        }

        const result = await response.json();
        if (result.success) {
            Storage.clearCart();
            sessionStorage.setItem('lastOrderId',      result.order_id);
            sessionStorage.setItem('lastOrderTotal',   result.grand_total);
            sessionStorage.setItem('lastPaymentMethod',paymentMethod);
            window.location.href = '/order-success';
        } else {
            showFormError(result.message || 'Order could not be placed. Please try again.');
            btn.innerHTML = 'Place Order 🎉'; btn.disabled = false;
        }
    } catch (err) {
        showFormError('Connection error! Check your internet and try again.');
        btn.innerHTML = 'Place Order 🎉'; btn.disabled = false;
    }
}

function showFormError(msg) {
    clearFormError();
    const el = document.createElement('div');
    el.id = 'formError';
    el.style.cssText = 'background:#FEE2E2;color:#DC2626;padding:14px 20px;border-radius:10px;margin-bottom:16px;font-size:14px;font-weight:500;';
    el.textContent = '⚠️ ' + msg;
    const btn = document.getElementById('placeOrderBtn');
    btn?.parentNode?.insertBefore(el, btn);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormError() {
    document.getElementById('formError')?.remove();
}

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
    prefillUserDetails();
});
