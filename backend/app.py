from flask  import Flask, request, jsonify
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from pymysql import Error
import jwt
import datetime
from functools import wraps
import bcrypt
from dotenv import load_dotenv
import os


load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
CORS(app, origins=["http://localhost:3000", "http://localhost:8080"], supports_credentials=True)

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': os.getenv('DB_PASS'),
    'database': 'quiz_app',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    try:
        connection = pymysql.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            token = token.split(' ')[1]  # Remove Bearer prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        connection = get_db_connection()
        if connection:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT role FROM users WHERE id = %s", (current_user,))
                    user = cursor.fetchone()

                if not user or user['role'] != 'admin':
                    return jsonify({'message': 'Admin access required'}), 403
                return f(current_user, *args, **kwargs)
            finally:
                connection.close()
        return jsonify({'message': 'Database connection failed'}), 500
    return decorated

# Authentication Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                    (username, email, hashed_password)
                )
                connection.commit()
            return jsonify({'message': 'User registered successfully'}), 201
        except Error as e:
            return jsonify({'message': 'Username or email already exists'}), 400
        finally:
            connection.close()

    return jsonify({'message': 'Database connection failed'}), 500

@app.route('/login', methods=['POST','GET'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    print(f"Login attempt for username: {username}")  # Debug log Helping trace issues

    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, password, role FROM users WHERE username = %s OR email = %s",
                    (username, username)  # Allow login with username or email
                )
                user = cursor.fetchone()

            if user:
                print(f"User found: {user['username']}")  # Debug log
                # Fix password verification
                if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                    token = jwt.encode({
                        'user_id': user['id'],
                        'username': user['username'],
                        'role': user['role'],
                        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                    }, app.config['SECRET_KEY'], algorithm='HS256')

                    return jsonify({
                        'message': 'Login successful',
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'role': user['role']
                        }
                    }), 200
                else:
                    print("Password mismatch")  # Debug log
            else:
                print("User not found")  # Debug log

            return jsonify({'message': 'Invalid credentials'}), 401
        finally:
            connection.close()

    return jsonify({'message': 'Database connection failed'}), 500

# Quiz Routes

# Helps to fetch categories
@app.route('/categories', methods=['GET'])
def get_categories():
    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM categories")
                categories = cursor.fetchall()
            return jsonify(categories), 200
        finally:
            connection.close()
    return jsonify({'message': 'Database connection failed'}), 500



@app.route('/questions/<int:category_id>', methods=['GET'])
@token_required
def get_questions(current_user, category_id):
    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, question_text, option_a, option_b, option_c, option_d, points FROM questions WHERE category_id = %s",
                    (category_id,)
                )
                questions = cursor.fetchall()
            return jsonify(questions), 200
        finally:
            connection.close()
    return jsonify({'message': 'Database connection failed'}), 500

@app.route('/submit-quiz', methods=['POST'])
@token_required
def submit_quiz(current_user):
    data = request.get_json()
    category_id = data.get('category_id')
    answers = data.get('answers')  # {question_id: 'a/b/c/d'}
    time_taken = data.get('time_taken', 0)

    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                # Calculate score
                score = 0
                total_questions = len(answers)

                for question_id, user_answer in answers.items():
                    cursor.execute(
                        "SELECT correct_answer, points FROM questions WHERE id = %s",
                        (question_id,)
                    )
                    question = cursor.fetchone()
                    if question and user_answer == question['correct_answer']:
                        score += question['points']

                # Store result
                cursor.execute(
                    "INSERT INTO results (user_id, category_id, score, total_questions, time_taken) VALUES (%s, %s, %s, %s, %s)",
                    (current_user, category_id, score, total_questions, time_taken)
                )
                connection.commit()

            return jsonify({
                'score': score,
                'total_questions': total_questions,
                'percentage': (score / total_questions) * 100
            }), 200
        finally:
            connection.close()

    return jsonify({'message': 'Database connection failed'}), 500

# Leaderboard Routes
@app.route('/leaderboard/<int:category_id>', methods=['GET'])
def get_leaderboard(category_id):
    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        u.username,
                        MAX(r.score) AS score,
                        MAX(r.total_questions) AS total_questions,
                        MIN(r.time_taken) AS time_taken,
                        MAX(r.completed_at) AS completed_at
                    FROM results r
                    JOIN users u ON r.user_id = u.id
                    WHERE r.category_id = %s
                    GROUP BY r.user_id, u.username
                    ORDER BY score DESC, time_taken ASC
                    LIMIT 20
                """, (category_id,))

                leaderboard = cursor.fetchall()
            return jsonify(leaderboard), 200
        finally:
            connection.close()

    return jsonify({'message': 'Database connection failed'}), 500

# Admin Routes
@app.route('/admin/questions', methods=['POST'])
@token_required
@admin_required
def add_question(current_user):
    data = request.get_json()
    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, points)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    data['category_id'],
                    data['question_text'],
                    data['option_a'],
                    data['option_b'],
                    data['option_c'],
                    data['option_d'],
                    data['correct_answer'],
                    data.get('points', 1)
                ))
                connection.commit()
            return jsonify({'message': 'Question added successfully'}), 201
        finally:
            connection.close()
    return jsonify({'message': 'Database connection failed'}), 500

@app.route('/admin/categories', methods=['POST'])
@token_required
@admin_required
def add_category(current_user):
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({'message': 'Category name is required'}), 400

    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO categories (name, description) VALUES (%s, %s)",
                    (name, description)
                )
                connection.commit()
            return jsonify({'message': 'Category added successfully'}), 201
        except Error as e:
            return jsonify({'message': 'Category already exists'}), 400
        finally:
            connection.close()

    return jsonify({'message': 'Database connection failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)