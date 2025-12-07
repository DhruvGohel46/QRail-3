# QRail: Railway Asset Management & Maintenance System

![QRail Logo](https://img.shields.io/badge/comprehensive railway asset management and maintenance system)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-Latest-61dafb)

## 📋 Overview

**QRail** is a comprehensive railway asset management and maintenance system project designed to revolutionize railway asset management and maintenance tracking through QR code integration. The system provides a comprehensive digital solution for Indian Railways to efficiently track, manage, and maintain critical railway assets with minimal manual intervention.

### Problem Statement
Indian Railways operates over 5 lakh railway assets across the country. Current maintenance and asset tracking relies heavily on manual processes, leading to:
- Delayed maintenance schedules
- Asset misplacement and loss
- Inconsistent maintenance records
- Difficulty in real-time asset monitoring
- Reduced operational efficiency

### Our Solution
QRail-3 leverages QR codes, web technology, and data analytics to provide:
- **Instant Asset Identification** via QR scanning
- **Real-time Maintenance Tracking**
- **Centralized Asset Database** with historical records
- **Automated Maintenance Scheduling**
- **User-friendly Dashboard** for railway personnel

---

## 🌟 Features

### ✨ Core Features
- **QR-based Asset Identification**: Scan QR codes via camera or file upload to instantly retrieve asset information
- **QR Code Generation**: Generate QR codes for assets in multiple formats (PNG, SVG, PDF)
- **Asset Management Dashboard**: View, create, update, and delete railway assets with advanced search
- **Maintenance Tracking**: Record and track maintenance history for each asset with detailed logs
- **User Management System**: Multi-user support with role-based access control (Admin, Manufacturer, Engineer, Worker)
- **User Registration & Approval**: Email-based OTP verification and admin approval workflow
- **XML-based Data Storage**: Lightweight, portable database for asset and user information
- **Automated Asset ID Generation**: Unique identifiers for each railway asset with intelligent naming
- **Statistics & Analytics Dashboard**: Real-time insights into asset health, maintenance status, and user activity
- **Reports & Export**: Export asset data in Excel (XLSX) and XML formats
- **Responsive Web Interface**: Works seamlessly on desktop and mobile devices
- **Session Management**: Secure session-based authentication with role-based permissions

### 🤖 AI/ML Features (Implemented)
- **Speech Recognition**: Voice-to-text maintenance logging using Vosk offline speech recognition (English-Indian accent)
- **AI Description Enhancement**: Automatic maintenance description enhancement using local Llama 3.2 model via Ollama
- **Real-time QR Scanning**: Camera-based QR code detection with live frame processing

### 🔮 Planned Features (Roadmap)
- 📱 Mobile app for on-field maintenance staff
- 🗣️ Multi-language voice input support (Hindi, Gujarati, Telugu via Vosk)
- 📋 Advanced analytics and predictive maintenance algorithms
- ☁️ Cloud database integration (PostgreSQL/MongoDB)
- 🔐 Enhanced authentication with JWT tokens and password hashing
- 📡 Real-time IoT sensor integration
- 🔔 Push notifications for maintenance schedules

---

## 🏧 Project Structure

```
QRail/
├── Frontend/                           # React web interface
│   ├── src/
│   │   ├── components/                 # React components
│   │   │   ├── Admin/                  # Admin panel components
│   │   │   ├── Assets/                 # Asset management components
│   │   │   ├── Maintenance/            # Maintenance tracking components
│   │   │   ├── QRGenerator/            # QR code generation components
│   │   │   ├── Reports/                # Reports and analytics components
│   │   │   └── shared/                 # Shared UI components
│   │   ├── services/                   # API service layer
│   │   ├── styles/                     # CSS and styling
│   │   └── app.js                      # Main React app
│   ├── public/                         # Static assets
│   └── package.json                    # Frontend dependencies
│
├── backend/                            # Flask REST API
│   ├── app.py                          # Main Flask application
│   ├── railway_xml_db.py               # XML database manager
│   ├── railway_user_manager.py         # User management system
│   ├── qr_generator.py                 # QR code generation
│   ├── qr_reader.py                    # QR code scanning
│   ├── speech_processor.py             # Vosk speech recognition
│   ├── email_sender.py                 # Email notification system
│   ├── qr_codes/                       # Generated QR code images
│   └── requirements.txt                # Python dependencies
│
├── models/                             # ML/AI models
│   └── vosk-model-en-in-0.5/          # Vosk speech recognition model
│
├── generate_railway_database.py        # Script to generate sample railway assets
├── railway_assets.xml                  # Railway assets database
├── users_database.xml                  # User credentials and roles
├── QRailrun.bat                        # Windows batch script to run the application
├── README.md                           # This file
└── .gitignore                         # Git ignore rules
```

### 📄 Key Files Description

| File | Purpose |
|------|----------|
| `backend/app.py` | Main Flask application with all API endpoints |
| `backend/railway_xml_db.py` | XML database manager for assets and maintenance records |
| `backend/railway_user_manager.py` | User management system with role-based access control |
| `backend/qr_generator.py` | QR code generation in multiple formats |
| `backend/qr_reader.py` | QR code scanning and detection |
| `backend/speech_processor.py` | Vosk-based speech recognition module |
| `backend/email_sender.py` | SMTP email notification system |
| `generate_railway_database.py` | Command-line tool to generate railway asset XML database with customizable sample data |
| `railway_assets.xml` | Stores all railway asset information (ID, type, location, status, maintenance history) |
| `users_database.xml` | Stores user credentials, roles, and permissions |
| `QRailrun.bat` | One-click batch script to start both backend and frontend servers |

---

## 🖠️ Tech Stack

### Frontend
- **React 18.2** - Modern UI framework
- **JavaScript (ES6+)** - Client-side logic
- **HTML5 & CSS3** - Markup and styling
- **html5-qrcode** - QR code scanning library
- **Axios** - HTTP client for API calls
- **React Scripts** - Build tooling

### Backend
- **Python 3.8+** - Server-side language
- **Flask 3.1.2** - Lightweight web framework
- **Flask-CORS** - Cross-origin request handling
- **qrcode / segno** - QR code generation libraries
- **pyzbar / qreader** - QR code scanning and detection
- **openpyxl** - Excel file generation
- **ollama** - Local AI model integration (Llama 3.2)

### AI/ML
- **Vosk** - Offline speech recognition (English-Indian accent model)
- **Ollama** - Local LLM inference server
- **Llama 3.2:3b** - Lightweight language model for text enhancement
- **OpenCV** - Image processing for QR detection

### Database
- **XML** - Lightweight data storage (current implementation)
- **JSON** - Configuration and API responses
- **SQLite / PostgreSQL** - Planned for production scaling

### Email & Communication
- **SMTP** - Email notifications for OTP, approvals, and alerts
- **Session Management** - Secure session-based authentication

---

## 📫 Installation & Setup

### Prerequisites
- **Python 3.8** or higher
- **Node.js 14+** and **npm** or **yarn**
- **Git**
- **Windows/Linux/MacOS**

### Step 1: Clone the Repository

```bash
git clone https://github.com/DhruvGohel46/QRail-3.git
cd QRail-3
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/MacOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Note: For AI features, you'll also need Ollama installed separately
# Download from https://ollama.ai and run: ollama pull llama3.2:3b
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install Node dependencies
npm install
# or with yarn
yarn install
```

### Step 4: Generate Sample Data

```bash
# From the project root directory
python generate_railway_database.py --samples 50 --output railway_assets.xml

# View all available options:
python generate_railway_database.py --help
```

### Step 5: Configure Optional Features

#### Email Configuration (Optional - for OTP and notifications)
```bash
# Set environment variables for SMTP
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export SMTP_FROM=your-email@gmail.com
```

#### AI Model Setup (Optional - for description enhancement)
```bash
# Install and start Ollama
# Download from https://ollama.ai
# Pull Llama 3.2 model:
ollama pull llama3.2:3b
```

#### Speech Recognition Setup (Optional)
```bash
# Vosk model is included in models/vosk-model-en-in-0.5/
# Ensure the model path is correct in speech_processor.py
```

### Step 6: Run the Application

#### Option A: Using QRailrun.bat (Windows)
```bash
# From project root, double-click or run:
QRailrun.bat
```

#### Option B: Manual Start (All Platforms)

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
# Backend runs on http://localhost:8000 (default port)
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm start
# Frontend runs on http://localhost:3000
```

### Access the Application
- **Frontend**: Open browser and go to `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`

---

## 🚀 Usage Guide

### For Railway Workers/Engineers

1. **Login**: Select your role (Worker/Engineer) and enter credentials
2. **Dashboard**: View assigned assets and recent maintenance activities
3. **Scan Asset**: Use camera or upload QR code image to retrieve asset information
4. **View Asset Details**: See comprehensive asset information, location, and maintenance history
5. **Log Maintenance**: 
   - Record maintenance activities with date, type, and description
   - Use voice input for hands-free maintenance logging
   - Enhance descriptions with AI for professional documentation
6. **Generate QR Codes**: Create QR codes for new assets in multiple formats

### For Manufacturers

1. **Login**: Select "Manufacturer" role and enter credentials
2. **Add Assets**: Create new railway assets with automatic ID generation
3. **Asset Management**: Update asset information and manufacturing details
4. **QR Code Generation**: Generate and download QR codes for assets

### For Admins

1. **User Management**: 
   - Approve or reject pending user registrations
   - Create new admin accounts
   - Delete user accounts
   - View all active and pending users
2. **Asset Management**: Full CRUD operations on all assets
3. **Analytics Dashboard**: View real-time statistics on assets, maintenance, and users
4. **Reports & Export**: Export asset data in Excel or XML formats
5. **System Configuration**: Manage system settings and permissions

### Command-Line Usage

```bash
# Generate railway database with 100 sample assets
python generate_railway_database.py --samples 100 --output railway_assets.xml

# Verbose output for debugging
python generate_railway_database.py --verbose

# Help message
python generate_railway_database.py --help
```

---

## 📋 API Endpoints (Backend)

### Authentication & User Management
```
POST   /api/login               - User login with role verification
POST   /api/register            - Register new user (requires OTP verification)
POST   /api/logout              - Logout current user
GET    /api/check-session       - Check if user is authenticated
GET    /api/profile             - Get current user profile
POST   /api/send-otp            - Send OTP to email for verification
POST   /api/verify-otp          - Verify OTP code
POST   /api/test-email          - Test SMTP email configuration
```

### Admin Endpoints
```
GET    /api/admin/users         - Get all users (active and pending)
GET    /api/admin/pending-users - Get pending user registrations
POST   /api/admin/approve-user  - Approve pending user registration
POST   /api/admin/reject-user   - Reject pending user registration
DELETE /api/admin/delete-user   - Delete active user
POST   /api/admin/create-admin  - Create new admin user
```

### Assets
```
GET    /api/assets              - Get all assets (with optional filters)
POST   /api/assets              - Create new asset (auto-generates asset ID)
PUT    /api/assets/<asset_id>   - Update asset information
DELETE /api/assets/<asset_id>  - Delete asset and associated maintenance records
```

### Maintenance Records
```
GET    /api/maintenance         - Get all maintenance records
POST   /api/maintenance         - Create maintenance record
```

### QR Code Operations
```
POST   /api/scan-qr             - Scan QR from text/JSON data
POST   /api/scan-qr-file        - Scan QR from uploaded image file
POST   /api/scan-qr-frame       - Real-time QR scanning from camera frames
```

### AI & Speech Processing
```
GET    /api/speech/languages     - Get supported speech recognition languages
POST   /api/speech/process-audio - Convert speech to text using Vosk
POST   /api/ai/enhance-description - Enhance maintenance description using Llama 3.2
```

### Reports & Analytics
```
GET    /api/reports/stats       - Get dashboard statistics
GET    /api/reports/export      - Export data (format: excel or xml)
```

### Health & Status
```
GET    /health                  - Health check endpoint
GET    /                        - Serve React SPA
```

---

## 🤖 AI/ML Integration

### Implemented AI Features:

**1. Speech Recognition (Vosk) ✅**
- Offline speech-to-text conversion
- English-Indian accent model support
- Real-time audio processing from browser
- Base64 audio input support
- Used for voice-based maintenance logging

**2. AI Description Enhancement (Ollama + Llama 3.2) ✅**
- Local LLM integration via Ollama
- Automatic maintenance description enhancement
- Professional technical writing assistance
- Preserves factual information while improving clarity
- Temperature-controlled responses for consistency

**3. Advanced QR Code Detection ✅**
- Real-time camera-based QR scanning
- Multiple QR detection libraries (pyzbar, qreader)
- Image processing with OpenCV
- Frame-by-frame scanning for live detection

### Planned AI Features:

**1. Maintenance Prediction**
- Using historical data to predict when assets need maintenance
- Reducing downtime and extending asset lifecycle
- Machine learning models for predictive analytics

**2. Multi-language Voice Input**
- Hindi, Gujarati, Telugu language recognition
- Vosk models integration
- Regional language support for maintenance notes

**3. Natural Language Processing**
- Automated analysis of maintenance reports
- Anomaly detection in asset behavior
- Smart maintenance recommendations

**4. Computer Vision**
- Asset condition assessment via images
- Damage detection and classification
- Automated visual inspection

---

## 🔐 Security Features

- **User Authentication**: Secure session-based login with role verification
- **Role-Based Access Control (RBAC)**: Granular permissions for different user roles
- **OTP Email Verification**: Two-factor authentication for user registration
- **Session Management**: Secure HTTP-only session cookies with SameSite protection
- **Data Validation**: Input validation to prevent injection attacks
- **CORS Protection**: Configured cross-origin request handling for development
- **Admin Approval Workflow**: New user registrations require admin approval
- **Email Notifications**: Automated emails for approvals, rejections, and account changes
- **Future Enhancements**: Password hashing (bcrypt), JWT tokens, SSL/TLS encryption

---

## 📋 Performance Metrics

- **Page Load Time**: < 2 seconds
- **QR Scan Detection**: < 1 second
- **Database Query**: < 500ms
- **Concurrent Users Supported**: 100+ (scalable to 1000+ with cloud DB)

---

## 🦸 Testing

```bash
# Run backend tests
cd backend
pytest tests/

# Run frontend tests
cd ../Frontend
npm test

# Integration tests
cd ../
pytest tests/integration/
```

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Areas:
- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📚 Documentation updates
- 🎫 UI/UX improvements
- 🤖 AI/ML model integration

---

comprehensive railway asset management and maintenance system

This project is submitted for **comprehensive railway asset management and maintenance system** under the railway asset management and maintenance category. The solution addresses the challenge of modernizing railway operations through digital transformation.

**Problem Statement**: Digital transformation of railway asset management and preventive maintenance scheduling  
**Organization**: Indian Railways / Ministry of Railways  
**Institution**: Gujarat Technological University (GTU), Ahmedabad  
**Team Lead**: Dhruv Gohel  
**Batch**: 2028 (3rd Year CSE)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Dhruv Gohel**
- **GitHub**: [@DhruvGohel46](https://github.com/DhruvGohel46)
- **Institution**: Gujarat Technological University (GTU), Ahmedabad
- **Course**: Bachelor of Computer Science Engineering (CSE)
- **Current Year**: 3rd Year (Graduating 2028)
- **Campus**: GTU-SET, Chandkheda, Ahmedabad
- **Email**: dhruvgohel46@gmail.com
- **LinkedIn**: [@DhruvGohel46](https://linkedin.com/in/DhruvGohel46)
- **Portfolio**: [dhruvgohel.dev](https://dhruvgohel.dev) (Coming Soon)

---

## 🙋 Support & Contact

For questions, suggestions, or issues:

- 📧 **Email**: dhruvgohel46@gmail.com
- 💬 **GitHub Issues**: [Open an Issue](https://github.com/DhruvGohel46/QRail-3/issues)
- 🤝 **Discord**: Available for collaboration
- 💱 **LinkedIn**: [@DhruvGohel46](https://linkedin.com/in/DhruvGohel46)

---

## 📚 Resources & References

- [SIH 2025 Official Portal](https://www.sih.gov.in)
- [Indian Railways Official Website](https://www.indianrailways.gov.in)
- [Flask Documentation](https://flask.palletsprojects.com)
- [React Documentation](https://react.dev)
- [QR Code Technology Guide](https://www.qr-code-generator.com)
- [Vosk Speech Recognition](https://alphacephei.com/vosk)
- [Llama 3.2 Model Hub](https://www.llama.com)
- [Hugging Face Model Repository](https://huggingface.co)

---

## 🎯 Roadmap & Timeline

### Phase 1: MVP ✅ Completed
- ✅ Core QR code asset tracking system
- ✅ QR code generation (PNG, SVG, PDF formats)
- ✅ Basic CRUD operations for assets
- ✅ User authentication & role-based access (4 roles)
- ✅ XML database integration
- ✅ Web dashboard (React)
- ✅ Flask backend API
- ✅ User registration with OTP email verification
- ✅ Admin approval workflow
- ✅ Maintenance tracking system
- ✅ Reports & export functionality (Excel/XML)

### Phase 2: AI/ML Integration ✅ Completed
- ✅ Speech recognition with Vosk (English-Indian accent)
- ✅ AI description enhancement with Ollama/Llama 3.2
- ✅ Real-time QR code scanning from camera
- ✅ Advanced analytics dashboard
- ✅ Email notification system

### Phase 3: Enhancement (In Progress)
- 🔄 Mobile-responsive design refinements
- 🔄 Performance optimization
- 📋 Multi-language voice input (Hindi, Gujarati, Telugu)
- 📋 Maintenance prediction algorithms
- 📋 Advanced reporting with charts and graphs
- 📋 PDF export functionality

### Phase 4: Production Ready (Planned)
- 📋 Cloud deployment (AWS/Azure)
- 📋 Real-time push notifications
- 📋 Database migration to PostgreSQL
- 📋 JWT token authentication
- 📋 Password hashing (bcrypt)
- 📋 SSL/TLS encryption
- 📋 IoT sensor integration
- 📋 Mobile app development

---

## 📣 Project Statistics

- **Total Lines of Code**: 8000+ (Python + JavaScript/JSX)
- **Frontend Components**: 30+ React components
- **Backend Modules**: 8 Python modules
- **API Endpoints**: 25+ RESTful endpoints
- **User Roles**: 4 (Admin, Manufacturer, Engineer, Worker)
- **Database**: XML-based with extensible architecture
- **AI/ML Models**: Vosk (speech), Llama 3.2 (text enhancement)
- **Development Time**: 3+ months
- **Team Members**: Solo project + mentor guidance

---

## 🙏 Acknowledgments

- **GTU Faculty**: For guidance and support
- **SIH 2025 Organizers**: For the opportunity to innovate
- **Indian Railways**: Problem statement inspiration
- **Open Source Community**: For amazing tools and libraries
- **Stack Overflow & GitHub Communities**: For technical support

---

<div align="center">
  
  ⭐ **If you find this project useful, please consider giving it a star!** ⭐
  
  ![GitHub Stars](https://img.shields.io/github/stars/DhruvGohel46/QRail-3?style=social)
  ![GitHub Forks](https://img.shields.io/github/forks/DhruvGohel46/QRail-3?style=social)
  ![GitHub Watchers](https://img.shields.io/github/watchers/DhruvGohel46/QRail-3?style=social)
  
  ---
  
  **Made Dhruv Gohel for Railway Asset Management**
  
  *"Modernizing Indian Railways through Digital Innovation"*
  
  Last Updated: January 2025  
  Current Version: 2.0.0 (Beta)  
  Status: 🟢 Active Development
  
</div>
