
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , GAME = require('./public/javascripts/gamelogic.js')  ;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/game', routes.game);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = sio.listen(app)
  , buffer = []
  , playerID = 0;
  
io.sockets.on('connection', function(socket){
  if (GAME.playHistory.length > 0) socket.emit('move', {playHistory : GAME.playHistory});
  socket.emit('message', { buffer: buffer });
  socket.playerID = playerID++;
  socket.broadcast.emit('message', { announcement: socket.playerID + ' connected' });
  
  socket.on('message', function(message) {
    var msg = { message: [socket.playerID, message] };
    buffer.push(msg);
    if (buffer.length > 15) buffer.shift();
    socket.broadcast.emit('message', msg);
  });

  socket.on('move', function(move) {
      // *** validate the move,
      // at least make sure the move from is from the right session
      socket.broadcast.emit('move', move);
      GAME.makeMove(move);
  });


  socket.on('disconnect', function(){
    io.sockets.emit({ announcement: socket.playerID + ' disconnected' });
  });
});
