# FluxStack Docker Deployment Options

## 🚀 Quick Start (Recommended for Development)

```bash
# Simple microservices (no load balancer)
docker-compose -f docker-compose.simple.yml up --build

# Access:
# Frontend: http://localhost:8080
# API: http://localhost:3001
# Database: localhost:5432
```

## 📋 Available Architectures

### 1. **Monolithic** (All-in-one)
```bash
docker-compose up --build
# Everything at: http://localhost:3000
```

### 2. **Simple Microservices** (Recommended)
```bash
docker-compose -f docker-compose.simple.yml up --build
# Frontend: http://localhost:8080
# API: http://localhost:3001
```

### 3. **Enterprise Microservices** (with Load Balancer)
```bash
docker-compose -f docker-compose.microservices.yml up --build
# Unified access: http://localhost:3000
# Load balancer routes /api/* to backend, /* to frontend
```

### 4. **Individual Services**
```bash
# Backend only
docker build -f Dockerfile.backend -t fluxstack-backend .
docker run -p 3001:3001 fluxstack-backend

# Frontend only  
docker build -f Dockerfile.frontend -t fluxstack-frontend .
docker run -p 8080:80 fluxstack-frontend
```

## 🎯 When to Use Each

| Architecture | Use Case | Pros | Cons |
|-------------|----------|------|------|
| **Monolithic** | Small projects, prototyping | Simple, fast development | Single point of failure |
| **Simple Microservices** | Most development scenarios | Clean separation, direct access | Manual routing |
| **Enterprise** | Production, complex routing | Unified access, SSL, scaling | More complexity |
| **Individual** | Testing, CI/CD pipelines | Maximum flexibility | Manual orchestration |

## 🔧 Adding Load Balancer Later

If you start with simple microservices and want to add load balancing:

1. Copy `nginx-lb.conf` and customize routing rules
2. Add nginx service to your docker-compose:
```yaml
nginx-lb:
  image: nginx:alpine
  ports:
    - "3000:80"
  volumes:
    - ./nginx-lb.conf:/etc/nginx/conf.d/default.conf
```

## 🌐 Network Access

- **Development**: Use `docker-compose.simple.yml`
- **External access**: Services bind to `0.0.0.0` by default
- **CORS**: Configure your specific IPs in backend environment variables
- **Custom IPs**: Add your network IP to CORS_ORIGINS for external access

## 📊 Resource Usage

| Mode | Containers | Memory | Startup Time |
|------|-----------|---------|--------------|
| Monolithic | 1 | ~200MB | ~10s |
| Simple | 3 | ~400MB | ~15s |
| Enterprise | 4 | ~500MB | ~20s |