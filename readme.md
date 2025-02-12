# SwissMote - Event Management System

## Overview
SwissMote is a real-time event management system built with Next.js and Node.js. It allows users to create, manage, and participate in various events while providing administrators with powerful tools to oversee all activities.

## Features

### For Users
- 👥 User registration and authentication
- 📅 Browse upcoming and past events
- 🎫 Register/unregister for events
- 🔍 Search and filter events by category
- 📱 Responsive design for all devices
- 🔄 Real-time updates for event changes

### For Admins
- 👑 Comprehensive admin dashboard
- ✅ Approve/reject event submissions
- 📊 Manage event attendees
- 🚫 Enable/disable events
- 📝 Edit event details
- 👁️ View detailed event analytics

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- TailwindCSS
- Socket.io-client
- Shadcn UI Components

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.io
- JWT Authentication

## Prerequisites
- Node.js >= 18.0.0
- MongoDB
- npm or yarn

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_PATH=/socket.io
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/swissmote.git
cd swissmote
```

2. Install Backend Dependencies
```bash
cd backend
npm install
```

3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

4. Start the Backend Server
```bash
cd backend
npm run dev
```

5. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

### Events
- GET /api/events - Get all events
- POST /api/events - Create new event
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event
- POST /api/events/:id/register - Register for event
- POST /api/events/:id/unregister - Unregister from event
- POST /api/events/:id/approve - Approve event (admin only)
- POST /api/events/:id/toggle-status - Toggle event status (admin only)

## Real-time Features
- Live event updates
- Instant registration notifications
- Real-time attendee management
- Admin dashboard updates

## Deployment

### Backend
- Supports deployment on Railway, Render, or any Node.js hosting
- Requires MongoDB database
- Set up environment variables

### Frontend
- Optimized for Vercel deployment
- Static file optimization
- API route handling

## Contributing
Feel free to submit issues and enhancement requests.

## License
This project is licensed under the MIT License.
