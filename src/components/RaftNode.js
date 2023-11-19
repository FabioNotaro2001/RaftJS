import { createServer, Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { Socket as SocketCl, io } from "socket.io-client"
import { RPCType } from "../enums/RPCType";
import { AppendEntriesParameters, RequestVoteParameters, RPCParameters, SnapshotParameters } from "./RPCParameters";
import { State } from "../enums/State";
import { RPCManager } from "./RPCManager";
import { LogRecord } from "./Log";

// const MAX_ENTRIES_IN_REQUEST = 10;  // Max number of request that can be put together in a single request.

export class RaftNode {
    /**
     * Creates a new node for the Raft consensus protocol cluster.
     * @param {String} id Id of this node.
     * @param {Number} minLeaderTimeout Minimum time in ms to wait before launching a new election after a leader timeout.
     * @param {Number} maxLeaderTimeout Maximum time in ms to wait before launching a new election after a leader timeout.
     * @param {Number} minElectionTimeout Minimum time in ms to wait before launching a new election after a failed one.
     * @param {Number} maxElectionTimeout Maximum time in ms to wait before launching a new election after a failed one.
     * @param {Number} minElectionDelay Minimum time in ms before a new election can be started. Elections started before this amount of time are ignored.
     * @param {Number} heartbeatTimeout Time in ms before sending a new heartbeat.
     * @param {any} dbManager Manager for the database of the node.
     * @param {Map<String, String>} otherNodes Pairs IdNode-IPAddress for the other nodes in the cluster.
     */
    constructor(id, minLeaderTimeout, minLeaderTimeout, maxElectionTimeout, minElectionTimeout, minElectionDelay, heartbeatTimeout, dbManager, otherNodes) {
        /** @type {String} */
        this.id = id;
        /** @type {String} */
        this.state = State.FOLLOWER;
        /** @type {Number} */
        this.currentTerm = 0;
        /** @type {String} */
        this.votedFor = null;
        /** @type {Number} */
        this.votesGathered = 0;
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
        /** @type {Number} */
        this.heartbeatTimeout = heartbeatTimeout
        /** @type {any} */
        this.dbManager = dbManager;
        /**
         * Leader-only.
         * 
         * Index of the next log entry to send to each follower node, initialized after every election to the index of the last record in the leader's log +1.
         * @type {Map<String, Number>}
         */
        this.nextIndex = new Map();
        /**
         * Leader-only.
         * 
         * Index of highest log entry known to be replicated on each follower node. Reinitialized after every election. 
         * @type {Map<String, Number>}
         */
        this.matchIndex = new Map();
        /** @type {Map<String, String>} */
        this.otherNodes = otherNodes;

        /** @type {Number} */
        this.clusterSize = otherNodes.length + 1;

        /** @type {String | null} */
        this.currentLeaderId = null;

        /** @type {HTTPServer} */
        this.httpServer = createServer();
        /** @type {Server} */
        this.io = new Server(this.httpServer);

        /** 
         * Maps the socket id to the corresponding node id. 
         * @type {Map<String, String>} 
        */
        this.socketToNodeId = new Map();

        /**
         * Maps the node id to the corresponding socket.
         *  @type {Map<String, SocketCl>} 
        */
        this.sockets = new Map();
        otherNodes.forEach((host, id) => {
            let sock = io(host, {
                autoConnect: false
            });

            sock.connect();

            this.sockets.set(id, sock);
            this.socketToNodeId.set(sock.id, nodeId)
        });

        /** @type {Number} */
        this.leaderTimeout = null;

        /** @type {Number} */
        this.electionTimeout = null;

        /** @type {Map<String, Number | null>} */
        this.heartbeatTimeouts = new Map();

        this.sockets.forEach((sock, id) => {
            sock.on(RPCType.APPENDENTRIES, (args) => { this.onAppendEntriesMessage(sock, args) });
            this.heartbeatTimeouts.set(id, null);
        });

        /** @type {RPCManager} */
        this.rpcManager = new RPCManager(Array.of(this.sockets.values()), this.id);

        this.waitForLeaderTimeout();    // Waits before attempting to start the first ever election.
    }

    /**
     * Handles incoming AppendEntries RPC messages.
     * @param {SocketCl} sender The socket representing the sender node.
     * @param {AppendEntriesParameters} args The parameters of the AppendEntries RPC.
     */
    onAppendEntriesMessage(sender, args) {
        if (args.term > this.currentTerm) {     // Contact from a more recent leader.
            switch (this.state) {
                case State.LEADER: {
                    this.stopHeartbeatTimeout();
                    break;
                }
                case State.CANDIDATE: {
                    this.stopHeartbeatTimeout();
                    this.stopElectionTimeout();
                    break;
                }
                default:
                    break;
            }
            this.state = State.FOLLOWER;
            this.currentLeaderId = args.isResponse ? null : args.senderId;
            this.currentTerm = args.term;
        }
        switch (this.state) {
            case State.FOLLOWER: {
                if (args.isResponse) {
                    this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex);
                    break;
                }

                if (args.term < this.currentTerm ||
                    this.log[args.prevLogIndex]?.term !== args.prevLogTerm) {
                    this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex);
                    break;
                }

                if (this.currentLeaderId == null) {            // Leader may not be known (see in case State.LEADER)
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
                this.resetLeaderTimeout();
            }
            case State.LEADER: {
                // This message is sent by an older leader and is no longer relevant.
                if (!args.isResponse) {
                    this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex);
                }

                if (args.success) { // Leader was not rejected.
                    this.matchIndex.set(args.senderId, args.matchIndex);
                    this.nextIndex.set(args.senderId, args.matchIndex + 1);

                    let prevLogIndex = this.nextIndex[args.senderId] - 1;
                    let prevLogTerm = this.log[prevLogIndex];

                    // Sends missing entries to the node.
                    let missingEntries = this.log.slice(args.matchIndex + 1);
                    if (missingEntries.length > 0) {
                        this.rpcManager.sendReplicationTo(sender, this.currentTerm, prevLogIndex, prevLogTerm, missingEntries, this.commitIndex);
                        this.resetHeartbeatTimeout(args.senderId);
                    }
                }
                break; // Nothing is done if it's a log conflict, eventually a new election will start and the new leader fix things.
            }
            case State.CANDIDATE: {
                this.rpcManager.sendReplicationResponse(sender, this.currentTerm, false, this.commitIndex); // The message is for a previous term and it is rejected.
                break;
            }
            default: {
                break;
            }
        }
    }

    /**
     * Handles incoming RequestVote RPC messages.
     * @param {SocketCl} sender The socket representing the sender node.
     * @param {RequestVoteParameters} args The parameters of the RequestVote RPC.
     */
    onRequestVoteMessage(sender, args) {
        if (args.term > this.currentTerm) {     // Contact from a more recent candidate.
            switch (this.state) {
                case State.LEADER: {
                    this.stopHeartbeatTimeout();
                    break;
                }
                case State.CANDIDATE: {
                    this.stopHeartbeatTimeout();
                    this.stopElectionTimeout();
                    break;
                }
                default:
                    break;
            }
            this.state = State.FOLLOWER;
            this.votedFor = null;
            this.currentLeaderId = null;
            this.currentTerm = args.term;
        }

        switch (this.state) {
            case State.FOLLOWER: {
                if (this.votedFor == null) {
                    this.votedFor = args.senderId;
                    this.rpcManager.sendVote(sender, true);
                } else {
                    this.rpcManager.sendVote(sender, false);
                }
                break;
            }
            case State.LEADER: {
                this.rpcManager.sendVote(sender, false);
                break;
            }
            case State.CANDIDATE: {
                if (args.isResponse) {
                    this.stopHeartbeatTimeout(args.senderId);
                    if (args.voteGranted) {
                        if (this.votesGathered++ > Math.floor(this.clusterSize / 2)) {
                            this.state = State.LEADER;
                            this.rpcManager.sendReplication(this.term, this.log.length - 1, this.log[-1]?.term, [], this.commitIndex);
                            this.waitForHeartbeatTimeout();
                        }
                    }
                } else {
                    this.rpcManager.sendVote(sender, false);
                }
                break;
            }
            default:
                break;
        }
    }

    /**
     * Handles incoming Snapshot RPC messages.
     * @param {SocketCl} sender The socket representing the sender node.
     * @param {SnapshotParameters} args The parameters of the Snapshot RPC.
     */
    onSnapshotMessage(payload) {
        return; // Not implemented.
    }

    /**
     * Set a timeout for communications from the leader.
     * 
     * In case the timeout expires, starts a new election as a candidate.
     */
    waitForLeaderTimeout() {
        let extractedInterval = this.minLeaderTimeout + Math.random * (this.maxLeaderTimeout - this.minLeaderTimeout);
        let node = this;
        this.leaderTimeout = setInterval(function startNewElection() {
            node.state = State.CANDIDATE;
            node.currentTerm++;
            node.currentLeaderId = null;
            votesGathered = 1;
            node.rpcManager.sendElectionNotice(node.currentTerm, node.id, node.log.length - 1, node.log[-1]?.term);
            node.waitForElectionTimeout();  // Set a timeout in case the election doesn't end.
            node.waitForHeartbeatTimeout(); // Set a timeout in case other nodes do not respond.
        }, extractedInterval)
    }

    /**
     * Set a timeout for the current election.
     * 
     * In case the timeout expires, starts a new election as a candidate.
     */
    waitForElectionTimeout() {
        let extractedInterval = this.minElectionTimeout + Math.random * (this.maxElectionTimeout - this.minElectionTimeout);
        let node = this;
        this.electionTimeout = setInterval(function startNewElection() {
            node.state = State.CANDIDATE;
            node.currentTerm++;
            node.currentLeaderId = null;
            votesGathered = 1;
            node.rpcManager.sendElectionNotice(node.currentTerm, node.id, node.log.length - 1, node.log[-1]?.term);
            node.waitForElectionTimeout();  // Set a timeout in case the new election doesn't end.
            node.waitForHeartbeatTimeout(); // Set a timeout in case other nodes do not respond.
        }, extractedInterval)
    }

    /**
     * Set a timeout to wait for any heartbeat.
     * 
     * In case the timeout expires, sends another heartbeat of type depending on the current state.
     * @param {Number} matchIndex 
     * @param {String | null} nodeId The node to which we must send the heartbeat when the timeout expires. If null, the heartbeat is sent to all other nodes.
     */
    waitForHeartbeatTimeout(nodeId = null) {
        let thisNode = this;
        let sendHeartbeat = null;
        if (nodeId != null) { // The node is specified.
            if (thisNode.state === State.CANDIDATE) {  // The message sent is a vote request.
                sendHeartbeat = () => {
                    thisNode.rpcManager.sendElectionNoticeTo(thisNode.sockets.get(nodeId), thisNode.term, thisNode.id, thisNode.log.length - 1, thisNode.log[-1]?.term);
                    thisNode.waitForHeartbeatTimeout(nodeId);
                };
            } else if (thisNode.state === State.LEADER) {    // The message sent is a replication request.
                sendHeartbeat = () => {
                    let missingEntries = thisNode.log.slice(thisNode.matchIndex.get(nodeId) + 1);
                    let prevLogIndex = thisNode.nextIndex[nodeId] - 1;
                    let prevLogTerm = thisNode.log[prevLogIndex];
                    thisNode.rpcManager.sendReplicationTo(thisNode.sockets.get(nodeId), thisNode.term, prevLogIndex, prevLogTerm, missingEntries, thisNode.commitIndex + 1);
                    thisNode.waitForHeartbeatTimeout(nodeId);
                };
            } else { // Illegal state.
                throw new Error("Cannot send heartbeat when in state " + Object.entries(State).find(e => e[1] === thisNode.state)?.at(0));
            }

            // Starts the timeout.
            thisNode.heartbeatTimeouts.set(nodeId, setInterval(sendHeartbeat, thisNode.heartbeatTimeout));
        } else { // The node is unspecified.
            if (thisNode.state === State.CANDIDATE) {  // The message sent is a vote request.
                sendHeartbeat = (nodeId) => {
                    thisNode.rpcManager.sendElectionNoticeTo(nodeId, thisNode.term, thisNode.id, thisNode.log.length - 1, thisNode.log[-1]?.term);
                    thisNode.waitForHeartbeatTimeout(nodeId);
                };
            } else if (thisNode.state === State.LEADER) {    // The message sent is a replication request.
                sendHeartbeat = (nodeId) => {
                    let missingEntries = thisNode.log.slice(thisNode.matchIndex.get(nodeId) + 1);
                    let prevLogIndex = thisNode.nextIndex[nodeId] - 1;
                    let prevLogTerm = thisNode.log[prevLogIndex];
                    thisNode.rpcManager.sendReplicationTo(nodeId, thisNode.term, prevLogIndex, prevLogTerm, missingEntries, thisNode.commitIndex + 1);
                    thisNode.waitForHeartbeatTimeout(nodeId);
                };
            } else { // Illegal state.
                throw new Error("Cannot send heartbeat when in state " + Object.entries(State).find(e => e[1] === thisNode.state)?.at(0));
            }

            // Starts all the timeouts.
            this.heartbeatTimeouts.forEach((_, k) => {
                thisNode.heartbeatTimeouts.set(k, setInterval(() => sendHeartbeat(k), thisNode.heartbeatTimeout));
            });
        }
    }

    /**
    * Resets the leader timeout by stopping the current timeout and initiating a new one.
    */
    resetLeaderTimeout() {
        this.stopLeaderTimeout();
        this.waitForLeaderTimeout();
    }

    /**
     * Resets the election timeout by stopping the current timeout and initiating a new one.
     */
    resetElectionTimeout() {
        this.stopElectionTimeout();
        this.waitForElectionTimeout();
    }

    /**
     * Resets the heartbeat timeout for a specific node or all nodes.
     * @param {String | null} nodeId - The ID of the node for which to reset the heartbeat timeout.
     */
    resetHeartbeatTimeout(nodeId = null) {
        this.stopHeartbeatTimeout(nodeId);
        this.waitForHeartbeatTimeout(nodeId);
    }

    /**
     * Stops the leader timeout, preventing a new election from starting.
     */
    stopLeaderTimeout() {
        clearInterval(this.leaderTimeout);
    }

    /**
     * Stops the election timeout, preventing a new election from starting.
     */
    stopElectionTimeout() {
        clearInterval(this.electionTimeout);
    }

    /**
     * Stops the heartbeat timeout for a specific node or all nodes.
     * @param {String | null} nodeId - The ID of the node for which to stop the heartbeat timeout. If null, stops all timeouts.
     */
    stopHeartbeatTimeout(nodeId = null) {
        if (nodeId != null) {
            clearInterval(this.heartbeatTimeouts.get(nodeId));
        } else {
            this.sockets.forEach((_, id) => {
                clearInterval(this.heartbeatTimeouts.get(id));
            });
        }
    }
}