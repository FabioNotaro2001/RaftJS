import { createServer, Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { Socket as SocketCl, io } from "socket.io-client"
import { RPCType } from "../enums/RPCType";
import { AppendEntriesParameters, RPCParameters } from "./RPCParameters";
import { State } from "../enums/State";
import { RPCManager } from "./RPCManager";
import { LogRecord } from "./Log";

const MAX_ENTRIES_IN_REQUEST = 10;  // Max number of request that can be put together in a single request.

export class RaftNode {
    /**
     * Creates a new node for the Raft consensus protocol cluster.
     * @param {String} id Id of this node.
     * @param {Number} minLeaderTimeout Minimum time in ms to wait before launching a new election after a leader timeout.
     * @param {Number} maxLeaderTimeout Maximum time in ms to wait before launching a new election after a leader timeout.
     * @param {Number} minElectionTimeout Minimum time in ms to wait before launching a new election after a failed one.
     * @param {Number} maxElectionTimeout Maximum time in ms to wait before launching a new election after a failed one.
     * @param {Number} minElectionDelay Minimum time in ms before a new election can be started. Elections started before this amount of time are ignored.
     * @param {any} dbManager Manager for the database of the node.
     * @param {String[]} otherNodes Hosts for the other nodes in the cluster.
     */
    constructor(id, minLeaderTimeout, minLeaderTimeout, maxElectionTimeout, minElectionTimeout, minElectionDelay, dbManager, otherNodes) {
        /** @type {String} */
        this.id = id;
        /** @type {String} */
        this.state = State.FOLLOWER;
        /** @type {Number} */
        this.currentTerm = 0;
        /** @type {String} */
        this.votedFor = null;
        /** @type {LogRecord[]} */
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
        this.minElectionTimeout = minElectionTimeout;
        /** @type {Number} */
        this.maxElectionTimeout = maxElectionTimeout;
        /** @type {Number} */
        this.minElectionDelay = minElectionDelay;
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
        this.currentLeaderId = null;

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

        // TODO: one setinterval for leader timeout
        // TODO: one setinterval for election timeout
        // TODO: map socket.id => setintervals, used to keep track of intervals for heartbeats

        this.sockets.forEach(sock => {
            sock.on(RPCType.APPENDENTRIES, (args) => { this.onAppendEntriesMessage(sock, args) })
        });

        /** @type {RPCManager} */
        this.rpcManager = new RPCManager(this.sockets, this.id);
    }

    /**
     * Handles incoming AppendEntries RPC messages.
     * @param {SocketCl} sender The socket representing the sender node.
     * @param {AppendEntriesParameters} args The parameters of the AppendEntries RPC.
     */
    onAppendEntriesMessage(sender, args) {
        
        switch (this.state) {
            case State.FOLLOWER: {
                if (args.isResponse) {
                    break; // TODO: send false.
                }

                if (args.term < this.currentTerm || 
                    this.log[args.prevLogIndex]?.term !== args.prevLogTerm) {
                    this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex)
                    break;
                }

                if (this.currentLeaderId === null) {            // Leader may not be known (see in case State.LEADER)
                    this.currentLeaderId = args.senderId;
                } 

                args.entries.forEach((e, i) => {
                    if (this.log[args.prevLogIndex + i + 1].term !== e.term) {
                        this.log.length = args.prevLogIndex + i + 1;    // Delete all records starting from the conflicting one.
                    }
                    this.log.push(e);
                })

                if (args.term > this.currentTerm) {
                    this.currentTerm = args.term;
                }

                if (args.leaderCommit > this.commitIndex) {
                    let lastIndex = args.prevLogIndex + args.entries.length;
                    this.commitIndex = args.leaderCommit <= lastIndex ? args.leaderCommit : lastIndex; 
                }

                this.rpcManager.sendReplicationResponse(sender, this.currentTerm, true, this.commitIndex);
                // TODO: delete setInteval for leader timeout and start a new one.
            }
            case State.LEADER: {
                if (!args.isResponse) {
                    if (args.term > this.currentTerm) {     // Contact from a more recent leader.
                        this.state = State.FOLLOWER;
                        this.currentLeaderId = args.senderId;
                        this.currentTerm = args.term;
                        this.onAppendEntriesMessage(sender, args);
                        break;
                    } else {                                // Contact from a less recent leader.
                        this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex);
                    }
                }
                
                if (args.success) { // Leader was not rejected.
                    this.matchIndex[args.senderId] = args.matchIndex;
                    this.nextIndex[args.senderId] = args.matchIndex + 1;
                    
                    let prevLogIndex = this.nextIndex[args.senderId] - 1;
                    let prevlogTerm = this.log[prevLogIndex];
                    
                    // Sends missing entries to the node.
                    let missingEntries = this.log.slice(prevLogIndex + 1);
                    if (missingEntries.length > 0) {
                        this.rpcManager.sendTo(sender, RPCType.APPENDENTRIES,
                            AppendEntriesParameters.forRequest(this.id, this.currentTerm, prevLogIndex, prevlogTerm, missingEntries));
                    }
                    // TODO: delete previous setInterval
                    // TODO: new setInterval for heartbeat (with eventual missing entries (see last parameter ->))
                } else {    // Leader was rejected.
                    if (args.term > this.currentTerm) {
                        this.state = State.FOLLOWER;
                        this.currentLeaderId = null;  // Leader becomes unknown (can't be sure if the response was from the new leader).
                        this.currentTerm = args.term;
                    }
                    break; // Does nothing if it's a log conflict, eventually a new election will start and the new leader fix things.
                }
            }
            case State.CANDIDATE: {
                // ....
            }
            default: {
                break;
            }
        }
    }

    /**
     * Placeholder for handling incoming RequestVote RPC messages.
     * @param {any} payload The payload of the RequestVote RPC.
     */
    onRequestVoteMessage(payload) {

    }

    /**
     * Placeholder for handling incoming Snapshot RPC messages.
     * @param {any} payload The payload of the Snapshot RPC.
     */
    onSnapshotMessage(payload) {

    }
}