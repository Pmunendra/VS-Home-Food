# ============================================================
#  PRODUCT ROUTES — Returns menu/product data as JSON
# ============================================================
from flask import Blueprint, jsonify, request

product_bp = Blueprint('products', __name__)

# ── Static product catalogue (extend with DB later) ──────────
PRODUCTS = [
    {"id":1,"name":"Hyderabadi Dum Biryani","emoji":"🍛","category":"biryani","price":280,"weight":"500g","description":"Authentic slow-cooked dum biryani with tender chicken, aromatic basmati, and secret spices.","rating":4.9,"reviews":248,"badge":"Bestseller"},
    {"id":2,"name":"Mutton Biryani","emoji":"🍖","category":"biryani","price":350,"weight":"500g","description":"Slow-cooked tender mutton pieces with fragrant basmati rice and whole spices.","rating":4.8,"reviews":186,"badge":"Popular"},
    {"id":3,"name":"Veg Biryani","emoji":"🥗","category":"biryani","price":200,"weight":"400g","description":"Fragrant vegetable biryani packed with fresh seasonal vegetables and aromatic spices.","rating":4.7,"reviews":142},
    {"id":4,"name":"Gulab Jamun","emoji":"🍮","category":"sweets","price":80,"weight":"250g","description":"Soft, melt-in-mouth milk-solid dumplings soaked in rose-flavored sugar syrup.","rating":4.9,"reviews":312,"badge":"Bestseller"},
    {"id":5,"name":"Double Ka Meetha","emoji":"🍞","category":"sweets","price":120,"weight":"300g","description":"Traditional Hyderabadi bread pudding with condensed milk, saffron, and dry fruits.","rating":4.8,"reviews":178,"badge":"Traditional"},
    {"id":6,"name":"Pesarattu","emoji":"🫓","category":"breakfast","price":60,"weight":"2 pcs","description":"Crispy green moong dal dosa served with ginger chutney and upma filling.","rating":4.7,"reviews":95},
    {"id":7,"name":"Idli Sambar","emoji":"🥘","category":"breakfast","price":50,"weight":"4 pcs","description":"Soft steamed idlis served with piping hot sambar and freshly ground coconut chutney.","rating":4.8,"reviews":167},
    {"id":8,"name":"Chicken Curry","emoji":"🍗","category":"curries","price":220,"weight":"300g","description":"Rich and flavorful Andhra-style chicken curry cooked in a tomato-onion masala base.","rating":4.8,"reviews":203,"badge":"Spicy"},
    {"id":9,"name":"Gongura Mutton","emoji":"🍲","category":"curries","price":280,"weight":"300g","description":"Tender mutton slow-cooked with tangy Andhra gongura (sorrel) leaves — a regional classic.","rating":4.9,"reviews":156,"badge":"Signature"},
    {"id":10,"name":"Dal Tadka","emoji":"🥣","category":"curries","price":100,"weight":"300g","description":"Comforting yellow lentils tempered with cumin, garlic, and dried red chilies.","rating":4.6,"reviews":89},
    {"id":11,"name":"Rasam","emoji":"🫕","category":"curries","price":60,"weight":"250ml","description":"Thin, peppery South Indian broth made with tomatoes, tamarind, and spices.","rating":4.7,"reviews":112},
    {"id":12,"name":"Banana Leaf Meals","emoji":"🍃","category":"meals","price":150,"weight":"Full Meal","description":"Complete South Indian thali on banana leaf with rice, rasam, sambar, curries, and papad.","rating":4.9,"reviews":287,"badge":"Special"},
]

@product_bp.route('/api/products', methods=['GET'])
def get_products():
    cat = request.args.get('category', '')
    if cat:
        filtered = [p for p in PRODUCTS if p['category'] == cat]
        return jsonify({'products': filtered, 'success': True})
    return jsonify({'products': PRODUCTS, 'success': True})

@product_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in PRODUCTS if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    return jsonify({'success': True, 'product': product})
