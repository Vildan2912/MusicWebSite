const mysql = require("mysql2");
const cors = require('cors')
const express = require('express');
const app = express();

const connection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  database: "MYZon_db",
  charset: "utf8mb4",
  password: "rootpassword"
});

connection.connect(function(err) {
  if (err) {
    return console.error("DB connection error: " + err.message);
  }
  else {
    console.log("Successfully connected to DB");
  }
});


app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
}))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/auth/register', (req,res) => {
  //req = { "username": "Иван", "email": "ivan@mail.ru", "password": "123456", "confirmPassword": "123456" }
  res.json( { "success": true, "data": { "message": "Регистрация прошла успешно!", "user": { "id": 1, "email": "ivan@mail.ru", "username": "Иван" } } })
})

app.post('/api/auth/login', (req,res) => {
  //req = { "email": "ivan@mail.ru", "password": "123456" }
  res.json({ "success": true, "data": { "token": "jwt_token...", "user": { "id": 1, "email": "ivan@mail.ru", "username": "Иван", "role": "listener" } } })
})

app.get('/api/tracks', (req,res) => {
  res.json([ { "id": 1, "title": "Carefree", "artist": "Kevin MacLeod", "genre": "pop", "duration": "3:25", "cover": "/assets/covers/cover.jpg", "audioUrl": "/assets/music/track1.mp3" } ])
})

app.get('/api/tracks/:id', (req, res) => {
    const id = Number(req.params.id)
    
    const tracks = [
    { "id": 1, "title": "Carefree", "artist": "Kevin MacLeod", "genre": "pop", "duration": "3:25", "cover": "/assets/covers/cover.jpg", "audioUrl": "/assets/music/track1.mp3"},
    { "id": 2, "title": "Carefree", "artist": "Kevin MacLeod", "genre": "pop", "duration": "3:25", "cover": "/assets/covers/cover.jpg", "audioUrl": "/assets/music/track2.mp3"}
    ]
    
    const requestedTrack = tracks.find((product) => product.id === id)
    res.json(requestedTrack)
});

app.listen(3000, () => {
    console.log('Server listening on port 3000')
});

connection.query("SELECT * FROM users",
  function(err, results, fields) {
    console.log(err);
    console.log(results); // собственно данные
    console.log(fields); // мета-данные полей 
});


connection.end(function(err){ 
  if (err) {
    return console.error("DB Disconnection error: " + err.message);
  }
  console.log("Connection terminated");
});