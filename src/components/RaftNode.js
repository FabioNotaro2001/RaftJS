import { createServer, Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { Socket as SocketCl, io } from "socket.io-client"
import { RPCType } from "../enums/RPCType";
import { AppendEntriesParameters } from "./RPCParameters";
import { State } from "../enums/State";
import { RPCManager } from "./RPCManager";
import { Log } from "./Log";

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
        /** @type {String} */
        this.id = id;
        /** @type {String} */
        this.state = State.FOLLOWER;
        /** @type {Number} */
        this.currentTerm = 0;
        /** @type {String} */
        this.votedFor = null;
        /** @type {Log[]} */
        this.log = [];
        /** @type {Number} */
        this.commitIndex = -1;
        /** @type {Number} */
        this.lastApplied = -1;
        /** @type {Number} */
        this.minLeaderTimeout = minLeaderTimeout;
        /** @type {Number} */
        this.maxLeaderTimeout = maxLeaderTimeout;
        /** @type {Number} */
        this.minElectionDelayMS = minElectionDelay;
        /** @type {any} */
        this.dbManager = dbManager;
        /**
         * Leader-only.
         * 
         * Index of the next log entry to send to each follower node, initialized after every election to the index of the last record in the leader's log +1.
         * @type {Number[]}
         */
        this.nextIndex = [];
        /**
         * Leader-only.
         * 
         * Index of highest log entry known to be replicated on each follower node. Reinitialized after every election. 
         * @type {Number[]}
         */
        this.matchIndex = [];
        /** @type {String[]} */
        this.otherNodes = otherNodes;

        /** @type {String | null} */
        this.currentLeader = null;

        /** @type {HTTPServer} */
        this.httpServer = createServer();
        /** @type {Server} */
        this.io = new Server(this.httpServer);

        /** @type {SocketCl[]} */
        this.sockets = [];
        otherNodes.forEach(host => {
            let sock = io(host, {
                autoConnect: false
            });
            sock.connect();
            this.sockets.push(sock);            
        });

        this.sockets.forEach(sock => {
            sock.on(RPCType.APPENDENTRIES, (args) => { this.onAppendEntriesMessage(sock, args) })
        });

        /** @type {RPCManager} */
        this.rpcManager = new RPCManager(this.sockets, this.id);
    }

    /**
     * 
     * @param {SocketCl} sender 
     * @param {AppendEntriesParameters} args 
     */
    onAppendEntriesMessage(sender, args) {

        // TODO: if leader or candidate, check term number. If it's greater, update own term and change state to follower.
        // TODO: if follower and term number is greater than own, remove non committed records of smaller term and update own term.

        switch (this.state) {
            case State.FOLLOWER: {
                if (payload.term < this.currentTerm) {
                    this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex)
                    return;
                }
            }
        }
    }

    onRequestVoteMessage(payload) {

    }

    onSnapshotMessage(payload) {

    }
}