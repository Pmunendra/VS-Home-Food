# ============================================================
#  ORDER ROUTES
# ============================================================
from flask import Blueprint, request, jsonify, session
from models.user_model import db, User
from models.order_model import Order
from services.notification_service import notify_order_placed
import random, string
from datetime import datetime

order_bp = Blueprint('orders', __name__)

def generate_order_id():
    suffix = ''.join(random.choices(string.digits, k=5))
    return f"AV{datetime.now().strftime('%y%m%d')}{suffix}"


@order_bp.route('/api/order/place', methods=['POST'])
def place_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data received'}), 400

        print(f"[ORDER] Received data: {data}")

        # ── Validate email (required for notification) ────────
        customer_email = data.get('email', '').strip()
        if not customer_email:
            customer_email = session.get('user_email', '')
        if not customer_email:
            return jsonify({'success': False, 'message': 'Email address required for order confirmation'}), 400

        # ── Calculate totals ──────────────────────────────────
        order_id = generate_order_id()
        items = data.get('items', [])
        if not items:
            return jsonify({'success': False, 'message': 'Cart is empty'}), 400

        for item in items:
            item['total'] = float(item.get('price', 0)) * int(item.get('qty', 1))
            item['emoji']  = item.get('emoji', '🍱')
            item['weight'] = item.get('weight', '')

        subtotal    = sum(i['total'] for i in items)
        grand_total = subtotal + 40  # delivery charge

        # ── Build order_data ──────────────────────────────────
        order_data = {
            'order_id':       order_id,
            'customer_email': customer_email,
            'items':          items,
            'address': {
                'name':    data.get('fullName', ''),
                'phone':   data.get('phone', ''),
                'line1':   data.get('address1', ''),
                'line2':   data.get('address2', ''),
                'city':    data.get('city', ''),
                'pincode': data.get('pincode', ''),
            },
            'payment_method': data.get('paymentMethod', 'UPI'),
            'grand_total':    grand_total,
            'instructions':   data.get('instructions', ''),
        }

        # ── Save to database ──────────────────────────────────
        order = Order(
            order_id       = order_id,
            user_id        = session.get('user_id'),
            customer_email = customer_email,
            customer_name  = data.get('fullName', ''),
            customer_phone = data.get('phone', ''),
            address_line1  = data.get('address1', ''),
            address_line2  = data.get('address2', ''),
            city           = data.get('city', ''),
            pincode        = data.get('pincode', ''),
            payment_method = data.get('paymentMethod', 'UPI'),
            grand_total    = grand_total,
            instructions   = data.get('instructions', ''),
            status         = 'pending',
        )
        order.set_items(items)
        db.session.add(order)
        db.session.commit()
        print(f"[ORDER] ✅ Saved to DB: {order_id}")

        # ── Send notifications ────────────────────────────────
        notify_results = notify_order_placed(order_data)
        print(f"[ORDER] Notification results: {notify_results}")

        return jsonify({
            'success':       True,
            'order_id':      order_id,
            'grand_total':   grand_total,
            'notifications': notify_results,
            'message':       'Order placed successfully!'
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print(f"[ORDER ERROR] {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@order_bp.route('/api/orders', methods=['GET'])
def get_all_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]})


@order_bp.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data       = request.get_json()
    new_status = data.get('status')
    order = Order.query.filter_by(order_id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    order.status = new_status
    db.session.commit()
    return jsonify({'success': True, 'order_id': order_id, 'status': new_status})


@order_bp.route('/api/stats', methods=['GET'])
def get_stats():
    from sqlalchemy import func
    today = datetime.utcnow().date()
    total_orders   = Order.query.count()
    total_revenue  = db.session.query(func.sum(Order.grand_total)).scalar() or 0
    today_orders   = Order.query.filter(func.date(Order.created_at) == today).count()
    today_revenue  = db.session.query(func.sum(Order.grand_total)).filter(
                        func.date(Order.created_at) == today).scalar() or 0
    pending_orders = Order.query.filter_by(status='pending').count()
    return jsonify({
        'total_orders':  total_orders,
        'total_revenue': float(total_revenue),
        'today_orders':  today_orders,
        'today_revenue': float(today_revenue),
        'pending_orders':pending_orders,
    })
