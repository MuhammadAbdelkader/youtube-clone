# Backend Architecture

This document outlines the Node.js REST API architecture for YouCube.

## High-Level Overview

The backend uses an Express.js framework backed by MongoDB (Mongoose) and Redis (Upstash) for performance optimizations.
It features strict validation schemas using `express-validator` and adheres to RESTful architectural principles.

## Video Streaming Pipeline

The most critical pathway in the API is the video streaming proxy. Rather than sending users a raw Cloudinary URL (which exposes the backend asset bucket), the backend acts as a streaming proxy.

### HTTP 206 Partial Content
1. **Interceptor**: The `GET /api/videos/stream/:id` endpoint intercepts incoming `Range` requests from the video player.
2. **Redis Cache**: It fetches the Cloudinary `videoUrl` directly from Redis using a `video:url:{id}` cache key to avoid querying the MongoDB cluster for every chunk request.
3. **Piping**: It instantiates an `https.get` request to Cloudinary and forwards the exact `Range` headers. The Cloudinary chunks are directly `.pipe()`'d into the Express response object.

### View Incrementing
The actual incrementing of the views counter has been decoupled from the stream. The client fires an asynchronous background `POST /api/videos/view/:id` request when a video is loaded to safely increment the MongoDB `$inc: { views: 1 }` counter.

## Authentication & Authorization

### JWT implementation
- **Access Tokens**: Short-lived (15m) JWTs returned in the JSON response body. The frontend stores these strictly in memory to prevent XSS exfiltration.
- **Refresh Tokens**: Long-lived (7d) JWTs stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- **OTP Verification**: Resend is used to issue 6-digit verification codes which are stored in Redis with a 300-second TTL.

## Caching Strategy

Redis is used to prevent MongoDB bottlenecks:
1. **Feed Cache**: The `GET /api/videos` paginated feed is cached using composite keys (e.g., `videos:feed:page1:limit10:catAll:langAll`).
2. **Invalidation**: Cache writes are tracked in a Redis Set (`videos:feed:active-keys`). Upon uploading, deleting, or updating a video, the server flushes this specific Set to ensure the UI updates in real-time.
