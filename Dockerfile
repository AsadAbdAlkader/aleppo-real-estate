# Multi-stage Dockerfile for Aleppo Real Estate Platform

# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM node:22-alpine AS build-frontend
WORKDIR /app/client
COPY src/Web/ClientApp/package*.json ./
RUN npm ci
COPY src/Web/ClientApp/ ./
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Build & Publish ASP.NET Core Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-backend
WORKDIR /app
COPY AleppoRealEstate.slnx ./
COPY src/Domain/Domain.csproj src/Domain/
COPY src/Application/Application.csproj src/Application/
COPY src/Infrastructure/Infrastructure.csproj src/Infrastructure/
COPY src/Web/Web.csproj src/Web/
COPY tests/Application.UnitTests/Application.UnitTests.csproj tests/Application.UnitTests/

RUN dotnet restore AleppoRealEstate.slnx

COPY src/Domain/ src/Domain/
COPY src/Application/ src/Application/
COPY src/Infrastructure/ src/Infrastructure/
COPY src/Web/ src/Web/
COPY tests/Application.UnitTests/ tests/Application.UnitTests/

# Copy pre-built frontend from stage 1 to wwwroot
COPY --from=build-frontend /app/client/dist/ClientApp/browser/ src/Web/wwwroot/

# Publish backend
WORKDIR /app/src/Web
RUN dotnet publish Web.csproj -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# Stage 3: Final Production Runtime
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Ensure uploads directory exists
RUN mkdir -p /app/wwwroot/uploads/properties

COPY --from=build-backend /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Web.dll"]
