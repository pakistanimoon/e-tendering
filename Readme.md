# E-Tendering Platform

An AI-powered electronic tendering and procurement platform that automates bid evaluation using Large Language Models (LLMs).

## 🚀 Features

### For Organizations
- **Project Management**: Create and manage tender projects with custom evaluation criteria
- **Criteria Builder**: Define technical, financial, and compliance requirements
- **AI-Powered Evaluation**: Automatic analysis of bid submissions using Claude AI
- **Comparative Analysis**: Side-by-side comparison of all bids with intelligent scoring
- **Contract Award**: Streamlined process for selecting and awarding contracts

### For Bidders
- **Project Discovery**: Browse active tenders and opportunities
- **Multi-Document Upload**: Submit financials, RFP, EOI, SBD, SPQ, and technical documents
- **Bid Tracking**: Monitor submission status and evaluation progress
- **Evaluation Feedback**: Receive scores and qualification status

### AI Evaluation Engine
- **Document Processing**: Extracts text from PDFs, Word documents, and Excel files
- **Intelligent Scoring**: Evaluates bids on technical merit, financial competitiveness, and compliance using Google Gemini
- **Contextual Analysis**: Understands requirements and matches against criteria
- **Risk Assessment**: Identifies potential issues and red flags
- **Ranking System**: Automatically ranks bids based on weighted criteria

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  FastAPI Backend│────▶│   PostgreSQL    │
│   (TypeScript)  │     │    (Python)     │     │    Database     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ├─────────────┐
                              │             │
                              ▼             ▼
                        ┌──────────┐  ┌──────────┐
                        │  MinIO   │  │  Redis   │
                        │ Storage  │  │  Cache   │
                        └──────────┘  └──────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │  AI Worker   │
                        │              │
                        └──────────────┘
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Google Gemini API**: AI-powered document evaluation
- **PostgreSQL**: Relational database
- **Redis**: Caching and job queue
- **MinIO**: S3-compatible object storage
- **Alembic**: Database migrations

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling
- **React Router**: Navigation
- **Axios**: HTTP client

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **GitHub Actions**: CI/CD pipeline
- **pytest**: Backend testing
- **Jest**: Frontend testing

## 📦 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- Google API Key (for Gemini AI features)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/e-tendering-platform.git
cd e-tendering-platform
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://etendering:dev_password_123@postgres:5432/etendering_db

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# Google Gemini API
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

### 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

### 5. Default Credentials

Register new users through the application. First registered organization and bidder will have full access.

## 📚 Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Running Tests

**Backend Tests:**
```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## 🏗️ Project Structure

```
e-tendering-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/         # API endpoints
│   │   │   │   ├── auth.py
│   │   │   │   ├── organization.py
│   │   │   │   ├── bidder.py
│   │   │   │   └── evaluation.py
│   │   │   ├── schemas/        # Pydantic models
│   │   │   └── dependencies.py # Shared dependencies
│   │   ├── core/
│   │   │   └── config.py       # Configuration
│   │   ├── db/
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   └── database.py     # DB connection
│   │   ├── services/
│   │   │   ├── ai_evaluator.py # AI evaluation logic
│   │   │   ├── document_processor.py
│   │   │   └── storage_service.py
│   │   ├── workers/
│   │   │   └── evaluation_worker.py
│   │   └── main.py             # FastAPI app
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Organization/
│   │   │   ├── Bidder/
│   │   │   └── Shared/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
└── README.md
```

## 🔧 Configuration

### Evaluation Criteria Example

```json
{
  "technical_weight": 60,
  "financial_weight": 40,
  "minimum_experience_years": 5,
  "required_certifications": ["ISO 9001", "ISO 27001"],
  "minimum_team_size": 10,
  "technical_requirements": [
    "Cloud infrastructure experience",
    "DevOps expertise",
    "Security compliance"
  ],
  "scoring_rubric": {
    "experience": 20,
    "technical_approach": 25,
    "team_quality": 15,
    "pricing": 40
  }
}
```

## 🤖 AI Evaluation Process

1. **Document Upload**: Bidder uploads multiple document types
2. **Text Extraction**: System extracts text from PDFs, DOCX, XLSX
3. **AI Analysis**: Claude evaluates against criteria
4. **Scoring**: Generates technical, financial, and compliance scores
5. **Ranking**: Ranks all bids comparatively
6. **Report Generation**: Creates detailed evaluation reports

## 📊 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Organization:**
- `POST /api/organization/projects` - Create project
- `GET /api/organization/projects` - List projects
- `GET /api/organization/projects/{id}/evaluations` - View evaluations
- `POST /api/organization/projects/{id}/award/{bid_id}` - Award contract

**Bidder:**
- `GET /api/bidder/projects` - List active projects
- `POST /api/bidder/bids` - Create bid
- `POST /api/bidder/bids/{id}/documents` - Upload document
- `POST /api/bidder/bids/{id}/submit` - Submit bid

**Evaluation:**
- `POST /api/evaluation/evaluate/{bid_id}` - Trigger evaluation
- `GET /api/evaluation/compare/{project_id}` - Compare all bids

## 🚢 Deployment

### Using Docker Compose (Production)

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### Environment Variables for Production

```env
DEBUG=false
DATABASE_URL=postgresql://user:password@prod-db:5432/etendering
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=use-strong-secret-here
GOOGLE_API_KEY=your-production-key
GEMINI_MODEL=gemini-1.5-pro
CORS_ORIGINS=https://your-domain.com
```

## 🔒 Security Considerations

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ File upload validation
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ CORS configuration
- ✅ Rate limiting (Redis-based)
- ✅ Input validation (Pydantic)
- ✅ Secure document storage (MinIO with encryption)

## 📈 Monitoring & Logging

- Application logs via Python logging
- Access logs via Uvicorn
- Docker logs via `docker-compose logs`
- Database query logging (development)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript strict mode
- Write tests for new features
- Update documentation
- Run linters before committing

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- FastAPI framework
- React community
- Open source contributors

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Github: pakistanimoon
- Documentation: https://github.com/pakistanimoon/e-tendering

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Mobile app
- [ ] Integration with ERP systems
- [ ] Blockchain-based audit trail
- [ ] Advanced reporting
- [ ] Vendor management system

---

**Built with ❤️ using FastAPI, React, and Google Gemini AI**