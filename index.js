import { createServer } from "http";
import { Server } from "socket.io";
import { RPCType } from "./src/enums/RPCType";

const io = new Server({ /* options */ }); // STANDALONE
io.listen(11111);

// const httpServer = createServer();   // WITH HTTP SERVER
// const io = new Server(httpServer, {
//   // ...
// });
// httpServer.listen(11111);

io.on("connection", (socket) => {
    socket.emit("hello", "world");

});

io.on(RPCType.APPENDENTRIES, LISTEN);
function LISTEN(payload) {

}
