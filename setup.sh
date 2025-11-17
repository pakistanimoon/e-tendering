#!/bin/bash

# E-Tendering Platform Setup Script
# This script helps you set up the development environment

set -e

echo "========================================="
echo "E-Tendering Platform Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    print_info "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_info "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_info "✓ Docker found: $(docker --version)"
print_info "✓ Docker Compose found: $(docker-compose --version)"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://etendering:dev_password_123@postgres:5432/etendering_db

# Redis Configuration
REDIS_URL=redis://redis:6379

# MinIO Configuration
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT Configuration
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# Google Gemini API Configuration
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-1.5-pro

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
EOF
    
    print_info "✓ Created .env file"
    print_warning "Please edit .env and add your GOOGLE_API_KEY"
    
    # Prompt for Google API key
    read -p "Enter your Google API Key (or press Enter to skip): " api_key
    if [ ! -z "$api_key" ]; then
        sed -i.bak "s/GOOGLE_API_KEY=/GOOGLE_API_KEY=$api_key/" .env
        rm .env.bak 2>/dev/null || true
        print_info "✓ Google API Key configured"
    else
        print_warning "Skipped API key configuration. You can add it later in .env"
    fi
else
    print_info "✓ .env file already exists"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p frontend/build
mkdir -p data/postgres
mkdir -p data/minio
mkdir -p data/redis

print_info "✓ Directories created"

# Create init.sql for database
print_info "Creating database initialization script..."
cat > backend/init.sql << 'EOF'
-- Database initialization script
-- Creates extensions and initial setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (These will be created by SQLAlchemy migrations, but included here as backup)

COMMENT ON DATABASE etendering_db IS 'E-Tendering Platform Database';
EOF

print_info "✓ Database init script created"

# Function to start services
start_services() {
    print_info "Starting Docker services..."
    docker-compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_info "✓ Services started successfully"
        
        echo ""
        echo "========================================="
        echo "Services are now running!"
        echo "========================================="
        echo ""
        echo "Frontend:     http://localhost:3000"
        echo "Backend API:  http://localhost:8000"
        echo "API Docs:     http://localhost:8000/docs"
        echo "MinIO:        http://localhost:9001"
        echo ""
        echo "MinIO Credentials:"
        echo "  Username: minioadmin"
        echo "  Password: minioadmin123"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop:      docker-compose down"
        echo "========================================="
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_info "Running database migrations..."
    docker-compose exec backend alembic upgrade head || {
        print_warning "Migrations failed or not needed yet"
    }
}

# Function to create initial test data
create_test_data() {
    print_info "Would you like to create test data? (y/n)"
    read -p "Create test users and sample projects? " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec backend python -m app.scripts.create_test_data || {
            print_warning "Test data creation not available yet"
        }
    fi
}

# Main setup flow
print_info "Setup options:"
echo "1. Full setup (build and start all services)"
echo "2. Start existing services"
echo "3. Stop all services"
echo "4. Clean up (remove containers and volumes)"
echo "5. View logs"
echo "6. Exit"
echo ""
read -p "Select option (1-6): " option

case $option in
    1)
        print_info "Building and starting services..."
        docker-compose build
        start_services
        run_migrations
        create_test_data
        ;;
    2)
        start_services
        ;;
    3)
        print_info "Stopping services..."
        docker-compose down
        print_info "✓ Services stopped"
        ;;
    4)
        print_warning "This will remove all containers and volumes. Are you sure? (y/n)"
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker-compose down -v
            print_info "✓ Cleanup complete"
        fi
        ;;
    5)
        docker-compose logs -f
        ;;
    6)
        print_info "Exiting setup"
        exit 0
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

# Health check
print_info "Running health checks..."
sleep 5

# Check backend
if curl -s http://localhost:8000/health > /dev/null; then
    print_info "✓ Backend API is healthy"
else
    print_warning "Backend API is not responding yet. It may still be starting up."
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_info "✓ Frontend is accessible"
else
    print_warning "Frontend is not responding yet. It may still be starting up."
fi

echo ""
print_info "Setup complete! 🚀"
print_info "Check the documentation in README.md for more information"
echo ""