import { CommandType } from "../enums/CommandType.js";
import { RaftNode } from "./RaftNode.js";
import { Server } from "socket.io";
import { State } from "../enums/State.js";

/**
 * Manages the web server for handling client requests.
 */
export class WebServerManager {
    /**
     * Creates an instance of WebServerManager.
     * @param {RaftNode} raftNode - The RaftNode instance associated with this web server manager.
     * @param {*} webServerPort - The port on which the web server will run.
     */
    constructor(raftNode, webServerPort) {
        this.raftNode = raftNode;
        this.webServerPort = webServerPort;

        /** @type {Server | null} */
        this.webServerServer = null;
    }

    /**
     * Starts the web server and sets up event handlers for incoming connections.
     */
    start() {
        this.webServerServer = new Server();

        this.webServerServer.on("connection", socket => {
            socket.on(CommandType.NEW_USER, ([args, callback]) => this.onRequest(CommandType.NEW_USER, args, callback));
            socket.on(CommandType.NEW_AUCTION, ([args, callback]) => this.onRequest(CommandType.NEW_AUCTION, args, callback));
            socket.on(CommandType.NEW_BID, ([args, callback]) => this.onRequest(CommandType.NEW_BID, args, callback));
            socket.on(CommandType.CLOSE_AUCTION, ([args, callback]) => this.onRequest(CommandType.CLOSE_AUCTION, args, callback));
            socket.on("isLeader", (callback) => {
                callback({
                    isLeader: this.raftNode.state == State.LEADER,
                    leaderId: this.raftNode.state == State.LEADER ? null : this.raftNode.currentLeaderId
                });
            });
        });

        this.webServerServer.listen(this.webServerPort);
    }

    /**
     * Stops the web server and disconnects sockets.
     */
    stop() {
        this.webServerServer.close();
        this.webServerServer.disconnectSockets(true);
    }

    /**
     * Handles incoming requests from clients, logs the request, checks match index, and resets the heartbeat timeout.
     * @param {string} commandType - Type of the command received.
     * @param {object} args - Arguments associated with the command.
     * @param {function} callback - Callback function associated with the command.
     */
    onRequest(commandType, args, callback) {
        let prevLogIndex = this.log.length - 1;
        let prevLogTerm = this.log.at(-1) ? this.log.at(-1).term : null;

        switch (commandType) {
            case CommandType.NEW_USER:
                this.log.push(new LogRecord(this.currentTerm, commandType, new UserCreateData(args.username, args.password), callback));
                break;

            case CommandType.NEW_AUCTION:
                this.log.push(new LogRecord(this.currentTerm, commandType, new AuctionCreateData(args.user, args.startDate, args.objName, args.objDesc, args.startPrice), callback));
                break;

            case CommandType.NEW_BID:
                this.log.push(new LogRecord(this.currentTerm, commandType, new BidCreateData(args.user, args.auctionId, args.value), callback));
                break;

            case CommandType.CLOSE_AUCTION:
                this.log.push(new LogRecord(this.currentTerm, commandType, new AuctionCloseData(args.auctionId, args.closingDate), callback));
                break;
        }

        let node = this;
        this.matchIndex.forEach((i, nodeId) => {
            if (i == node.commitIndex) {
                this.rpcManager.sendReplicationTo(node.sockets.get(nodeId), node.currentTerm, prevLogIndex, prevLogTerm, [this.log.at(-1)], node.commitIndex);
                this.resetHeartbeatTimeout(nodeId);
            }
        });
    }
}
