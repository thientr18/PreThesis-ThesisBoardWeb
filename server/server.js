const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 8080;

const socketIO = require('socket.io');
const http = require('http');

const router = require('./routes/index');
const { syncModels } = require('./app/models');
const connectMongo = require('./app/configs/mongoDB');
const initSocket = require('./app/utils/notificationSocket');

const app = express();

app.use(express.static(path.join(__dirname, '../client/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Initialize and store the socket service
const socketService = initSocket(io);
app.set('socketService', socketService); 

router(app);

// Connect to MongoDB
connectMongo();

// syncModels() will connect and create tables to the MySQL database
syncModels();

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
