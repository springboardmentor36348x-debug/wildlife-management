# Milestone 4 - Final Integration, Testing & Deployment (FR-14):
# Docker containerization of the React frontend.
#
# Multi-stage build: stage 1 compiles the Vite production bundle (needs
# Node), stage 2 serves the static output with nginx (small runtime image,
# no Node/npm left in the final image).
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Baked in at build time. docker-compose.yml overrides this to point at
# the backend service name so the two containers can talk to each other.
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
