var exports;
var GAME = (function (my) {
	var player1 = "player1"
	  , player2 = "player2"
	  , waitingOn = ""
	  , messages = ["Anyone may select a piece to start the game.",
									"p$ selected a piece. Anyone else may play the piece.",
									"p$ turn to select a piece.",
									"p$ turn to play the selected piece."];
		my.playHistory = [];
		my.selectedPieceId = null;
		my.moveType = "select"; //select or place

		my.makeMove = function(mv) {
			//*** validate the move
			this.playHistory.push(mv);
			switch (mv.moveType) {
				case "select":
					this.moveType = "place";
					if (mv.whoName === this.player1 && this.player2 != "player2") {
						waitingOn = this.player2;
					} else {
						if (this.player2 != "player2") {
							waitingOn = this.player1;
						}
					}
					this.selectedPieceId = mv.pieceId;
					break;
				case "place": 
					this.moveType = "select";
					this.selectedPieceId = null;
					break;
				case "reset":
					this.restart();
			}
		};

		my.restart = function() {
			this.playHistory = [];
			this.player1 = "player1";
			this.player2 = "player2";
			this.waitingOn = "";
			this.turnType = "select";
			this.selectedPiece = null;
		};

	return my;
      
}) (exports || {});
