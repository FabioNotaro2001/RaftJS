import { CommandType } from "../enums/CommandType.js";
import { RaftNode } from "./RaftNode.js";
import { Server } from "socket.io";
import { State } from "../enums/State.js";
import { UserCreateData, AuctionCreateData, BidCreateData, AuctionCloseData } from "./Log.js";
import {
    NewUserRequest, NewBidRequest, NewAuctionRequest, LoginRequest, GetUserParticipationsRequest,
    GetUserAuctionsRequest, GetNewBidsRequest, GetLastBidsRequest, GetAuctionInfoRequest, CloseAuctionRequest
} from "./ClientRequestTypes.js";
import { LogRecord } from "./Log.js";

/** @typedef {NewUserRequest | NewBidRequest | NewAuctionRequest | LoginRequest | GetUserParticipationsRequest | GetUserAuctionsRequest | GetNewBidsRequest | GetLastBidsRequest | GetAuctionInfoRequest | CloseAuctionRequest} ClientRequest */

export class WebServerManager {
    /**
     * 
     * @param {RaftNode} raftNode 
     * @param {*} webServerPort 
     */
    constructor(raftNode, webServerPort) {
        this.raftNode = raftNode;
        this.webServerPort = webServerPort;

        /** @type {Server | null} */
        this.webServerServer = null;
    }

    start() {
        this.webServerServer = new Server();

        this.webServerServer.on("connection", socket => {    // Handle connections to this node.
            Object.values(CommandType).forEach((commandType) => {
                socket.on(commandType, (args, callback) => this.onRequest(commandType, args, callback));
            });

            socket.on("isLeader", (callback) => {
                callback({
                    isLeader: this.raftNode.state == State.LEADER,
                    leaderId: this.raftNode.state == State.LEADER ? null : this.raftNode.currentLeaderId
                });
            })
        });


        this.webServerServer.listen(this.webServerPort);
    }

    stop() {
        this.webServerServer.close();
        this.webServerServer.disconnectSockets(true);
    }

    propagateNewLogEntry(prevLogIndex, prevLogTerm) {
        this.raftNode.matchIndex.forEach((i, nodeId) => {
            if (i == this.raftNode.commitIndex) {
                let temp = this.raftNode.log.at(-1);
                let record = new LogRecord(temp.term, temp.commandType, temp.logData, null);
                record.callback = null;
                this.raftNode.rpcManager.sendReplicationTo(this.raftNode.sockets.get(nodeId), this.raftNode.currentTerm, prevLogIndex, prevLogTerm, [record], this.raftNode.commitIndex);
                this.raftNode.resetHeartbeatTimeout(nodeId);
            }
        });
    }

    /**
     * 
     * @param {String} commandType Type of the command.
     * @param {ClientRequest} args The arguments of the command.
     * @param {(response: Promise) => {}} callback 
     */
    onRequest(commandType, args, callback) {
        let prevLogIndex = this.raftNode.log.length - 1;
        let prevLogTerm = this.raftNode.log.at(-1);

        switch (commandType) {
            case CommandType.NEW_USER: {

                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new UserCreateData(args.username, args.password), callback));
                this.propagateNewLogEntry(prevLogIndex, prevLogTerm);
                break;
            }
            case CommandType.NEW_BID: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new BidCreateData(args.user, args.auctionId, args.value), callback));
                this.propagateNewLogEntry(prevLogIndex, prevLogTerm);
                break;
            }
            case CommandType.GET_AUCTION_INFO: {
                callback(this.raftNode.dbManager.queryGetAuctionInfo(args.auctionId));
                break;
            }
            case CommandType.NEW_AUCTION: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new AuctionCreateData(args.user, args.startDate, args.objName, args.objDesc, args.startPrice), callback));
                this.propagateNewLogEntry(prevLogIndex, prevLogTerm);
                break;
            }
            case CommandType.LOGIN: {
                callback(this.raftNode.dbManager.queryForLogin(args.username, args.password));
                break;
            }
            case CommandType.CLOSE_AUCTION: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new AuctionCloseData(args.auctionId, args.closingDate), callback));
                this.propagateNewLogEntry(prevLogIndex, prevLogTerm);
                break;
            }
            case CommandType.GET_ALL_OPEN_AUCTIONS: {
                callback(this.raftNode.dbManager.queryViewAllOpenAuctions());
                break;
            }
            case CommandType.GET_NEW_BIDS: {
                callback(this.raftNode.dbManager.queryGetNewerBids(args.auctionId, args.lastBidId));
                break;
            }
            case CommandType.GET_USER_AUCTIONS: {
                callback(this.raftNode.dbManager.queryViewAllAuctionsOfAUser(args.username));
                break;
            }
            case CommandType.GET_USER_PARTICIPATIONS: {
                callback(this.raftNode.dbManager.queryViewAllAuctionsParticipatedByUser(args.username));
                break;
            }
            case CommandType.GET_LAST_N_BIDS: {
                callback(this.raftNode.dbManager.queryViewNLatestBidsInAuction(args.auctionId, args.numOfBids));
                break;
            }
        }
    }
}