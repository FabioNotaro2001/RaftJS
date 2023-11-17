import { createServer } from "http";
import { Server } from "socket.io";
import { Socket, io } from "socket.io-client"
import { RPCType } from "../enums/RPCType";
import { AppendEntriesParameters } from "./RPCParameters";
import { State } from "../enums/State";
import { RPCManager } from "./RPCManager";

export class RaftNode {
    /**
     * Creates a new node for the Raft consensus protocol cluster.
     * @param {String} id Id of this node.
     * @param {Number} maxLeaderTimeout Maximum time in ms to wait before launching a timeout.
     * @param {Number} minLeaderTimeout Minimum time in ms to wait before launching a timeout.
     * @param {Number} minElectionDelay Minimum time in ms before a new election can be started. Elections started before this amount of time are ignored.
     * @param {any} dbManager Manager for the database of the node.
     * @param {String[]} otherNodes Hosts for the other nodes in the cluster.
     */
    constructor(id, minLeaderTimeout, maxLeaderTimeout, minElectionDelay, dbManager, otherNodes) {
        this.id = id;
        this.state = State.FOLLOWER;
        this.currentTerm = 0;
        this.votedFor = undefined;
        this.log = [];
        this.commitIndex = 0;
        this.lastApplied = 0;
        this.minLeaderTimeout = minLeaderTimeout;
        this.maxLeaderTimeout = maxLeaderTimeout;
        this.minElectionDelayMS = minElectionDelay;
        this.dbManager = dbManager;
        this.nextIndex = 1;
        this.matchIndex = 0;
        this.otherNodes = otherNodes;

        this.httpServer = createServer();
        this.io = new Server(this.httpServer);

        /**
         * @type {Socket[]}
         */
        this.sockets = [];
        otherNodes.forEach(host => {
            let sock = io(host, {
                autoConnect: false
            });
            sock.connect();
            this.sockets.push(sock);            
        });

        this.sockets.forEach(sock => {
            sock.on(RPCType.APPENDENTRIES, this.onAppendEntriesMessage)
        });

        this.rpcManager = new RPCManager(this.sockets, this.id);
    }

    /**
     * 
     * @param {AppendEntriesParameters} payload 
     */
    onAppendEntriesMessage(payload) {
        switch (this.state) {
            case State.FOLLOWER: {
                if ()
            }
        }
    }

    onRequestVoteMessage(payload) {

    }

    onSnapshotMessage(payload) {

    }
}