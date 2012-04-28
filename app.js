
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
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



var sio = io.listen(app),
    buffer = [];
  
sio.on('connection', function(socket){
    console.log('A socket with sessionID ' + socket.handshake.sessionID + ' connected!');  
  if (GAME.playHistory.length > 0) socket.send({playHistory : GAME.playHistory});
  socket.send({ buffer: buffer });
  sio.sockets.emit({ announcement: socket.handshake.sessionId + ' connected' });
  
  socket.on('message', function(message){
  if (message.moveType) {
    // *** validate the move,
    // at least make sure the move from is from the right session
    sio.sockets.emit(message);
    GAME.makeMove(message);
  } else {
      var msg = { message: [socket.handshake.sessionId, message] };
      buffer.push(msg);
      if (buffer.length > 15) buffer.shift();
      sio.sockets.emit(msg);
  }
  });

  socket.on('disconnect', function(){
    sio.sockets.emit({ announcement: socket.handshake.sessionId + ' disconnected' });
  });
});
