import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// 1. DATABASE CONFIGURATIE (Neem deze handmatig over uit je config.php)
const dbConfig = {
  host: 'localhost',       
  user: 'markemannetje',
  password: 'mjerkie2014',
  database: 'markemannetje'
};

const db = await mysql.createPool(dbConfig);

io.on('connection', async (socket) => {
  console.log(`Gebruiker verbonden: ${socket.id}`);
  socket.join('hoofd_chatbox');

  // 2. GESCHIEDENIS OPHALEN (Aangepast aan jouw velden: Afk, Bericht, Datum)
  try {
    const [rows] = await db.query(
      'SELECT Afk as username, Bericht as message, Datum as timestamp FROM WKBerichten ORDER BY Datum DESC LIMIT 30'
    );
    const geschiedenis = rows.reverse();
    socket.emit('chat_geschiedenis', geschiedenis);
  } catch (err) {
    console.error('Fout bij ophalen geschiedenis:', err);
  }

  // 3. NIEUW BERICHT OPSLAAN (Aangepast aan jouw velden: Afk, Bericht)
  socket.on('groeps_bericht', async (data) => {
    try {
      // We vullen Id en Datum niet in, want Id is AUTO_INCREMENT en Datum krijgt automatisch CURRENT_TIMESTAMP
      await db.query(
        'INSERT INTO WKBerichten (Afk, Bericht) VALUES (?, ?)',
        [data.username, data.message]
      );

      socket.broadcast.to('hoofd_chatbox').emit('nieuw_bericht', {
        username: data.username,
        message: data.message,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Fout bij opslaan bericht:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Gebruiker verbroken: ${socket.id}`);
  });
});

httpServer.listen(3000, () => {
  console.log('Chatserver met WKBerichten database draait op poort 3000');
});