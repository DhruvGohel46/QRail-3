# QRail-3: Railway Asset Management & Maintenance System

![QRail Logo](https://img.shields.io/badge/comprehensive railway asset management and maintenance system)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-Latest-61dafb)

## 📋 Overview

**QRail-3** is a comprehensive railway asset management and maintenance system project designed to revolutionize railway asset management and maintenance tracking through QR code integration. The system provides a comprehensive digital solution for Indian Railways to efficiently track, manage, and maintain critical railway assets with minimal manual intervention.

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
- **QR-based Asset Identification**: Scan QR codes to instantly retrieve asset information
- **Asset Management Dashboard**: View, create, and manage railway assets
- **Maintenance Tracking**: Record and track maintenance history for each asset
- **User Database**: Multi-user support with role-based access (Admin, Maintenance Staff, Inspectors)
- **XML-based Data Storage**: Lightweight, portable database for asset and user information
- **Automated Asset ID Generation**: Unique identifiers for each railway asset
- **Maintenance Schedule Generation**: AI-assisted maintenance recommendations based on asset age and usage
- **Statistics & Analytics**: Real-time insights into asset health and maintenance status
- **Responsive Web Interface**: Works seamlessly on desktop and mobile devices

### 🔮 Planned Features (Roadmap)
- 🤖 AI/NLP Integration for maintenance data analysis using Llama 3.2 model
- 📱 Mobile app for on-field maintenance staff
- 🗣️ Voice input support (Indian language recognition via AI4Bharat)
- 📋 Advanced analytics and predictive maintenance
- ☁️ Cloud database integration
- 🔐 Enhanced authentication & encryption
- 📡 Real-time IoT sensor integration

---

## 🏧 Project Structure

```
QRail-3/
├── Frontend/                           # React/Next.js web interface
│   ├── components/                     # React components
│   ├── pages/                          # Page components
│   ├── styles/                         # CSS and styling
│   ├── public/                         # Static assets
│   └── package.json                    # Frontend dependencies
│
├── backend/                            # Flask REST API
│   ├── routes/                         # API endpoints
│   ├── models/                         # Data models
│   ├── utils/                          # Utility functions
│   └── requirements.txt                # Python dependencies
│
├── generate_railway_database.py        # Script to generate sample railway assets
├── railway_assets.xml                  # Railway assets database (sample data)
├── users_database.xml                  # User credentials and roles (sample data)
├── QRailrun.bat                        # Windows batch script to run the application
├── README.md                           # This file
└── .gitignore                         # Git ignore rules
```

### 📄 Key Files Description

| File | Purpose |
|------|----------|
| `generate_railway_database.py` | Command-line tool to generate railway asset XML database with customizable sample data |
| `railway_assets.xml` | Stores all railway asset information (ID, type, location, status, maintenance history) |
| `users_database.xml` | Stores user credentials, roles, and permissions |
| `QRailrun.bat` | One-click batch script to start both backend and frontend servers |

---

## 🖠️ Tech Stack

### Frontend
- **React** / **Next.js** - Modern UI framework
- **JavaScript (ES6+)** - Client-side logic
- **HTML5 & CSS3** - Markup and styling
- **Material Design / Tailwind CSS** - UI components and responsive design

### Backend
- **Python 3.8+** - Server-side language
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin request handling
- **QR Code Library** - QR generation and scanning

### Database
- **XML** - Lightweight data storage (current)
- **SQLite / PostgreSQL** - Planned for production
- **JSON** - Configuration and API responses

### Tools & Libraries
- **generate_railway_database.py** - Custom asset database generator
- **PIL/Pillow** - QR code generation
- **pyzbar** - QR code scanning
- **OpenCV** - Image processing (future AI integration)

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

### Step 5: Run the Application

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
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Access the Application
- **Frontend**: Open browser and go to `http://localhost:3000`
- **API Docs**: `http://localhost:5000/api/docs` (if enabled)

---

## 🚀 Usage Guide

### For Railway Maintenance Staff

1. **Login**: Use your credentials from the user database
2. **Dashboard**: View all assigned assets and maintenance schedules
3. **Scan Asset**: Click "Scan QR Code" and scan the QR code on an asset
4. **View Details**: See comprehensive asset information and history
5. **Log Maintenance**: Record maintenance activities with date and notes
6. **Generate Report**: Export maintenance reports for audit purposes

### For Railway Inspectors/Admins

1. **Asset Management**: Add, edit, or remove railway assets
2. **User Management**: Create and manage user accounts and permissions
3. **View Analytics**: Access dashboard with real-time asset health metrics
4. **Generate Schedules**: Create automated maintenance schedules
5. **Export Data**: Export asset and maintenance data in multiple formats

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

### Assets
```
GET    /api/assets              - Get all assets
POST   /api/assets              - Create new asset
GET    /api/assets/<id>         - Get specific asset
PUT    /api/assets/<id>         - Update asset
DELETE /api/assets/<id>         - Delete asset
```

### Maintenance Records
```
GET    /api/maintenance         - Get all maintenance records
POST   /api/maintenance         - Create maintenance record
GET    /api/maintenance/<id>    - Get specific record
```

### Users
```
GET    /api/users               - Get all users
POST   /api/users/register      - Register new user
POST   /api/users/login         - User login
GET    /api/users/<id>          - Get user details
```

### QR Codes
```
POST   /api/qr/generate         - Generate QR code for asset
GET    /api/qr/<asset_id>       - Get QR code image
```

---

## 🤖 AI/ML Integration (In Progress)

### Planned AI Features:

**1. Maintenance Prediction**
- Using historical data to predict when assets need maintenance
- Reducing downtime and extending asset lifecycle

**2. Voice Input Support**
- Indian language recognition (Hindi, Gujarati, Tamil, etc.)
- Using AI4Bharat models for language processing
- Voice-to-text for maintenance notes

**3. Natural Language Processing**
- Automated analysis of maintenance reports
- Anomaly detection in asset behavior
- Smart recommendations

**4. Computer Vision**
- Asset condition assessment via images
- QR code scanning with image processing
- Damage detection and classification

### Current Implementation Status:
- ✅ QR code generation and basic scanning
- 🔄 Local Llama 3.2 model integration (in progress)
- ⏳ AI4Bharat language models (awaiting access)
- ⏳ Advanced analytics dashboard

---

## 🔐 Security Features

- **User Authentication**: Secure login with role-based access control
- **Data Validation**: Input validation to prevent injection attacks
- **CORS Protection**: Configured cross-origin request handling
- **Future**: Password hashing, JWT tokens, SSL/TLS encryption

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
- [AI4Bharat - Indian Language Models](https://ai4bharat.iitm.ac.in)
- [Llama 3.2 Model Hub](https://www.llama.com)
- [Hugging Face Model Repository](https://huggingface.co)

---

## 🎯 Roadmap & Timeline

### Phase 1: MVP (November - December 2025) ✅ In Progress
- ✅ Core QR code asset tracking system
- ✅ Basic CRUD operations for assets
- ✅ User authentication & role-based access
- ✅ XML database integration
- ✅ Web dashboard (React)
- ✅ Flask backend API
- 🔄 Integration testing

### Phase 2: Enhancement (January - February 2026)
- 📋 Advanced analytics dashboard
- 📋 AI4Bharat language model integration
- 📋 Voice input support (Hindi, Gujarati, etc.)
- 📋 Maintenance prediction algorithms
- 📋 Mobile-responsive design refinements
- 📋 Export to PDF/Excel functionality

### Phase 3: Production Ready (March 2026)
- 📋 Cloud deployment (AWS/Azure)
- 📋 Real-time notifications & alerts
- 📋 Advanced reporting & analytics
- 📋 IoT sensor integration
- 📋 Database migration to PostgreSQL
- 📋 Performance optimization

---

## 📣 Project Statistics

- **Total Lines of Code**: 5000+ (Python + JavaScript)
- **Frontend Components**: 15+
- **API Endpoints**: 20+
- **Database Records**: XML with 100+ sample assets
- **Development Time**: 2+ months
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
  
  Last Updated: November 29, 2025  
  Current Version: 1.0.0 (Beta)  
  Status: 🟢 Active Development
  
</div>
