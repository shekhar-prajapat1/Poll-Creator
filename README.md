# 📊 Poll Creator

A modern, full-stack polling and voting application built with **React**, **Node.js**, **Express**, and **MongoDB**.

## LIVE LINK : https://poll-creator-tiv7.vercel.app/
## 🚀 Features
- **Poll Creation**: Customizable questions and multiple options.
- **Voting System**: Simple, intuitive voting interface with duplicate prevention.
- **Live Results**: Real-time progress bars and percentage calculation.
- **Persistence**: Powered by **MongoDB Atlas** for reliable cloud storage.
- **Deployment Ready**: Optimized for **Vercel** and **Firebase App Hosting**.

## 🛠️ Tech Stack
- **Frontend**: Vite, React, Framer Motion, Lucide-React.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB Atlas.
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics.

## 📂 Project Structure
```text
├── frontend/         # React application (Vite)
├── backend/          # Express API server
├── vercel.json       # Vercel Services configuration
└── apphosting.yaml   # Firebase App Hosting configuration
```

## ⚙️ Setup & Installation

### Local Development
1. **Clone the repo**:
   ```bash
   git clone https://github.com/shekhar-prajapat1/Poll-Creator.git
   ```
2. **Environment Variables**:
   In `/backend`, create a `.env` file:
   ```env
   MONGODB_URI=your_mongodb_atlas_uri
   PORT=5000
   ```
3. **Run Backend**:
   ```bash
   cd backend && npm install && npm start
   ```
4. **Run Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```

## ☁️ Deployment

### Vercel
Connect your GitHub repository to Vercel. It will automatically detect the `vercel.json` and deploy both services. Ensure you add the `MONGODB_URI` to Vercel's environment variables.
