const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

io.on("connection", (socket) => {
    console.log(socket.id, 'connected...');
    socket.on('send-location', (data) => {
        io.emit('location-update', { id: socket.id, ...data });
    });
    socket.on('disconnect', () => {
        io.emit('user-disconnected', socket.id);
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});