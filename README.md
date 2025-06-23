# Multi-Vendor Data Fetch Service 🛠️

A robust, microservices-based Node.js application for fetching data from multiple vendors with synchronous and asynchronous response handling. This project abstracts vendor-specific complexities into a unified internal API, ensuring seamless integration for frontend teams while respecting vendor rate limits and cleaning sensitive data.

## 📖 Overview

The **Multi-Vendor Data Fetch Service** provides a clean interface for submitting data requests to external vendors, processing responses, and storing results in MongoDB. It handles both synchronous and asynchronous vendor responses, enforces rate limits, and ensures reliable job processing using a queue-based architecture. The system is containerized with Docker and uses Redis for queuing.

Key features:
- **Unified API**: Simplifies vendor interactions for internal teams.
- **Rate Limit Handling**: Respects vendor-specific request limits.
- **Data Cleaning**: Removes PII and trims strings before storage.
- **Scalable Design**: Microservices architecture with Docker Compose.
- **Reliable Processing**: Background workers and webhook handling for async responses.

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Queue**: Redis with BullMQ
- **Database**: MongoDB
- **HTTP Client**: Axios for vendor communication
- **Containerization**: Docker and Docker Compose
- **Mock Vendors**: Simulated sync and async vendor services

## 🏗️ Architecture

+-------------+       +-------------+       +-------------+
|  API Server |<----->|  Worker     |<----->|  MongoDB    |
| (port 4000) |       | (BullMQ)    |       | (port 27017)|
+-------------+       +-------------+       +-------------+
|                     ^                     |
v                     |                     |
+-------------+       +-------------+       +-------------+
|  Webhook    |<------|  Redis      |       |  Vendor Mocks |
| (port 4002) |       | (port 6379) |       | (5001, 5002)  |
+-------------+       +-------------+       +-------------+


- **API Server**: Handles POST `/jobs` and GET `/jobs/{request_id}` endpoints.
- **Worker**: Processes jobs from Redis queue, calls vendors, and stores results.
- **Webhook**: Receives async vendor callbacks and updates job status.
- **Vendor Mocks**: Simulate external vendors (sync and async).
- **MongoDB**: Stores job metadata and cleaned results.
- **Redis**: Manages job queues with BullMQ.

## 🚀 Quick Start

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd multi-vendor-data-fetch
   ```
2. **Build and Run**
   ```bash
   docker-compose up --build
   ```
3. **Access Services**
  -API: http://localhost:4000
  -Webhook: http://localhost:4002
  -Sync Vendor: http://localhost:5001
  -Async Vendor: http://localhost:5002
4. **Stop Services**
   ```bash
   docker-compose down
   ```
# 🧪 Testing the Application
**Submit a Job**
```bash
curl -X POST http://localhost:4000/jobs -H "Content-Type: application/json" -d '{"vendor":"sync","data":"example payload"}'
```
**Response**
```json
{"request_id": "<uuid>"}
```
**Check the job status**
```bash
curl http://localhost:4000/jobs/<request_id>
```
**Response (if complete):**
```json
{"status": "complete", "result": {...}}
```
**Response (if processing):**
```json
{"status": "processing"}
```
**Async Vendor Webhook**
  -Async vendor responses are sent to:
  ```bash
    curl -X POST http://localhost:4002/vendor-webhook/async -H "Content-Type: application/json" -d '{"request_id": "<uuid>", "data": {...}}'
  ```
# 📂 Project Structure
```text
multi-vendor-data-fetch/
├── app/                 # API server (Node.js + Express)
│   ├── Dockerfile
│   └── index.js
├── worker/              # Background job processor (BullMQ)
│   ├── Dockerfile
│   └── index.js
├── webhooks/            # Webhook handler for async vendor callbacks
│   ├── Dockerfile
│   └── index.js
├── vendor-mocks/        # Mock vendor services
│   ├── sync.js
│   └── async.js
├── docker-compose.yml   # Docker Compose configuration
└── README.md             # Project documentation
```
# 🆕 Adding New Vendors or Vendors
**1. New Vendor:**
  - Add a new mock in vendor-mocks/ (e.g., new-vendor.js).
  - Update worker/index.js to handle the new vendor’s rate limits and response format.
  - If async, ensure the webhook endpoint supports the new vendor.
**2. New Feature:**
  - Extend the API in app/index.js for new endpoints.
  - Add new job types to the worker in worker/index.js.
  - Update MongoDB schemas if needed in app/ or worker/.
**3. Scaling**
  - Increase worker instances in docker-compose.yml
  ```yaml
  worker:
    scale: 2
  ```
  - Adjust Redis and MongoDB configurations for high load.
# 📊 Load Test
A load test script using k6 is included in load-test.js. To run:
```bash
k6 run load-test.js
```
Results Summary:

Tested with 200 concurrent users for 60 seconds.
Mixed POST /jobs and GET /jobs/{request_id} requests.
Observations: API response times stayed under 200ms; async jobs completed reliably via webhook. Tuned Redis connection pool to handle high concurrency.

# 🔧 Key Design Decisions
- BullMQ for Queuing: Chosen for its robust retry mechanism and Redis integration, ensuring reliable job processing.
- Microservices: Separates API, worker, and webhook for scalability and fault isolation.
- Rate Limiting: Implemented in the worker using a token-bucket algorithm to respect vendor limits.
- MongoDB: Used for flexible schema design to handle varied vendor response formats.
- Docker Compose: Simplifies development and deployment with a single command.

**Trade-offs:**

- Redis vs. Kafka: Chose Redis for simplicity and low latency, though Kafka might be better for very high throughput.
- Single Worker Process: Sufficient for the test, but multiple workers can be scaled for production.
  No Circuit Breaker: Omitted for simplicity; could be added for production to handle vendor failures.
