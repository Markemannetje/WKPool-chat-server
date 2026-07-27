import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// Flexibele CORS voor Express
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

const httpServer = createServer(app);

// Verbeterde CORS specifiek voor Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.on('connection', (socket) => {

  console.log(`Gebruiker verbonden via socket: ${socket.id}`);

  // Iedereen gaat direct in de hoofdchatbox
  socket.join('hoofd_chatbox');


  // -----------------------------
  // Nieuw chatbericht
  // -----------------------------
  socket.on('groeps_bericht', (data) => {

    console.log(`Live bericht ontvangen van ${data.username}: ${data.message}`);

    socket.broadcast.to('hoofd_chatbox').emit('nieuw_bericht', {
      username: data.username,
      message: data.message,
      timestamp: data.timestamp || new Date()
    });

  });


  // -----------------------------
  // Iemand is aan het typen
  // -----------------------------
  socket.on('typing', (data) => {

    socket.broadcast.to('hoofd_chatbox').emit('typing', data);

  });


  // -----------------------------
  // Iemand is gestopt met typen
  // -----------------------------
  socket.on('stop_typing', () => {

    socket.broadcast.to('hoofd_chatbox').emit('stop_typing');

  });


  socket.on('disconnect', () => {

    console.log(`Gebruiker verbroken: ${socket.id}`);

  });

});

// Start de server op poort 3000 (of de poort die Render toewijst)
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Chatserver draait succesvol op poort ${PORT}`);
});
