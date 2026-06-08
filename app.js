const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const Socket = require('socket.io');
const Server = http.Server(app);
const io = Socket(Server)

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

io.on("connection",(socket) => {
    console.log("Server");
})

app.get("/",(req,res)=>{
    res.render("index");
});

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})