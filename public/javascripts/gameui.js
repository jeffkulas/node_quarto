var socket = io.connect();

socket.on('move', function(obj){
  move(obj);
});

function move(obj) {
  if (obj.playHistory) {
    GAME.playHistory = obj.playHistory;
    // update the board using the history
    for ( var i=0, len=obj.playHistory.length; i<len; ++i ){
      var move = obj.playHistory[i];
      move.speed = 1;
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
  }
}


function selectPiece(piece) {
  console.log('selectPiece')
  if ($(piece).hasClass("played") || GAME.moveType != "select")
    return;
  //*** validate piece with local game, if already selected or played, do nothing
  //*** validate piece selection with server before moving the piece
  var move = {moveType:"select", pieceId: piece, whoName: socket.sessionId};
  GAME.makeMove(move);
  socket.emit('move', move);

  updateBoard(move);
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
  GAME.makeMove(move);
  socket.emit('move', move);

  updateBoard(move);
}

function updateBoard(move) {
  var moveSpeed = 600;
  if (move.speed) moveSpeed = move.speed;
  switch (move.moveType) {
    case "select":
      $("#" + move.pieceId).addClass("played");
      var selectedOffset = $("#selected").offset();
      var pieceOffset = $("#" + move.pieceId).offset();
      $("#" + move.pieceId).animate({top: "+=" + (selectedOffset.top - pieceOffset.top + 1) + "px",
        left: "+=" + (selectedOffset.left - pieceOffset.left + 1) + "px"}, moveSpeed);
      break;
    case "place":
      $("#" + move.place).addClass("used");
      var selectedOffset = $("#selected").offset();
      var placeOffset = $("#" + move.place).offset();
      $("#" + move.pieceId).animate({top: "+=" + (placeOffset.top - selectedOffset.top ) + "px",
      left: "+=" + (placeOffset.left - selectedOffset.left ) + "px"}, moveSpeed);
      break;
    case "reset":
      //move all pieces back to the unplayed div
      $("#unplayed > object").each(function(index) {
        $(this).offset({top: "0px", left: "0px"});
        $(this).removeClass('played');
      });
        
      //set all spaces unplayed
      $('.piecespace').removeClass('used');
      break;
  }

}

function resetBoard() {
  var move = {moveType:"reset"};
  updateBoard(move);
  //update local state
  GAME.makeMove(move);
  //send move to server
  socket.emit('move', move);
}

function setLayout() {
  if ($(window).width() < $(window).height()) {
    $('#boardcont').removeClass('span5');
    $('#boardcont').addClass('span8');
    $('#unplayed').removeClass('span5');
    $('#unplayed').addClass('span8');
    $('#status').removeClass('span2');
    $('#status').addClass('span4');
  } else {
    $('#boardcont').addClass('span5');
    $('#boardcont').removeClass('span8');
    $('#unplayed').addClass('span5');
    $('#unplayed').removeClass('span8');    
    $('#status').removeClass('span4');
    $('#status').addClass('span2');
  }
}

function resizeScreen() {
  setLayout();
  //move played pieces to where they belong
  // update the board using the history
  updateBoard({moveType:"reset"});
  if (GAME.playHistory.length) move({playHistory: GAME.playHistory});
}

var resizeTimer;

$(window).resize(function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeScreen, 5);  
});


$(function() {
  $('#newgamebutton').click(function() {resetBoard(); });   
  // rearrange board if player has vertical screen
  setLayout();
});