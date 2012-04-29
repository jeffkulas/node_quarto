function message(obj){
  if (obj.playHistory) {
    GAME.playHistory = obj.playHistory;
    // update the board using the history
    for ( var i=0, len=obj.playHistory.length; i<len; ++i ){
      updateBoard(obj.playHistory[i]);
    }
    if (GAME.playHistory[GAME.playHistory.length-1].moveType == "select") {
      GAME.moveType = "place";
      GAME.selectedPieceId = GAME.playHistory[GAME.playHistory.length-1].pieceId;
    } else {
      GAME.moveType = "select";
    }
  } else if (obj.moveType) {
    GAME.makeMove(obj);
    // *** make GAME update by connecting gamelogic to gameui with events
    updateBoard(obj);
  } else {
    var el = document.createElement('p');
    if (obj.announcement) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
    else if (obj.message) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
    
    if( obj.message && window.console && console.log ) console.log(obj.message[0], obj.message[1]);
    document.getElementById('chat').appendChild(el);
    document.getElementById('chat').scrollTop = 1000000;
  }
}

function send(){
  var val = document.getElementById('text').value;
  socket.emit('message', val);
  message({ message: ['you', val] });
  document.getElementById('text').value = '';
}
      
function esc(msg){
  return msg;
  //return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var socket = io.connect();

socket.on('message', function(obj){
  console.log('message received');
  if (obj.buffer){
    document.getElementById('form').style.display='block';
    document.getElementById('chat').innerHTML = '';
    
    for (var i in obj.buffer) message(obj.buffer[i]);
  } else message(obj);
});

socket.on('move', function(obj){
  console.log('move received');
  message(obj);
});


socket.on('connect', function(){ message({ message: ['System', 'Connected']})});
socket.on('disconnect', function(){ message({ message: ['System', 'Disconnected']})});
socket.on('reconnect', function(){ message({ message: ['System', 'Reconnected to server']})});
socket.on('reconnecting', function( nextRetry ){ message({ message: ['System', 'Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms']})});
socket.on('reconnect_failed', function(){ message({ message: ['System', 'Reconnected to server FAILED.']})});

function selectPiece(piece) {
  if ($(piece).hasClass("played") || GAME.moveType != "select")
    return;
  //*** validate piece with local game, if already selected or played, do nothing
  //*** validate piece selection with server before moving the piece
  var move = {moveType:"select", pieceId: $(piece).attr("id"), whoName: socket.sessionId};
  //update local state
  GAME.makeMove(move);
  //send move state to server
  socket.emit('move', move);

  //modify game board
  $(piece).addClass("played");
  var selectedOffset = $("#selected").offset();
  var pieceOffset = $(piece).offset();
  $(piece).animate({top: "+=" + (selectedOffset.top - pieceOffset.top) + "px",
    left: "+=" + (selectedOffset.left - pieceOffset.left) + "px"}, 600);      
}

function placeSelected(place) {
  if ($(place).hasClass("used") || GAME.moveType != "place")
    return;
  //*** validate piece with local game, if already selected or played, do nothing
  //*** validate piece selection with server before moving the piece
  //get the selected piece location and move it to the selected place
  var pieceId = GAME.selectedPieceId;
  var move = {moveType:"place", place:$(place).attr("id"), pieceId: pieceId, whoName: socket.sessionId};
  //update local state
  GAME.makeMove(move);
  //send move to server
  socket.emit('move', move);

  //modify game board - this should probably be based on changes from the model
  //so when other players modify the game state, it is propagated from the model
   $(place).addClass("used");
  var selectedOffset = $("#selected").offset();
  var placeOffset = $(place).offset();
  $("#" + pieceId).animate({top: "+=" + (placeOffset.top - selectedOffset.top) + "px",
    left: "+=" + (placeOffset.left - selectedOffset.left + 4) + "px"}, 600);
}

function updateBoard(move) {
  switch (move.moveType) {
    case "select":
      $("#" + move.pieceId).addClass("played");
      var selectedOffset = $("#selected").offset();
      var pieceOffset = $("#" + move.pieceId).offset();
      $("#" + move.pieceId).animate({top: "+=" + (selectedOffset.top - pieceOffset.top) + "px",
        left: "+=" + (selectedOffset.left - pieceOffset.left) + "px"}, 600);
      break;
    case "place":
      $("#" + move.place).addClass("used");
      var selectedOffset = $("#selected").offset();
      var placeOffset = $("#" + move.place).offset();
      $("#" + move.pieceId).animate({top: "+=" + (placeOffset.top - selectedOffset.top) + "px",
      left: "+=" + (placeOffset.left- selectedOffset.left + 4) + "px"}, 600);
      break;
    case "reset":
      //move all pieces back to the unplayed div, and remove played class
      $("#unplayed > img").each(function(index) {
        $(this).animate({top: "0px", left: (index * 50) + "px"}, 300);
        $(this).removeClass('played');});
      //set all spaces unplayed
      $('.piecespace').removeClass('used');
      break;
    case "undo": //placeholder
      break;
  }

}

function resetBoard() {
  var move = {moveType:"reset", whoName: socket.sessionId};
  updateBoard(move);
  //update local state
  GAME.makeMove(move);
  //send move to server
  socket.emit('move', move);
}

$(function() {
  $('#unplayed > img').click(function() {selectPiece($(this)); });    
  $('.piecespace').click(function() {placeSelected($(this)); });    
  $('#newgamebutton').click(function() {resetBoard(); });   
  $('#form').submit(function() {send(); return false; });
});