# Getting Started with E-Tendering Platform

Welcome to the E-Tendering Platform! This guide will help you get the application running on your machine and understand the basics.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [First Run](#first-run)
4. [User Workflows](#user-workflows)
5. [Development Guide](#development-guide)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Docker Desktop** (v20.10 or higher)
   - Download: https://www.docker.com/products/docker-desktop
   - Includes Docker Compose

2. **Git**
   - Download: https://git-scm.com/downloads

3. **Google API Key**
   - Sign up at: https://makersuite.google.com/app/apikey
   - Get your API key from Google AI Studio
   - Enable Generative Language API

### Optional (for local development)

4. **Node.js** (v18 or higher)
   - Download: https://nodejs.org

5. **Python** (v3.11 or higher)
   - Download: https://python.org

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/pakistanimoon/e-tendering.git
cd e-tendering-platform
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google API key:

```env
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

### Step 3: Make Setup Script Executable

```bash
chmod +x setup.sh
```

### Step 4: Run Setup

```bash
./setup.sh
```

Select option `1` for full setup.

## First Run

### Starting the Application

```bash
docker-compose up -d
```

Wait for all services to start (about 30-60 seconds).

### Accessing the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

### Creating Your First Users

1. **Register as an Organization**
   - Go to http://localhost:3000/register
   - Select "Organization" as role
   - Fill in company details
   - Click "Register"

2. **Register as a Bidder**
   - Open a new incognito/private window
   - Go to http://localhost:3000/register
   - Select "Bidder" as role
   - Fill in company details
   - Click "Register"

## User Workflows

### For Organizations

#### 1. Create a New Project/Tender

```
Login → Dashboard → "Create New Project"
```

Fill in:
- Project title (e.g., "Website Development With Deployment")
- Description
- Deadline
- Budget range
- Evaluation criteria

**Example Evaluation Criteria:**

```json
{
  "technical_weight": 60,
  "financial_weight": 40,
  "minimum_experience_years": 3,
  "required_certifications": ["ISO 9001"],
  "technical_requirements": [
    "React experience",
    "Cloud deployment",
    "API development"
  ]
}
```

#### 2. Publish Project

```
Dashboard → Select Project → "Publish"
```

This makes the project visible to bidders.

#### 3. Review Bids

```
Dashboard → Select Project → "View Bids"
```

You'll see:
- List of all submitted bids
- Document uploads
- Evaluation status

#### 4. View AI Evaluations

```
Project Detail → "View Evaluations"
```

The AI will automatically evaluate bids and show:
- Technical scores
- Financial scores
- Compliance status
- Overall ranking
- Detailed analysis

#### 5. Award Contract

```
Evaluations → Select Winner → "Award Contract"
```

### For Bidders

#### 1. Browse Available Projects

```
Login → Dashboard → "Browse Projects"
```

Filter by:
- Deadline
- Budget range
- Industry

#### 2. Submit a Bid

```
Browse Projects → Select Project → "Submit Bid"
```

Fill in:
- Bid amount
- Cover letter
- Upload documents:
  - Financial statements
  - Company profile (RFP/EOI)
  - Technical proposal
  - Past work samples

#### 3. Upload Documents

```
My Bids → Select Bid → "Upload Documents"
```

Supported document types:
- **Financial**: Balance sheets, P&L statements
- **Technical**: Technical proposals, methodologies
- **RFP/EOI**: Company responses
- **SBD**: Standard bidding documents
- **SPQ**: Pre-qualification documents

#### 4. Submit for Evaluation

```
My Bids → Select Bid → "Submit"
```

Once submitted, you cannot modify the bid.

#### 5. Check Evaluation Results

```
My Bids → Select Bid → "View Results"
```

You'll see:
- Your overall score
- Qualification status
- Ranking (if disclosed)

## Development Guide

### Backend Development

#### Running Backend Locally

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Creating Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

#### Adding New API Endpoints

1. Define schemas in `app/api/schemas/`
2. Add route in `app/api/routes/`
3. Include router in `app/main.py`

Example:

```python
# app/api/routes/my_feature.py
from fastapi import APIRouter, Depends
from app.db.database import get_db

router = APIRouter()

@router.get("/my-endpoint")
async def my_endpoint(db = Depends(get_db)):
    return {"message": "Hello World"}
```

### Frontend Development

#### Running Frontend Locally

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at http://localhost:3000

#### Project Structure

```
frontend/src/
├── components/
│   ├── Auth/           # Login, Register
│   ├── Organization/   # Organization views
│   ├── Bidder/         # Bidder views
│   └── Shared/         # Reusable components
├── context/
│   └── AuthContext.tsx # Authentication state
├── services/
│   └── api.ts          # API client
└── App.tsx            # Main app component
```

#### Adding New Components

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default MyComponent;
```

### Testing

#### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

#### Frontend Tests

```bash
cd frontend
npm test
```

## Troubleshooting

### Common Issues

#### 1. Containers Won't Start

**Error**: "Port already in use"

**Solution**:
```bash
# Find what's using the port
lsof -i :8000  # or :3000, :5432, etc.

# Stop the process or change the port in docker-compose.yml
```

#### 2. Database Connection Error

**Error**: "Could not connect to database"

**Solution**:
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 3. Frontend Can't Connect to Backend

**Error**: "Network Error" or CORS error

**Solution**:
```bash
# Check if backend is running
curl http://localhost:8000/health

# Verify CORS settings in backend/.env
CORS_ORIGINS=http://localhost:3000

# Restart backend
docker-compose restart backend
```

#### 4. AI Evaluation Not Working

**Error**: "Evaluation failed" or no scores

**Solution**:
- Check if GOOGLE_API_KEY is set in `.env`
- Verify API key is valid at https://makersuite.google.com/app/apikey
- Ensure Generative Language API is enabled in Google Cloud Console
- Check AI worker logs: `docker-compose logs ai-worker`
- Try switching to gemini-1.5-flash for faster processing: `GEMINI_MODEL=gemini-1.5-flash`

#### 5. File Upload Fails

**Error**: "File type not supported" or "Upload failed"

**Solution**:
```bash
# Check MinIO is running
docker-compose logs minio

# Access MinIO console
# http://localhost:9001
# Username: minioadmin
# Password: minioadmin123

# Verify bucket exists: etendering-documents
```

### Getting Help

1. **Check Logs**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   ```

2. **Restart Services**
   ```bash
   docker-compose restart
   ```

3. **Clean Restart**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Database Issues**
   ```bash
   # Access database
   docker-compose exec postgres psql -U etendering -d etendering_db
   
   # Check tables
   \dt
   
   # Check data
   SELECT * FROM users;
   ```

## Next Steps

1. **Explore the API**
   - Visit http://localhost:8000/docs
   - Try endpoints with the interactive documentation

2. **Customize Evaluation Criteria**
   - Modify the AI prompts in `backend/app/services/ai_evaluator.py`
   - Adjust scoring weights

3. **Add Features**
   - Notifications (email/SMS)
   - Advanced reporting
   - Integration with external systems

4. **Deploy to Production**
   - Review `README.md` deployment section
   - Set up proper secrets management
   - Configure CI/CD pipeline

## Useful Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Rebuild a service
docker-compose up -d --build [service_name]

# Execute command in container
docker-compose exec backend python -m app.scripts.some_script

# Access database shell
docker-compose exec postgres psql -U etendering

# Access Python shell
docker-compose exec backend python

# Stop all services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v
```

## Learning Resources

### FastAPI
- Official Docs: https://fastapi.tiangolo.com
- Tutorial: https://fastapi.tiangolo.com/tutorial/

### React + TypeScript
- React Docs: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/

### Docker
- Get Started: https://docs.docker.com/get-started/
- Compose: https://docs.docker.com/compose/

### Google Gemini
- API Docs: https://ai.google.dev/docs
- Prompt Design: https://ai.google.dev/docs/prompt_best_practices
- Gemini Models: https://ai.google.dev/models/gemini

---

**Need Help?**

- 📧 Email: support@example.com
- 💬 Discord: [Join our community]
- 🐛 Issues: [GitHub Issues](https://github.com/pakistanimoon/e-tendering/issues)

Happy coding! 🚀