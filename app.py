from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
import os
import bcrypt
import jwt
import datetime
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import re
from functools import wraps
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Kal78048'
app.config['MYSQL_DB'] = 'viinterns'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

mysql = MySQL(app)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enhanced AI Service for Viinterns
class ViinternsAIService:
    def __init__(self):
        self.field_keywords = {
            'Engineering': {
                'keywords': ['software', 'developer', 'engineer', 'programming', 'coding', 'tech', 'computer science', 'web development'],
                'companies': ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tech Startup', 'Innovation Labs']
            },
            'Medicine': {
                'keywords': ['medical', 'healthcare', 'clinical', 'hospital', 'nursing', 'pharmacy', 'biomedical'],
                'companies': ['City Hospital', 'Medical Center', 'Health Clinic', 'Research Institute']
            },
            'Business': {
                'keywords': ['business', 'management', 'marketing', 'sales', 'consulting', 'operations', 'administration'],
                'companies': ['Business Corp', 'Consulting Firm', 'Startup Hub', 'Enterprise Solutions']
            },
            'Science': {
                'keywords': ['research', 'laboratory', 'biology', 'chemistry', 'physics', 'scientist', 'environmental'],
                'companies': ['Research Lab', 'Science Institute', 'Environmental Org', 'Biotech Company']
            },
            'Art': {
                'keywords': ['art', 'design', 'creative', 'painting', 'drawing', 'illustration', 'graphic'],
                'companies': ['Art Gallery', 'Design Studio', 'Creative Agency', 'Museum']
            },
            'Education': {
                'keywords': ['teaching', 'education', 'tutor', 'instructor', 'academic', 'curriculum'],
                'companies': ['School District', 'Learning Center', 'Education Non-profit', 'Online Education']
            }
        }
    
    def search_internships(self, user_skills, career_fields, preferences):
        """Search internships based on user skills and preferences"""
        all_internships = []
        
        try:
            user_skills_lower = [skill.lower().strip() for skill in user_skills]
            
            for field in career_fields:
                if field in self.field_keywords:
                    field_internships = self._generate_field_internships(field, user_skills_lower, preferences)
                    all_internships.extend(field_internships)
            
            # Filter by skill match
            skill_matched = self._filter_by_skill_match(all_internships, user_skills_lower)
            
            return skill_matched[:15]  # Limit results
            
        except Exception as e:
            logging.error(f"Search error: {e}")
            return []
    
    def _generate_field_internships(self, field, user_skills, preferences):
        """Generate internships for a specific field"""
        internships = []
        field_data = self.field_keywords[field]
        
        for i in range(2):  # Generate 2 per field
            company = random.choice(field_data['companies'])
            keyword = random.choice(field_data['keywords'])
            
            # Find matching user skills
            matching_skills = []
            for skill in user_skills:
                if any(field_keyword in skill for field_keyword in field_data['keywords']):
                    matching_skills.append(skill)
            
            internship = {
                'title': f'{field} Intern - {keyword.title()} Focus',
                'company': company,
                'location': preferences.get('location', 'Remote'),
                'type': random.choice(['Remote', 'Hybrid', 'On-site']),
                'duration': f'{random.randint(2, 6)} months',
                'stipend': f'${random.randint(1000, 3000)}/month',
                'description': f'Perfect for beginners interested in {field.lower()}. Learn {keyword} skills through hands-on projects. No experience required.',
                'skills': self._generate_relevant_skills(field, user_skills),
                'experienceRequired': 'No experience required',
                'postedDate': (datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
                'matchingSkills': matching_skills[:3]
            }
            internships.append(internship)
        
        return internships
    
    def _generate_relevant_skills(self, field, user_skills):
        """Generate skills list with relevant user skills"""
        base_skills = ['Communication', 'Teamwork', 'Willingness to Learn', 'Basic Computer Skills']
        
        # Add relevant user skills
        relevant_skills = []
        field_keywords_lower = [kw.lower() for kw in self.field_keywords[field]['keywords']]
        
        for skill in user_skills:
            if any(keyword in skill for keyword in field_keywords_lower):
                relevant_skills.append(skill.title())
        
        return base_skills + relevant_skills[:2]
    
    def _filter_by_skill_match(self, internships, user_skills):
        """Filter internships by skill match"""
        matched_internships = []
        
        for internship in internships:
            internship_skills = [skill.lower() for skill in internship.get('skills', [])]
            
            # Calculate match score
            match_count = 0
            for user_skill in user_skills:
                if any(user_skill in intern_skill or intern_skill in user_skill for intern_skill in internship_skills):
                    match_count += 1
            
            if match_count > 0:  # Only include internships with at least one matching skill
                internship['skillMatchRatio'] = match_count / len(user_skills) if user_skills else 0
                internship['skillMatchCount'] = match_count
                matched_internships.append(internship)
        
        # Sort by match ratio
        matched_internships.sort(key=lambda x: x['skillMatchRatio'], reverse=True)
        return matched_internships

# Initialize AI Service
ai_service = ViinternsAIService()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = get_user_by_id(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except Exception as e:
            logging.error(f"Token validation error: {e}")
            return jsonify({'message': 'Token validation failed'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Database helper functions
def get_user_by_id(user_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        return user
    except Exception as e:
        logging.error(f"Error getting user by id: {e}")
        return None

def get_user_by_email(email):
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        return user
    except Exception as e:
        logging.error(f"Error getting user by email: {e}")
        return None

# Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'Viinterns Backend API',
        'status': 'running',
        'version': '1.0'
    })

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data received'}), 400
            
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        user_type = data.get('userType', 'student')
        
        if not all([name, email, password]):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({'message': 'User already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert user
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO users (name, email, phone, password, user_type) 
            VALUES (%s, %s, %s, %s, %s)
        """, (name, email, phone, hashed_password, user_type))
        mysql.connection.commit()
        user_id = cur.lastrowid
        cur.close()
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        user_data = {
            'id': user_id,
            'name': name,
            'email': email,
            'phone': phone,
            'userType': user_type
        }
        
        # Add additional fields based on user type
        if user_type == 'student':
            user_data['skills'] = data.get('skills', [])
        else:
            user_data['company'] = data.get('company', '')
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': user_data
        }), 201
        
    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data received'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'message': 'Missing email or password'}), 400
        
        # Get user
        user = get_user_by_email(email)
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'userType': user['user_type']
        }
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_data
        }), 200
        
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@app.route('/api/search-jobs', methods=['POST'])
def search_jobs():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data received'}), 400
        
        search_criteria = {
            'skills': data.get('skills', []),
            'careerFields': data.get('careerFields', []),
            'preferences': data.get('preferences', {})
        }
        
        # Get internships from AI service
        internships = ai_service.search_internships(
            search_criteria['skills'],
            search_criteria['careerFields'],
            search_criteria['preferences']
        )
        
        return jsonify({
            'message': f'Found {len(internships)} internships matching your skills',
            'internships': internships,
            'sources': ['Viinterns AI Search']
        }), 200
        
    except Exception as e:
        logging.error(f"Job search error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data received'}), 400
            
        message = data.get('message', '')
        
        # Simple response generation
        if 'hello' in message.lower() or 'hi' in message.lower():
            response = "Hello! I'm your Viinterns assistant. I can help you find no-experience internships, improve your resume, or prepare for interviews."
        elif 'internship' in message.lower():
            response = "I can help you find internships that require no prior experience! Check your dashboard for personalized recommendations."
        elif 'resume' in message.lower():
            response = "For no-experience positions, focus on transferable skills, education, projects, and willingness to learn in your resume."
        else:
            response = "I specialize in helping students find no-experience-required internships! How can I assist you today?"
        
        return jsonify({'response': response}), 200
        
    except Exception as e:
        logging.error(f"Chat error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

# Database initialization
def init_db():
    """Initialize database with required tables"""
    try:
        cur = mysql.connection.cursor()
        
        # Users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                user_type ENUM('student', 'recruiter') DEFAULT 'student',
                skills JSON,
                company VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Internships table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS internships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                type VARCHAR(50),
                duration VARCHAR(50),
                stipend VARCHAR(100),
                description TEXT,
                skills JSON,
                experience_required VARCHAR(100),
                posted_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Applications table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                internship_id INT,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
            )
        """)
        
        mysql.connection.commit()
        cur.close()
        logging.info("Database initialized successfully")
        
    except Exception as e:
        logging.error(f"Database initialization error: {e}")

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')def search_internships_web(self, preferences):
    """Search internships based ONLY on user's skills and career fields"""
    all_internships = []
    
    try:
        # Get user's specific skills and career fields
        user_skills = [skill.strip().lower() for skill in preferences.get('skills', [])]
        career_fields = preferences.get('careerFields', [])
        
        # If no skills specified, return empty results
        if not user_skills:
            return []
        
        # Search for each career field that matches user skills
        for field in career_fields:
            if self._field_matches_skills(field, user_skills):
                field_internships = self._search_field_internships(field, user_skills, preferences)
                all_internships.extend(field_internships)
        
        # Filter internships to only show those matching user skills
        skill_matched_internships = self._filter_by_skill_match(all_internships, user_skills)
        
        # Remove duplicates and limit results
        unique_internships = self._remove_duplicates(skill_matched_internships)
        return unique_internships[:15]  # Limit to 15 results
        
    except Exception as e:
        logging.error(f"Web search error: {e}")
        return []

def _field_matches_skills(self, field, user_skills):
    """Check if user has skills relevant to this career field"""
    if field not in self.field_keywords:
        return False
    
    field_keywords = [kw.lower() for kw in self.field_keywords[field]['keywords']]
    
    # Check if any user skill matches field keywords
    for skill in user_skills:
        if any(keyword in skill for keyword in field_keywords):
            return True
        if any(skill in keyword for keyword in field_keywords):
            return True
    
    return False

def _filter_by_skill_match(self, internships, user_skills):
    """Filter internships to only include those matching user skills"""
    matched_internships = []
    
    for internship in internships:
        internship_skills = [skill.lower() for skill in internship.get('skills', [])]
        
        # Calculate skill match ratio
        matching_skills = []
        for user_skill in user_skills:
            for intern_skill in internship_skills:
                if user_skill in intern_skill or intern_skill in user_skill:
                    matching_skills.append(user_skill)
                    break
        
        # Only include internships with at least one matching skill
        if matching_skills:
            internship['matchingSkills'] = list(set(matching_skills))
            internship['skillMatchCount'] = len(matching_skills)
            internship['skillMatchRatio'] = len(matching_skills) / len(user_skills)
            matched_internships.append(internship)
    
    # Sort by skill match ratio (highest first)
    matched_internships.sort(key=lambda x: x['skillMatchRatio'], reverse=True)
    return matched_internships

def _search_field_internships(self, field, user_skills, preferences):
    """Search internships for a specific career field that matches user skills"""
    internships = []
    
    if field not in self.field_keywords:
        return internships
    
    field_data = self.field_keywords[field]
    location = preferences.get('location', 'Remote')
    
    # Find skills that match this field
    matching_skills = []
    field_keywords_lower = [kw.lower() for kw in field_data['keywords']]
    
    for skill in user_skills:
        if any(keyword in skill for keyword in field_keywords_lower):
            matching_skills.append(skill)
        elif any(skill in keyword for keyword in field_keywords_lower):
            matching_skills.append(skill)
    
    # Only generate internships if there are matching skills
    if not matching_skills:
        return internships
    
    companies = self._get_companies_for_field(field)
    
    for i in range(2):  # Generate 2 internships per matching field
        company = random.choice(companies)
        primary_skill = random.choice(matching_skills)
        
        internship = {
            'title': f'{field} Intern - {primary_skill.title()} Focus',
            'company': company,
            'location': location,
            'type': random.choice(['Remote', 'Hybrid', 'On-site']),
            'duration': random.choice(['2 months', '3 months', '6 months']),
            'stipend': self._generate_stipend(field),
            'description': self._generate_skill_specific_description(field, company, primary_skill),
            'skills': self._generate_relevant_skills(field, user_skills),
            'source': 'Skill-Matched Search',
            'careerField': field,
            'workMode': random.choice(['Remote', 'Hybrid', 'On-site']),
            'experienceRequired': 'No experience required',
            'postedDate': (datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
            'userSkillsMatch': matching_skills
        }
        internships.append(internship)
    
    return internships

def _generate_skill_specific_description(self, field, company, primary_skill):
    """Generate description focused on the user's specific skills"""
    descriptions = {
        'Engineering': f"Perfect for beginners with {primary_skill} interest! Join {company} to apply your {primary_skill} knowledge in real projects. Comprehensive training provided.",
        'Medicine': f"Ideal for students with {primary_skill} background. Gain healthcare experience at {company} with focus on {primary_skill} applications.",
        'Business': f"Apply your {primary_skill} skills in business context at {company}. Learn practical business operations with your existing knowledge.",
        'Science': f"Research internship at {company} focusing on {primary_skill} applications. Perfect for science students with relevant interest.",
        'Art': f"Creative internship leveraging your {primary_skill} abilities. Work on artistic projects at {company} with professional guidance."
    }
    
    return descriptions.get(field, f"Apply your {primary_skill} skills at {company}. {field} internship with comprehensive training and mentorship.")

def _generate_relevant_skills(self, field, user_skills):
    """Generate skills list that includes ONLY relevant user skills"""
    base_skills = ['Communication', 'Teamwork', 'Willingness to Learn']
    
    # Filter user skills to only include relevant ones for this field
    relevant_user_skills = []
    field_keywords_lower = [kw.lower() for kw in self.field_keywords[field]['keywords']]
    
    for skill in user_skills:
        if any(keyword in skill for keyword in field_keywords_lower):
            relevant_user_skills.append(skill.title())
        elif any(skill in keyword for keyword in field_keywords_lower):
            relevant_user_skills.append(skill.title())
    
    # Limit to 3 most relevant skills
    relevant_user_skills = relevant_user_skills[:3]
    
    return base_skills + relevant_user_skills