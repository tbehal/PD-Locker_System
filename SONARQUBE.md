# SonarQube Analysis Guide

This guide explains how to run SonarQube code quality analysis on the Smart Lab Availability Manager project.

## Prerequisites

- Docker and Docker Compose installed
- Node.js v20+ (already configured in this project)
- Git (for version control integration)

## Option 1: Simple SonarQube Setup (Recommended)

### 1. Start SonarQube
```bash
docker-compose -f docker-compose.sonar-simple.yml up -d
```

### 2. Wait for SonarQube to be ready
SonarQube takes a few minutes to start up. You can check if it's ready by visiting:
http://localhost:9000

### 3. First-time setup
- Navigate to http://localhost:9000
- Login with default credentials: `admin` / `admin`
- You'll be prompted to change the password
- Create a new project with key: `schedulingapp`

### 4. Run the analysis
```bash
./run-sonar.sh
```

## Option 2: Full SonarQube Setup (with PostgreSQL)

### 1. Start SonarQube with database
```bash
docker-compose -f docker-compose.sonar.yml up -d
```

### 2. Wait for services to be ready
Both SonarQube and PostgreSQL need time to start up.

### 3. Run analysis
```bash
./run-sonar.sh
```

## Option 3: Manual SonarQube Scanner

If you prefer to run the scanner manually:

### 1. Install sonar-scanner
```bash
npm install -g sonarqube-scanner
```

### 2. Run analysis
```bash
sonar-scanner \
  -Dsonar.projectKey=schedulingapp \
  -Dsonar.sources=frontend/src,backend/src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_LOGIN \
  -Dsonar.password=YOUR_PASSWORD
```

## What SonarQube Analyzes

- **Code Quality**: Code smells, complexity, maintainability
- **Security**: Security vulnerabilities and hotspots
- **Reliability**: Bugs and potential issues
- **Maintainability**: Technical debt and code duplication
- **Coverage**: Test coverage (if tests exist)
- **Duplications**: Code duplication detection

## Configuration Files

- `sonar-project.properties`: Main SonarQube configuration
- `qodana.yaml`: Qodana configuration (JetBrains' code quality platform)
- `docker-compose.sonar*.yml`: Docker configurations for SonarQube

## Stopping SonarQube

```bash
# For simple setup
docker-compose -f docker-compose.sonar-simple.yml down

# For full setup
docker-compose -f docker-compose.sonar.yml down
```

## Troubleshooting

### SonarQube won't start
- Check if port 9000 is available
- Ensure Docker has enough memory (at least 4GB recommended)
- Check Docker logs: `docker logs sonarqube-simple`

### Analysis fails
- Verify SonarQube is running and accessible
- Check if project key exists in SonarQube
- Ensure correct login credentials

### Performance issues
- Increase Docker memory allocation
- Use the simple setup for development
- Consider running analysis in CI/CD pipeline

## Integration with CI/CD

You can integrate SonarQube analysis into your CI/CD pipeline by:

1. Adding the analysis step to your workflow
2. Using SonarQube Quality Gates
3. Failing builds on quality issues
4. Generating reports for stakeholders

## Next Steps

After running your first analysis:
1. Review the quality report
2. Address critical and major issues
3. Set up quality gates
4. Configure automated analysis in your workflow



