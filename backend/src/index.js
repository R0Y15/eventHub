const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const { uploadToCloudinary } = require('./utils/cloudinary');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// Configure CORS
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://swissmote.vercel.app',
        'https://ef-cth.vercel.app',
        /\.vercel\.app$/
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    maxHttpBufferSize: 1e8
});

// Debug socket connections
io.engine.on("headers", (headers, req) => {
    console.log('Socket headers:', headers);
});

io.engine.on("initial_headers", (headers, req) => {
    console.log('Socket initial headers:', headers);
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Image upload route
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Log file details for debugging
        console.log('Received file:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
        });
        
        try {
            const imageUrl = await uploadToCloudinary(req.file);
            console.log('Upload successful:', imageUrl);
            res.json({ imageUrl });
        } catch (cloudinaryError) {
            console.error('Cloudinary upload error:', cloudinaryError);
            res.status(500).json({ 
                error: 'Failed to upload image to cloud storage',
                details: cloudinaryError.message 
            });
        }
    } catch (error) {
        console.error('Upload handling error:', error);
        res.status(500).json({ 
            error: 'Failed to process image upload',
            details: error.message 
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Debug connection details
    console.log('Transport used:', socket.conn.transport.name);
    console.log('Headers:', socket.handshake.headers);
    
    // Join admin room if user is admin
    socket.on('joinAdminRoom', () => {
        socket.join('admin-room');
        console.log(`Admin joined room: ${socket.id}`);
        socket.emit('roomJoined', { room: 'admin-room' });
    });

    // Join user room
    socket.on('joinUserRoom', () => {
        socket.join('user-room');
        console.log(`User joined room: ${socket.id}`);
        socket.emit('roomJoined', { room: 'user-room' });
    });

    socket.on('disconnect', (reason) => {
        console.log('User disconnected:', socket.id, 'Reason:', reason);
        socket.leaveAll();
    });

    socket.on('error', (error) => {
        console.error('Socket error for client:', socket.id, 'Error:', error);
    });
});

// Socket.io error handling with reconnection logic
io.engine.on("connection_error", (err) => {
    console.log('Socket connection error:', err);
    // If WebSocket fails, allow polling
    if (io.opts.transports.indexOf('polling') === -1) {
        io.opts.transports.push('polling');
    }
});

// Basic route
app.get('/', (req, res) => {
    res.send('Event Management API is running');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});