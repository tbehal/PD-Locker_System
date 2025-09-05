#!/bin/bash

# SonarQube Analysis Script
echo "🚀 Starting SonarQube Analysis for Smart Lab Availability Manager"

# Check if SonarQube is running
echo "📋 Checking if SonarQube is running..."
if ! curl -s http://localhost:9000 > /dev/null; then
    echo "❌ SonarQube is not running. Please start it first with:"
    echo "   docker-compose -f docker-compose.sonar.yml up -d"
    echo ""
    echo "⏳ Waiting for SonarQube to be ready..."
    exit 1
fi

echo "✅ SonarQube is running on http://localhost:9000"

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo "📦 Installing sonar-scanner..."
    if command -v npm &> /dev/null; then
        npm install -g sonarqube-scanner
    else
        echo "❌ npm not found. Please install Node.js first."
        exit 1
    fi
fi

# Run the analysis
echo "🔍 Running SonarQube analysis..."
sonar-scanner \
    -Dsonar.projectKey=schedulingapp \
    -Dsonar.sources=frontend/src,backend/src \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.login=admin \
    -Dsonar.password=admin

echo ""
echo "🎉 Analysis complete! Check results at: http://localhost:9000"
echo "📊 Default credentials: admin/admin"



