FROM node:20-bookworm-slim

WORKDIR /opt/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Railway injects PORT at runtime. Do not hardcode EXPOSE as the public target.
CMD ["npm", "run", "start"]
