#!/bin/bash

# AI SME Copilot - Dependency Installation Script
# This script installs all dependencies for the project

set -e  # Exit on error

echo "🚀 AI SME Copilot - Installing Dependencies"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm"
    exit 1
fi

# Check Flutter
if command_exists flutter; then
    FLUTTER_VERSION=$(flutter --version | head -n 1)
    print_success "Flutter is installed: $FLUTTER_VERSION"
else
    print_error "Flutter is not installed. Please install Flutter from https://flutter.dev/"
    exit 1
fi

# Check Supabase CLI
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_success "Supabase CLI is installed: $SUPABASE_VERSION"
else
    print_warning "Supabase CLI is not installed. Installing now..."
    npm install -g supabase
    print_success "Supabase CLI installed"
fi

echo ""
echo "✅ All prerequisites are met!"
echo ""

# Install Web Dashboard dependencies
echo "🌐 Installing Web Dashboard dependencies..."
echo ""
cd web
if [ -f "package.json" ]; then
    print_status "Running npm install..."
    npm install
    print_success "Web dashboard dependencies installed"
else
    print_error "package.json not found in web directory"
    exit 1
fi
cd ..

echo ""

# Install Mobile App dependencies
echo "📱 Installing Mobile App dependencies..."
echo ""
cd mobile
if [ -f "pubspec.yaml" ]; then
    print_status "Running flutter pub get..."
    flutter pub get
    print_success "Mobile app dependencies installed"
    
    print_status "Running code generation..."
    flutter pub run build_runner build --delete-conflicting-outputs
    print_success "Code generation completed"
else
    print_error "pubspec.yaml not found in mobile directory"
    exit 1
fi
cd ..

echo ""

# Setup environment files
echo "⚙️  Setting up environment files..."
echo ""

# Mobile environment
if [ ! -f "mobile/.env" ]; then
    if [ -f "mobile/env.example" ]; then
        print_status "Creating mobile/.env from template..."
        cp mobile/env.example mobile/.env
        print_warning "Please update mobile/.env with your actual credentials"
    fi
fi

# Web environment
if [ ! -f "web/.env.local" ]; then
    if [ -f "web/env.example" ]; then
        print_status "Creating web/.env.local from template..."
        cp web/env.example web/.env.local
        print_warning "Please update web/.env.local with your actual credentials"
    fi
fi

echo ""

# Initialize Supabase (optional)
echo "🗄️  Supabase Setup"
echo ""
print_status "Do you want to start Supabase locally now? (y/n)"
read -r START_SUPABASE

if [ "$START_SUPABASE" = "y" ] || [ "$START_SUPABASE" = "Y" ]; then
    print_status "Starting Supabase..."
    cd supabase
    supabase start
    print_success "Supabase started successfully"
    echo ""
    print_warning "IMPORTANT: Copy the API URL and Anon Key to your .env files"
    cd ..
fi

echo ""
echo "=========================================="
echo "🎉 Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update mobile/.env with your Supabase credentials"
echo "2. Update web/.env.local with your Supabase credentials"
echo "3. Run 'flutter run' in the mobile directory"
echo "4. Run 'npm run dev' in the web directory"
echo ""
echo "For more information, see QUICKSTART.md"
echo ""

