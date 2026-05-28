# ============================================================
#  AUTH ROUTES — Register / Login / Logout / Profile
# ============================================================
from flask import Blueprint, request, jsonify, session
from models.user_model import db, User
from services.notification_service import send_welcome_email

auth_bp = Blueprint('auth', __name__)


# ── REGISTER ────────────────────────────────────────────────
@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data received'}), 400

        required = ['firstName', 'lastName', 'email', 'phone', 'password']
        for field in required:
            if not data.get(field, '').strip():
                return jsonify({'success': False, 'message': f'{field} is required'}), 400

        email = data['email'].lower().strip()
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered. Please login.'}), 409

        if data.get('password') != data.get('confirmPassword'):
            return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

        if len(data['password']) < 8:
            return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

        user = User(
            first_name=data['firstName'].strip(),
            last_name =data['lastName'].strip(),
            email     =email,
            phone     =data['phone'].strip(),
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        session.permanent = True
        session['user_id']    = user.id
        session['user_name']  = user.first_name
        session['user_email'] = user.email

        #send_welcome_email(user)

        print(f"[REGISTER] New user: {user.email}")
        return jsonify({
            'success': True,
            'message': f'Welcome {user.first_name}! Account created successfully.',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"[REGISTER ERROR] {e}")
        return jsonify({'success': False, 'message': 'Registration failed. Try again.'}), 500


# ── LOGIN ────────────────────────────────────────────────────
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data received'}), 400

        email    = data.get('email', '').lower().strip()
        password = data.get('password', '')
        remember = data.get('remember', False)

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

        session.permanent = bool(remember)
        session['user_id']    = user.id
        session['user_name']  = user.first_name
        session['user_email'] = user.email

        print(f"[LOGIN] User logged in: {user.email}")
        return jsonify({
            'success': True,
            'message': f'Welcome back, {user.first_name}!',
            'user': user.to_dict()
        })

    except Exception as e:
        print(f"[LOGIN ERROR] {e}")
        return jsonify({'success': False, 'message': 'Login failed. Try again.'}), 500


# ── LOGOUT ───────────────────────────────────────────────────
@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})


# ── GET CURRENT USER ─────────────────────────────────────────
@auth_bp.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'logged_in': False}), 401
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({'success': False, 'logged_in': False}), 401
    return jsonify({'success': True, 'logged_in': True, 'user': user.to_dict()})


# ── CONTACT FORM ─────────────────────────────────────────────
@auth_bp.route('/api/contact', methods=['POST'])
def contact():
    try:
        data = request.get_json()
        from models.user_model import ContactMessage
        msg = ContactMessage(
            name   =data.get('name', '').strip(),
            email  =data.get('email', '').strip(),
            phone  =data.get('phone', '').strip(),
            subject=data.get('subject', '').strip(),
            message=data.get('message', '').strip(),
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message sent successfully!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
