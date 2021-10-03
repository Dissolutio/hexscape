const Server = require("boardgame.io/server").Server;
const Origins = require("boardgame.io/server").Origins;
const Hexscape = require("./server/game").Hexscape;

const server = Server({
  games: [Hexscape],
  origins: [
    // Allow your game site to connect.
    // "https://www.mygame.domain",
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT,
  ],
});
const PORT = process.env.PORT || 8000;

server.run(PORT, () => console.log("dev server running at: PORT"));
