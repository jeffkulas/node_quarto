var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('socket.io')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server
  , GAME = require('./gamelogic.js');
    
server = http.createServer(function(req, res){
  // *** this is a mess, use express or something else
  var path = url.parse(req.url).pathname;
  if (path == '/') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Welcome. Try the <a href="/game.html">game</a> example.</h1>');
      res.end();
  } else { 

	  if (path == '/game.html' || path == '/gamelogic.js' || path.match(/^\/images\//)) {
	      var encoding =  path.match(/^\/images\//) ? 'binary' : 'utf8';
	      var contentType = path == '/gamelogic.js' ? 'text/javascript' : 'text/html'
	      if (path.match(/^\/images\//)) contentType = 'image/png';
	      fs.readFile(__dirname + path, function(err, data){
		if (err) return send404(res);
		res.writeHead(200, {'Content-Type': contentType })
		res.write(data, encoding);
		res.end();
	      });      
	  } else {
		  send404(res);
	  }
  }

}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(8124);

var io = io.listen(server),
    buffer = [];
  
io.on('connection', function(client){
  if (GAME.playHistory.length > 0) client.send({playHistory : GAME.playHistory});
  client.send({ buffer: buffer });
  client.broadcast({ announcement: client.sessionId + ' connected' });
  
  client.on('message', function(message){
	if (message.moveType) {
		// *** validate the move,
		// at least make sure the move from is from the right session
		client.broadcast(message);
		GAME.makeMove(message);
	} else {
	    var msg = { message: [client.sessionId, message] };
	    buffer.push(msg);
	    if (buffer.length > 15) buffer.shift();
	    client.broadcast(msg);
	}
  });

  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
  });
});

