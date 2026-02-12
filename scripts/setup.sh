#!/bin/bash

# Ryze AI UI Generator - Setup Script
# This script helps you set up the project locally

set -e

echo " Ryze AI UI Generator Setup"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " Node.js is not installed. Please install Node.js 18 or later."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo " Node.js found: $NODE_VERSION"

# Check if pnpm is installed, if not suggest installation
if ! command -v pnpm &> /dev/null; then
    echo ""
    echo "  pnpm is not installed. Installing globally..."
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v)
echo " pnpm found: $PNPM_VERSION"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo " .env.local already exists"
    echo ""
    read -p "Do you want to update your API key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your  API key: " API_KEY
        echo "API_KEY=$API_KEY" > .env.local
        echo " API key updated"
    fi
else
    echo " Creating .env.local file..."
    echo ""
    read -p "Enter your  API key (get it from https://console.com): " API_KEY
    
    if [ -z "$API_KEY" ]; then
        echo "API key cannot be empty"
        exit 1
    fi
    
    echo "API_KEY=$API_KEY" > .env.local
    echo " .env.local created with your API key"
fi

echo ""
echo " Installing dependencies..."
pnpm install

echo ""
echo " Setup complete!"
echo ""
echo " Ready to start!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm dev"
echo "2. Open: http://localhost:3000"
echo "3. Describe your UI and watch the magic happen!"
echo ""
