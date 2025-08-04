🧠 Niria: AI-Powered Eye Health Platform
<div align="center"> <img src="https://storage.googleapis.com/felipec-_bucket/Artboard%207-8.png" alt="Niria Logo" width="180" /> <h3><strong>The future of eye care begins with a photo.</strong></h3> <p> A web-based AI-powered platform that provides a preliminary analysis of eye health and bridges users to professional care. </p> </div>
<p align="center"> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" /> <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" /> <img src="https://img.shields.io/badge/Google_Gemini-8E75B4?style=for-the-badge&logo=google-gemini&logoColor=white" /> </p>
✨ Key Features
Feature	Description
📸 AI Analysis	Uses AI to analyze eye photos and generate insightful visual health summaries.
🌐 Multi-language Support	Fully localized in English, Spanish, and Chinese with a scalable i18n architecture.
🌗 Light/Dark Mode	Responsive and user-preferred UI themes.
🔐 Secure Auth	Email/Password and Google OAuth sign-in via Firebase.
🧾 Health Questionnaire	Multi-step, dynamic survey to collect essential clinical context.
📷 Image Capture & Guide	Upload or take eye photos directly with on-screen guides.
📄 PDF Reports	Generate downloadable reports with AI results and local ophthalmologist suggestions.
💳 Stripe Payments	Secure one-time payments through Firebase Cloud Functions.
👥 Role-Based Access Control	Firebase custom claims for Patients, Doctors, HR Admins, and Super Admins.
⚙️ Admin Dashboard	Manage users, roles, feedback, and view platform analytics.
🩺 Doctor Portal	Secure portal for professionals to add notes and diagnoses.
🏢 HR Panel	Track employee wellness evaluations, team status, and compliance.
🔔 Reminders	In-app medication and appointment notification system.

🚀 Tech Stack
Frontend

React + TypeScript

Tailwind CSS

Backend & Infrastructure

Firebase (Auth, Firestore, Cloud Functions, Storage)

Stripe (via Firebase Functions)

Google Gemini API (AI-based image analysis)

NPPES API (U.S. doctor locator)

Libraries

jspdf + html2canvas for PDF reports

browser-image-compression for optimizing uploads

📁 Project Structure
bash
Copy
Edit
/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   ├── constants.tsx           # SVG icons and constants
│   ├── contexts/               # Theme & language contexts
│   ├── data/                   # Static data like locations
│   ├── hooks/                  # Custom React hooks
│   ├── localization/           # en.ts, es.ts, zh.ts
│   ├── pages/                  # Page-level components
│   ├── services/               # Business logic (auth, firestore, gemini)
│   ├── types.ts                # TypeScript type definitions
│   ├── App.tsx                 # Root component
│   ├── index.tsx               # Entry point
│   └── firebase.ts             # Firebase config
└── functions/                  # Cloud Functions backend
🛠️ Getting Started
Prerequisites
Node.js (v18+)

npm or yarn

Firebase CLI

Installation
bash
Copy
Edit
git clone https://github.com/your-username/niria-app.git
cd niria-app
npm install
Setup Environment
Create a .env file in the root directory and fill in your Firebase and API credentials:

env
Copy
Edit
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=yourapp
REACT_APP_FIREBASE_STORAGE_BUCKET=yourapp.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Gemini API Key
API_KEY=...
Running the App
bash
Copy
Edit
npm start
App will be available at: http://localhost:3000

Cloud Functions
bash
Copy
Edit
cd functions
npm install
firebase functions:config:set stripe.secret_key="sk_test_..."
cd ..
firebase deploy --only functions
☁️ Firebase Setup Guide
Go to Firebase Console

Create a new project

Enable:

Authentication (Email/Password, Google)

Firestore Database

Cloud Storage

Cloud Functions

Don’t forget to set up Firestore Security Rules for production environments!

🤝 Contributing
We welcome contributions!
To contribute:

Fork the repository

Create a branch: git checkout -b feature/my-feature

Commit your changes: git commit -m 'Add feature'

Push to your fork: git push origin feature/my-feature

Open a Pull Request

📜 License
This project is licensed under the MIT License – see the LICENSE file for details.

