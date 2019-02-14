const express = require('express');
const app = express();
const http = require('http').Server(app);

// set public directory
app.use(express.static(__dirname));

// serve page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('Visit the UI at http://localhost:3000');
});