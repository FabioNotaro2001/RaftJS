import { CommandType } from "../enums/CommandType.js";
import { RaftNode } from "./RaftNode.js";
import { Server } from "socket.io";
import { State } from "../enums/State.js";

export class WebServerManager{
    /**
     * 
     * @param {RaftNode} raftNode 
     * @param {*} webServerPort 
     */
    constructor(raftNode, webServerPort){
        this.raftNode = raftNode;
        this.webServerPort = webServerPort;
        
        /** @type {Server | null} */
        this.webServerServer = null;
    }

    start(){
        this.webServerServer = new Server();

        this.webServerServer.on("connection", socket => {    // Handle connections to this node.
            socket.on(CommandType.NEW_USER, ([args, callback]) => this.onRequest(CommandType.NEW_USER, args, callback));
            socket.on(CommandType.NEW_AUCTION, ([args, callback]) => this.onRequest(CommandType.NEW_AUCTION, args, callback));
            socket.on(CommandType.NEW_BID, ([args, callback]) => this.onRequest(CommandType.NEW_BID, args, callback));
            socket.on(CommandType.CLOSE_AUCTION, ([args, callback]) => this.onRequest(CommandType.CLOSE_AUCTION, args, callback));
            socket.on("isLeader", (callback) => {
                callback({
                    isLeader: this.raftNode.state == State.LEADER,
                    leaderId: this.raftNode.state == State.LEADER ? null : this.raftNode.currentLeaderId
                });
            })
        });

        
        this.webServerServer.listen(this.webServerPort);
    }

    stop(){
        this.webServerServer.close();
        this.webServerServer.disconnectSockets(true);
    }

    // Functions that handle the various requests that can be made on the database.
    // For every request add it on the log,  check the match index and reset the heartbeat timeout.
    onRequest(commandType, args, callback) {
        let prevLogIndex = this.log.length - 1;
        let prevLogTerm = this.log.at(-1) ? this.log.at(-1).term : null;

        switch (commandType) {
            case CommandType.NEW_USER: {
                this.log.push(new LogRecord(this.currentTerm, commandType, new UserCreateData(args.username, args.password), callback));
                break;
            }
            case CommandType.NEW_AUCTION: {
                this.log.push(new LogRecord(this.currentTerm, commandType, new AuctionCreateData(args.user, args.startDate, args.objName, args.objDesc, args.startPrice), callback));
                break;
            }
            case CommandType.NEW_BID: {
                this.log.push(new LogRecord(this.currentTerm, commandType, new BidCreateData(args.user, args.auctionId, args.value), callback));
                break;
            }
            case CommandType.CLOSE_AUCTION: {
                this.log.push(new LogRecord(this.currentTerm, commandType, new AuctionCloseData(args.auctionId, args.closingDate), callback));
                break;
            }
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