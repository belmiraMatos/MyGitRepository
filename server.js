var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.port || 1337;
var usersList = new Array;
var socketsList = new Array;

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/static/login.html');
});

// Handle user connection/disconnection
io.on('connection', function(socket) {
    console.log('A user has connected');
    socket.on('disconnect', function () {
        console.log('A user has disconnected');
        for (var i = 0; i < socketsList.length; i++) {
            if (socketsList[i] === socket) {
                console.log('Removing user ' + usersList[i]);
                io.emit('user-logout', usersList[i]);
                socketsList.splice(i, 1);
                usersList.splice(i, 1);
                break;
            }
        }
    });
    
    // Handle user login
    socket.on('login', function (loginName) {
        console.log('User named \'' + loginName + '\'' + ' has tried to log in');
        
        if (loginName.length <= 4) {
            console.log('Login has failed');
            socket.emit('login-failed');
            return;
        }

        for (var i = 0; i < usersList.length; i++) {
            if (loginName === usersList[i]) {
                console.log('Login has failed');
                socket.emit('login-failed');
                return;
            }
        }
        
        console.log('Login has succeded');
        socket.emit('login-success');
        socket.broadcast.emit('user-login', loginName);
        usersList.push(loginName);
        socketsList.push(socket);
    });

    socket.on('retrieve-logged-users', function () {
        var users = new Array;

        for (var i = 0; i < usersList.length; i++) {
            if (socketsList[i] != socket) {
                users.push(usersList[i]);
            }
        }
        socket.emit('logged-users', users);
    });

    socket.on('send-msg', function (destUser, fromUser, msg) {
        for (var i = 0; i < usersList.length; i++) {
            if (usersList[i] === destUser) {
                socketsList[i].emit('msg-received', fromUser, msg);
                break;
            }
        }
    });
});

http.listen(port, function () {
    console.log('Listening on port ' + port);
});