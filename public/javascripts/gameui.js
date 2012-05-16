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
    var el = $(document.createElement('p'));
    if (obj.announcement) {
      el.append($(document.createElement('em'))).text(obj.announcement);
    } else {
      if (obj.message) {
        el.append($(document.createElement('b')).text(obj.message[0] + ': '), $(document.createElement('span')).text(obj.message[1])); // *** TODO losing the b tag here
      }
    } 
    
    $('#chat').append(el);
    $('#chat').scrollTop(1000000);
  }
}

function sendChatMsg(){
  var val = document.getElementById('text').value;
  socket.emit('message', val);
  message({ message: ['you', val] });
  document.getElementById('text').value = '';
}

var socket = io.connect();

socket.on('message', function(obj){
  console.log('message received');
//  if (obj.buffer){
//    document.getElementById('form').style.display='block';
//    document.getElementById('chat').innerHTML = '';
//    for (var i in obj.buffer) message(obj.buffer[i]);
//  } else 
    message(obj);
});

socket.on('move', function(obj){
  message(obj);
});


socket.on('connect', function(){ message({ message: ['System', 'Connected']})});
socket.on('disconnect', function(){ message({ message: ['System', 'Disconnected']})});
socket.on('reconnect', function(){ message({ message: ['System', 'Reconnected to server']})});
socket.on('reconnecting', function( nextRetry ){ message({ message: ['System', 'Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms']})});
socket.on('reconnect_failed', function(){ message({ message: ['System', 'Reconnected to server FAILED.']})});

function selectPiece(piece) {
  console.log('selectPiece')
  if ($(piece).hasClass("played") || GAME.moveType != "select")
    return;
  //*** validate piece with local game, if already selected or played, do nothing
  //*** validate piece selection with server before moving the piece
  var move = {moveType:"select", pieceId: piece, whoName: socket.sessionId};
  //update local state
  GAME.makeMove(move);
  //send move state to server
  socket.emit('move', move);

  //modify game board
  updateBoard(move);
  // $(piece).addClass("played");
  // var selectedOffset = $("#selected").offset();
  // var pieceOffset = $(piece).offset();
  // $(piece).animate({top: "+=" + (selectedOffset.top - pieceOffset.top) + "px",
  //   left: "+=" + (selectedOffset.left - pieceOffset.left) + "px"}, 600);      
}

function placeSelected(placeObj) {
  console.log('placeSelected');
  var place;
  if (placeObj.ownerDocument && 
      placeObj.ownerDocument.defaultView.frameElement.id) {
    place = placeObj.ownerDocument.defaultView.frameElement.id;
    console.log(place);
  } else {
    place = placeObj;
  }
  if ($(place).hasClass("used") || GAME.moveType != "place")
    return;
  //*** validate piece with local game, if already selected or played, do nothing
  //*** validate piece selection with server before moving the piece
  //get the selected piece location and move it to the selected place
  var pieceId = GAME.selectedPieceId;
  var move = {moveType:"place", place: place, pieceId: pieceId, whoName: socket.sessionId};
  //update local state
  GAME.makeMove(move);
  //send move to server
  socket.emit('move', move);

  //modify game board - this should probably be based on changes from the model
  //so when other players modify the game state, it is propagated from the model
  updateBoard(move);
  //  $(place).addClass("used");
  // var selectedOffset = $("#selected").offset();
  // var placeOffset = $(place).offset();
  // $("#" + pieceId).animate({top: "+=" + (placeOffset.top - selectedOffset.top) + "px",
  //   left: "+=" + (placeOffset.left - selectedOffset.left + 4) + "px"}, 600);
}

function updateBoard(move) {
  console.log('updateBoard ' + move.pieceId);
  switch (move.moveType) {
    case "select":
      var $movePiece = $("#" + move.pieceId);
      $movePiece.addClass("played");
      var selectedOffset = $("#selected").offset();
      var pieceOffset = $movePiece.offset();
      $movePiece.addClass("moving");
      $movePiece.animate({top: "+=" + (selectedOffset.top - pieceOffset.top) + "px",
        left: "+=" + (selectedOffset.left - pieceOffset.left) + "px"}, 600);
      break;
    case "place":
      console.log('move.place ' + move.place);
      $("#" + move.place).addClass("used");
      var selectedOffset = $("#selected").offset();
      var placeOffset = $("#" + move.place).offset();
      console.log(placeOffset);
      $("#" + move.pieceId).animate({top: "+=" + (placeOffset.top - selectedOffset.top + 1) + "px",
      left: "+=" + (placeOffset.left - selectedOffset.left + 1) + "px"}, 600);
      break;
    case "reset":
      //move all pieces back to the unplayed div, and remove played class
      $("#unplayed > object").each(function(index) {
        $(this).animate({top: "0px", left: "0px"}, 300);
        $(this).removeClass('played');
        $(this).removeClass('moving');
      });
        
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
//  $('#unplayed > object').live('click', function() {selectPiece($(this)); });    
//  $('.piecespace').click(function() {placeSelected($(this)); });    
  $('#newgamebutton').click(function() {resetBoard(); });   
  $('#form').submit(function() {sendChatMsg(); return false; });
});