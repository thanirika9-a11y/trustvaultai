# 🔐 TrustVault AI

> AI-Powered Secure Document Vault — Store, Share, and Manage documents with Gemini AI intelligence.

![React Native](https://img.shields.io/badge/React_Native-0.86-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-57-black?logo=expo)
![Express.js](https://img.shields.io/badge/Express-5.x-green?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)

## ✨ Features

- 🗄️ **Secure Document Vault** — Upload, organize, and encrypt your documents
- 🤖 **AI Assistant** — Chat with Gemini AI to get insights about your documents
- 🔗 **Secure Sharing** — Share documents with other users via encrypted links
- 📊 **Analytics Dashboard** — Visual charts showing document statistics
- 🔔 **Smart Notifications** — Real-time alerts for shares, reminders, and security events
- ⏰ **Reminders** — Set and manage reminders for document renewals
- 📋 **Activity Log** — Complete audit trail of all your actions
- 🌙 **Dark Mode** — Beautiful dark/light theme toggle
- 🔒 **JWT Authentication** — Secure login with access/refresh token rotation
- ☁️ **Cloudinary Integration** — Cloud storage for document files
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) + React Native Web |
| Backend | Express.js 5 + Node.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| AI | Google Gemini API |
| Storage | Cloudinary |
| Auth | JWT (Access + Refresh tokens) |

## 📁 Project Structure

```
TrustVaultAI/
├── backend/
│   ├── config/        # DB connection, Cloudinary config
│   ├── controllers/   # Route handlers
│   ├── middleware/     # Auth, validation middleware
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express routes
│   ├── services/      # AI, email, encryption services
│   ├── utils/         # Helpers
│   └── server.js      # Entry point
│
├── frontend/
│   ├── components/    # Reusable UI components
│   ├── constants/     # Theme, colors
│   ├── context/       # Auth & Theme providers
│   ├── navigation/    # React Navigation setup
│   ├── screens/       # App screens (Home, Vault, AI, Profile, etc.)
│   ├── services/      # API service modules
│   ├── store/         # State management
│   └── App.js         # Entry point
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Google Gemini API key

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/TrustVaultAI.git
cd TrustVaultAI
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your environment variables in .env
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run web
```

The app will be available at `http://localhost:8081`

## 🔧 Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ENCRYPTION_KEY` | 32-byte encryption key |

## 🌐 Deployment

### Backend → Render.com

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add all environment variables from `.env.example`

### Frontend → Vercel

1. Import your GitHub repo on Vercel
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npx expo export --platform web`
4. Set **Output Directory** to `dist`
5. Set `EXPO_PUBLIC_API_URL` env var to your Render backend URL

## 📄 License

MIT License — see [LICENSE](frontend/LICENSE)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ using AI-assisted development
