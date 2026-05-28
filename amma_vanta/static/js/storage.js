// ========== LOCALSTORAGE CART MANAGEMENT ==========

const Storage = {
    getCart() {
        try { return JSON.parse(localStorage.getItem('ammavanta_cart')) || []; }
        catch { return []; }
    },
    saveCart(cart) {
        localStorage.setItem('ammavanta_cart', JSON.stringify(cart));
    },
    addItem(item) {
        const cart = this.getCart();
        const existing = cart.find(i => i.id === item.id && i.weight === item.weight);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...item, qty: 1 });
        }
        this.saveCart(cart);
        return cart;
    },
    removeItem(id, weight) {
        const cart = this.getCart().filter(i => !(i.id === id && i.weight === weight));
        this.saveCart(cart);
        return cart;
    },
    updateQty(id, weight, qty) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === id && i.weight === weight);
        if (item) {
            if (qty <= 0) return this.removeItem(id, weight);
            item.qty = qty;
        }
        this.saveCart(cart);
        return cart;
    },
    clearCart() {
        localStorage.removeItem('ammavanta_cart');
    },
    getTotal() {
        return this.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
    },
    getCount() {
        return this.getCart().reduce((sum, i) => sum + i.qty, 0);
    }
};
