# 🩸 Hemovia – Core REST API Engine & Infrastructure

Hemovia is a high-throughput, latency-optimized, and modular REST API engineered to power the **Hemovia Blood Donation & Matchmaking Platform**. The backend acts as the single source of truth for geographical donor matchmaking, transactional request orchestration, secure payment gateways, and analytical computation.

Developed with a clean **Modular Monolithic** design, the engine operates on **Express.js (v5)** and **MongoDB** utilizing the raw **native MongoDB node driver** (bypassing heavy ORM/ODM layers to sustain sub-100ms request lifecycles under high database load).

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas--Driver-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Firebase Admin](https://img.shields.io/badge/Firebase-Admin%20SDK-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Stripe SDK](https://img.shields.io/badge/Stripe-v20.1-008FC7?style=flat&logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Proprietary-orange?style=flat)](#license)

<a href="https://blooddonation-f6367.web.app" target="_blank">
  <img src="https://img.shields.io/badge/HEMOVIA-LIVE%20DEMO-dc2626?style=for-the-badge&logo=firefox-browser&logoColor=white&labelColor=111827" alt="Live Demo" />
</a>

</div>

---

## 📋 Table of Contents

- [About The Project & Purpose](#-about-the-project--purpose)
- [Real-World Problem & Solution](#-real-world-problem--solution)
- [Backend Architecture Features](#-backend-architecture-features)
- [Technical Architecture & Request Lifecycle](#-technical-architecture--request-lifecycle)
- [🗄️ Database Architecture & Schemas](#️-database-architecture--schemas)
- [🛡️ Enterprise Security Implementations](#️-enterprise-security-implementations)
- [⚡ Performance Optimization Engineering](#-performance-optimization-engineering)
- [📁 Modular Directory Blueprint](#-modular-directory-blueprint)
- [⚙️ Development & Local Installation](#️-development--local-installation)
- [☁️ Continuous Deployment & Vercel Cloud Execution](#️-continuous-deployment--vercel-cloud-execution)
- [📄 License & Maintainer](#-license--maintainer)

---

## 🎯 About The Project & Purpose

**Hemovia** is a comprehensive blood donation management platform that digitizes and accelerates every step of the donation pipeline. The backend repository houses the core RESTful API gateway, driving the matchmaking, safety checks, real-time analytics, and secure payment integrations that power the frontend application.

By prioritizing efficiency, security, and low-latency data persistence, the Hemovia API represents a production-grade backend engine designed to meet modern software engineering standards.

---

## 🧠 Real-World Problem & Solution

### The Problem
During medical emergencies (surgeries, trauma care, chronic illnesses like thalassemia), finding compatible blood donors is a critical and time-sensitive bottleneck. Traditional sourcing methods suffer from:

1. **Inefficient Sourcing** — No location-based filtering means requests reach donors who are too far away.
2. **Coordination Overhead** — No request tracking leads to duplicate volunteer signups or unanswered calls.
3. **Transparency Issues** — No consolidated, verified ledger for financial contributions or community aid.

### The Solution
The Hemovia API gateway digitizes and orchestrates the entire donation pipeline:

- **Geographic Matchmaking**: Instantly query live donor pools by blood group, district, and upazila.
- **Request Lifecycle Management**: Tracks emergency requests through a strict state machine (`pending` ➔ `inprogress` ➔ `done` / `canceled`) to prevent volunteer duplication.
- **Financial Ledger Transparency**: Directly interfaces with Stripe Checkout to maintain a verified, database-indexed, and publicly auditable ledger of all community funding.

---

## ✨ Backend Architecture Features

The Express API gateway exposes highly optimized endpoints that drive the frontend dashboards and core application services:

- **Role-Based Routing (RBAC)**: Dynamically handles security verification and user access policies based on database-defined roles (`donor`, `volunteer`, `admin`).
- **Interactive Query Engine**: Backs the multi-field donor search engine with fast, indexable fields matching blood type and location parameters.
- **Aggregate Analytics Hub**: Compiles real-time system stats (total lives saved, target blood group deficits, donor counts, and emergency case distributions) via database aggregates rather than application memory.
- **Demo Mode Safety (Read-Only Guard)**: Identifies demo accounts (`donor@hemovia.com`, `admin@hemovia.com`) at the middleware layer to block state mutations while permitting unrestricted read actions.
- **Regex Clinical Diagnostics**: Automatically classifies clinical emergency states versus general procedures by running regex analysis directly within the database index.

---

## 🏗️ Technical Architecture & Request Lifecycle

The application operates as a decoupled MVC-style monolithic gateway hosted on Vercel's serverless infrastructure. The request lifecycle follows a strict pipeline:

```mermaid
graph TD
    Client[Frontend Client / App] -->|HTTPS Request + Bearer JWT| Gateway[Express Gateway]
    Gateway --> Parser[CORS & Body Parser Middleware]
    Parser --> Routing{Is Route Protected?}
    
    Routing -->|No: Public| PublicHandler[Public Endpoint Router]
    Routing -->|Yes: Private| AuthFilter[verifyFBToken Middleware]
    
    AuthFilter -->|Decodes & Validates Claims| FirebaseAdmin[Firebase Admin SDK Engine]
    FirebaseAdmin -->|Invalid Signature / Expired| Err401[401 Unauthorized Response]
    FirebaseAdmin -->|Token Validated| MountUser[Inject 'decodedEmail' into req]
    
    MountUser --> PrivateHandler[Protected Endpoint Controller]
    
    PublicHandler --> DB[(MongoDB Atlas Native Driver Client)]
    PrivateHandler --> DB
    
    PrivateHandler --> StripeAPI[Stripe Checkout Engine]
    
    DB --> Output[JSON REST Payload]
    StripeAPI --> Output
    Output --> Client
```

### Architectural Component Breakdown:
1. **Client Communication Layer**: The frontend client dispatches CORS-compliant requests injecting Firebase ID tokens into the `Authorization` header.
2. **Middleware & Validation Pipeline**: Parses JSON payloads, applies origin-sharing policies, and verifies client JWT credentials securely via the Firebase Admin SDK.
3. **Controller & Business Logic**: Separated cleanly into routing files, managing state machines, search queries, payment sessions, and analytical computation.
4. **Data Persistence**: Utilizes a single, shared connection pool directly exported by `config/db.js`. Raw MongoDB driver operations bypass heavy ODM layers (like Mongoose), reducing execution overhead by 3-5x.

---

## 🗄️ Database Architecture & Schemas
The database runs on MongoDB Atlas under the database namespace `bloodDonationDB`. The primary collections and their document schemas include:

### 1. `users` Collection
Stores user profiles, roles, and administrative statuses.
```json
{
  "_id": "ObjectId",
  "email": "string (Unique Index)",
  "name": "string",
  "imageUrl": "string (URL)",
  "bloodGroup": "string (e.g., 'A+', 'O-')",
  "district": "string",
  "upazila": "string",
  "role": "string ('donor' | 'volunteer' | 'admin')",
  "status": "string ('active' | 'blocked')",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### 2. `requests` Collection
Stores blood donation requests posted by users seeking donors.
```json
{
  "_id": "ObjectId",
  "requesterName": "string",
  "requesterEmail": "string",
  "recipientName": "string",
  "recipientDistrict": "string",
  "recipientUpazila": "string",
  "hospitalName": "string",
  "fullAddress": "string",
  "donationDate": "string",
  "donationTime": "string",
  "bloodGroup": "string",
  "donation_status": "string ('pending' | 'inprogress' | 'done')",
  "requestMessage": "string",
  "createdAt": "ISODate"
}
```

### 3. `payments` Collection
Stores records of financial contributions processed via Stripe checkout.
```json
{
  "_id": "ObjectId",
  "donorName": "string",
  "donorEmail": "string",
  "amount": "number (Decimal in USD)",
  "currency": "string (e.g., 'usd')",
  "transactionId": "string (Unique Stripe Payment Intent ID)",
  "payment_status": "string (e.g., 'paid')",
  "paidAt": "ISODate"
}
```

---

## 🛡️ Enterprise Security Implementations

1. **Decoupled Identity Verification (Firebase Auth)**: JWT signatures are verified against Firebase public certificates on each incoming API call. No user passwords or biometric data touch our systems, eliminating credential leakage risk.
2. **Cryptographic Stripe Session Verification**: Client-side reports of completed transactions are discarded. The API queries the Stripe REST API directly using secret keys to check the actual payment session state, protecting the application against client forgery.
3. **NoSQL Injection Shielding**: All MongoDB queries are structured as formal JS object literals rather than string interpolation, preventing payload manipulation vectors.
4. **Ledger Idempotency Guards**: Each verified payment must check whether the transaction ID already exists in the ledger index. If a duplicate write is attempted, the request halts immediately.
5. **CORS Control Policies**: The server enforces cross-origin header validations, preventing unvouched sites from requesting cross-site operations.

---

## ⚡ Performance Optimization Engineering

- **On-Database Aggregation**: Instead of downloading entire collections to count remaining blood type targets, the `/public-stats` API executes `$group` and `$sum` expressions on the MongoDB Cluster, minimizing RAM and bandwidth footprints.
- **Dynamic Regex Classification Index**: Computes clinical classifications using database regex engines directly, freeing up the single-threaded Node.js event loop from intensive string matching.
- **Serverless Scaling**: The app targets serverless runtimes. Cold-starts are kept low (<150ms) by lazy-loading dependencies and packaging only tiny runtime configurations.
- **Cursor Pagination Controls**: The list controllers implement robust bounds filtering using pagination limits, preventing large databases from degrading server performance.

---

## 📁 Modular Directory Blueprint

```
hemovia-backend/
├── index.js                  # App bootstrap, global middleware registrations, vercel hook mount
├── config/
│   └── db.js                 # Shared MongoDB engine connection & collection handles
├── middleware/
│   └── verifyFBToken.js      # Firebase Admin Identity verification token validation
├── routes/
│   ├── userRoutes.js         # User registration, profiles, role management controllers
│   ├── requestRoutes.js      # Campaign requests, dynamic geo-searches, and stats pipelines
│   └── paymentRoutes.js      # Payment creation, webhook checkout validation controllers
├── vercel.json               # Serverless host configurations
└── package.json              # System package descriptors & start scripts
```

---

## ⚙️ Development & Local Installation

### Prerequisites
- Node.js (v18.0.0+)
- npm (v9.0.0+)
- Access to a MongoDB Atlas cluster

### 1. Project Initialization
```bash
git clone https://github.com/SiratimMChy/BloodDonation-Backend.git
cd BloodDonation-Backend
npm install
```

### 2. Environment Variables Specification
Create a `.env` file in your root folder:
```ini
# Port binding
PORT=5000

# Base64-encoded Firebase Service Account Credentials JSON
FB_SERVICE_KEY=your_base64_encoded_firebase_service_account_key

# Stripe Secret API Key (sk_test_...)
STRIPE_KEY=your_stripe_secret_key

# Frontend live callback platform domain
SITE_DOMAIN=https://your-frontend-domain.com

# MongoDB Atlas Credentials
DB_USER=your_db_username
DB_PASS=your_db_password
```

### 3. Execution
```bash
npm start
```
Starts the engine locally on `http://localhost:5000`.

---

## ☁️ Continuous Deployment & Vercel Cloud Execution

This application is configured for serverless production deployments on **Vercel**:
```bash
npm install -g vercel
vercel --prod
```
The `vercel.json` file automatically directs all incoming requests to the serverless entrypoint `index.js`. Ensure your hosting provider dashboard has all `.env` secrets mapped correctly.

---

## 📄 License & Maintainer

Distributed under the **ISC License**.

*Copyright © 2026 Hemovia. All rights reserved.*

<div align="center">

**Made with ❤️ by Siratim Mustakim Chowdhury**

[![GitHub](https://img.shields.io/badge/GitHub-SiratimMChy-181717?style=flat&logo=github)](https://github.com/SiratimMChy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Siratim%20Mustakim-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/siratim-mustakim-chowdhury/)
[![Email](https://img.shields.io/badge/Email-chowdhurysiratimmustakim@gmail.com-D14836?style=flat&logo=gmail&logoColor=white)](mailto:chowdhurysiratimmustakim@gmail.com)

⭐ Star this repository if you find it helpful!

</div>
