# node_quarto

Simple game to show node.js and socket.io in action. Based off of the board game <http://en.wikipedia.org/wiki/Quarto_(board_game)>.

You can chat with the other player and see the pieces move. The server doesn't enforce the game rules yet or help decide who wins.

Server runs on linux and windows. Client runs on Firefox, Chrome and Chrome android. There's an svg problem on the stock android 4 browser.

There's quite a few bugs. For example, resizing the browser window isn't handled yet.

## Installation
clone the git repo

pull in the dependencies

    cd node_quarto
    npm install -d

run the server

    node app.js

connect to the server with a web browser or 2

http://localhost:3000

## To Do

[To Do on trello](https://trello.com/b/4vZ37G7v)