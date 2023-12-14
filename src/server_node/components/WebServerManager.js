import { CommandType } from "../enums/CommandType.js";
import { RaftNode } from "./RaftNode.js";
import { Server } from "socket.io";
import { State } from "../enums/State.js";
import { UserCreateData, AuctionCreateData, BidCreateData, AuctionCloseData } from "./Log.js";
import {
    NewUserRequest, NewBidRequest, NewAuctionRequest, LoginRequest, GetUserParticipationsRequest,
    GetUserAuctionsRequest, GetNewBidsRequest, GetLastBidsRequest, GetAuctionInfoRequest, CloseAuctionRequest, UserExistsRequest
} from "./ClientRequestTypes.js";
import { LogRecord } from "./Log.js";

/** @typedef {NewUserRequest | NewBidRequest | NewAuctionRequest | LoginRequest | GetUserParticipationsRequest | GetUserAuctionsRequest | GetNewBidsRequest | GetLastBidsRequest | GetAuctionInfoRequest | CloseAuctionRequest | UserExistsRequest} ClientRequest */

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

    /**
     * 
     * @param {String} commandType Type of the command.
     * @param {ClientRequest} args The arguments of the command.
     * @param {(response: any) => {}} callback 
     */
    async onRequest(commandType, args, callback) {
        let prevLogIndex = this.raftNode.log.length - 1;
        let prevLogTerm = this.raftNode.log.at(-1);

        switch (commandType) {
            case CommandType.NEW_USER: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new UserCreateData(args.username, args.password), callback));
                break;
            }
            case CommandType.NEW_BID: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new BidCreateData(args.username, Number(args.auctionId), Number(args.bidValue)), callback));
                break;
            }
            case CommandType.GET_AUCTION_INFO: {
                callback(await this.raftNode.dbManager.queryGetAuctionInfo(args.auctionId));
                break;
            }
            case CommandType.NEW_AUCTION: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new AuctionCreateData(args.username, args.startDate, args.objName, args.objDesc, Number(args.startPrice)), callback));
                break;
            }
            case CommandType.LOGIN: {
                callback(await this.raftNode.dbManager.queryForLogin(args.username, args.password));
                break;
            }
            case CommandType.CLOSE_AUCTION: {
                this.raftNode.log.push(new LogRecord(this.raftNode.currentTerm, commandType, new AuctionCloseData(Number(args.auctionId), args.closingDate), callback));
                break;
            }
            case CommandType.GET_ALL_OPEN_AUCTIONS: {
                callback(await this.raftNode.dbManager.queryViewAllOpenAuctions());
                break;
            }
            case CommandType.GET_NEW_BIDS: {
                callback(await this.raftNode.dbManager.queryGetNewerBids(Number(args.auctionId), Number(args.lastBidId)));
                break;
            }
            case CommandType.GET_USER_AUCTIONS: {
                callback(await this.raftNode.dbManager.queryViewAllAuctionsOfAUser(args.username));
                break;
            }
            case CommandType.GET_USER_PARTICIPATIONS: {
                callback(await this.raftNode.dbManager.queryViewAllAuctionsParticipatedByUser(args.username));
                break;
            }
            case CommandType.GET_LAST_N_BIDS: {
                callback(await this.raftNode.dbManager.queryViewNLatestBidsInAuction(Number(args.auctionId), Number(args.numOfBids)));
                break;
            }
            case CommandType.USER_EXISTS: {
                callback(await this.raftNode.dbManager.queryUserExists(args.username));
                break;
            }
        }
    }
}