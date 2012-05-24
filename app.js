
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io');

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
app.get('/game', function(req, res) {
  //if :id is missing then generate an id - get the _id from mongo for the game?
  //*** change the id generation since this can cause collisions
  res.redirect('/game/' + Math.floor(Math.random()*1000000));
});

//*** replace rooms with something from the database
var games = {};

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = sio.listen(app)
  , playerID = 0;

app.get('/game/:id', function(req, res) {
  console.log(req.params.id);
  //create game if not in memory (should just pull from mongodb)
  if (!games['game' + req.params.id]) {
    var game = {};
    game.id = req.params.id;
    game.mem = require('./public/javascripts/gamelogic.js');
    game.socket = io.of('/' + game.id).on('connection', function(socket) {
      if (game.mem.playHistory.length > 0) socket.emit('move', {playHistory : game.mem.playHistory});
      socket.playerID = playerID++; //*** player ID should be replaced by the socket session
                                    //    or something else
      
      socket.on('move', function(move) {
          // *** validate the move in GAME object,
          // make sure the move from is from the right session
          socket.broadcast.emit('move', move);
          game.mem.makeMove(move);
      });

    });

    games['game' + req.params.id] = game;
  }

  res.render('game', { title: 'Quarto', gameId: req.params.id });
});
  
// io.sockets.on('connection', function(socket){
//   if (GAME.playHistory.length > 0) socket.emit('move', {playHistory : GAME.playHistory});
//   socket.playerID = playerID++;
  
//   socket.on('move', function(move) {
//       // *** validate the move in GAME object,
//       // make sure the move from is from the right session
//       socket.broadcast.emit('move', move);
//       GAME.makeMove(move);
//   });

// });


