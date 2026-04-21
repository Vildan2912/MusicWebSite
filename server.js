const cors = require('cors')
const express = require('express');
const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
}))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/mess', (req, res) => {
  res.json({message:'Hello there!'});
});

app.get('/tracks/:id', (req, res) => {
    const id = Number(req.params.id)
    
    const tracks = [
    { id: 1, name: "music1", file: "https//somesite"},
    { id: 2, name: "music2", file: "https//someothersite"}
    ]
    
    const requestedTrack = tracks.find((product) => product.id === id)
    res.json(requestedTrack)
});

app.listen(3000, () => {
    console.log('Server listening on port 3000')
});

