# ============================================================
#  ADMIN ROUTES — Dashboard, Orders, Users
# ============================================================
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, current_app
from models.user_model import db, User, ContactMessage
from models.order_model import Order
from functools import wraps

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/admin')


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_bp.admin_login'))
        return f(*args, **kwargs)
    return decorated


# ── LOGIN ────────────────────────────────────────────────────
@admin_bp.route('/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('is_admin'):
        return redirect(url_for('admin_bp.dashboard'))
    if request.method == 'POST':
        data     = request.get_json()
        password = (data or {}).get('password', '')
        if password == current_app.config.get('ADMIN_PASSWORD', 'admin123'):
            session['is_admin'] = True
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Invalid admin password'}), 401
    return render_template('admin/login.html')


@admin_bp.route('/logout')
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('admin_bp.admin_login'))


# ── DASHBOARD ────────────────────────────────────────────────
@admin_bp.route('/')
@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    from sqlalchemy import func
    from datetime import datetime, timedelta

    today = datetime.utcnow().date()
    stats = {
        'total_orders'  : Order.query.count(),
        'total_revenue' : db.session.query(func.sum(Order.grand_total)).scalar() or 0,
        'today_orders'  : Order.query.filter(func.date(Order.created_at) == today).count(),
        'today_revenue' : db.session.query(func.sum(Order.grand_total)).filter(func.date(Order.created_at) == today).scalar() or 0,
        'pending_orders': Order.query.filter_by(status='pending').count(),
        'total_users'   : User.query.count(),
    }
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    return render_template('admin/dashboard.html', stats=stats, recent_orders=recent_orders)


# ── ORDERS PAGE ───────────────────────────────────────────────
@admin_bp.route('/orders')
@admin_required
def orders():
    status_filter = request.args.get('status', '')
    search        = request.args.get('q', '').strip()
    date_filter   = request.args.get('date', '')

    q = Order.query
    if status_filter:
        q = q.filter_by(status=status_filter)
    if search:
        q = q.filter(
            db.or_(
                Order.order_id.ilike(f'%{search}%'),
                Order.customer_name.ilike(f'%{search}%'),
                Order.customer_phone.ilike(f'%{search}%'),
                Order.customer_email.ilike(f'%{search}%'),
            )
        )
    if date_filter:
        from sqlalchemy import func
        q = q.filter(func.date(Order.created_at) == date_filter)

    all_orders = q.order_by(Order.created_at.desc()).all()
    return render_template('admin/orders.html', orders=all_orders,
                           status_filter=status_filter, search=search, date_filter=date_filter)


# ── USERS PAGE ────────────────────────────────────────────────
@admin_bp.route('/users')
@admin_required
def users():
    all_users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=all_users)


# ── UPDATE ORDER STATUS ───────────────────────────────────────
@admin_bp.route('/api/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_status(order_id):
    data   = request.get_json()
    status = data.get('status')
    order  = Order.query.filter_by(order_id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    order.status = status
    db.session.commit()
    return jsonify({'success': True, 'order_id': order_id, 'status': status})


# ── ORDER DETAIL API ─────────────────────────────────────────
@admin_bp.route('/api/orders/<order_id>', methods=['GET'])
@admin_required
def order_detail(order_id):
    order = Order.query.filter_by(order_id=order_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    return jsonify({'success': True, 'order': order.to_dict()})


# ── STATS API ─────────────────────────────────────────────────
@admin_bp.route('/api/stats')
@admin_required
def stats():
    from sqlalchemy import func
    from datetime import datetime
    today = datetime.utcnow().date()
    return jsonify({
        'total_orders'  : Order.query.count(),
        'total_revenue' : float(db.session.query(func.sum(Order.grand_total)).scalar() or 0),
        'today_orders'  : Order.query.filter(func.date(Order.created_at) == today).count(),
        'today_revenue' : float(db.session.query(func.sum(Order.grand_total)).filter(func.date(Order.created_at) == today).scalar() or 0),
        'pending_orders': Order.query.filter_by(status='pending').count(),
        'total_users'   : User.query.count(),
    })
