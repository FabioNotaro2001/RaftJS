import { createServer, Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { Socket as SocketCl, io } from "socket.io-client"
import { RPCType } from "../enums/RPCType";
import { AppendEntriesParameters, RPCParameters } from "./RPCParameters";
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

        /** @type {Map<String, SocketCl>} */
        this.sockets = new Map();
        otherNodes.forEach((host, id) => {
            let sock = io(host, {
                autoConnect: false
            });
            
            sock.connect();
            
            this.sockets.set(id, sock);            
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
            switch(this.state) {
                case State.LEADER: {
                    // Stop heartbeat timer.
                    break;
                }
                case State.CANDIDATE: {
                    // Stop election timer.
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
                    this.matchIndex.set(args.senderId,args.matchIndex);
                    this.nextIndex.set(args.senderId, args.matchIndex + 1);
                    
                    let prevLogIndex = this.nextIndex[args.senderId] - 1;
                    let prevlogTerm = this.log[prevLogIndex];
                    
                    // Sends missing entries to the node.
                    let missingEntries = this.log.slice(args.matchIndex + 1);
                    if (missingEntries.length > 0) {
                        // TODO: Ricordati di chiamare resetHeartbeat() per lo specifico socket/nodo.
                        this.rpcManager.sendReplicationTo(sender, this.currentTerm, prevLogIndex, prevlogTerm, missingEntries, this.commitIndex);
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
        // TODO: Per le risposte ricordarsi di cancellare il timeout di heartbeat collegato allo spceifico socket/nodo chiamando il metodo stopHeartbeat() per lo specifico nodo.
    }

    /**
     * Placeholder for handling incoming Snapshot RPC messages.
     * @param {any} payload The payload of the Snapshot RPC.
     */
    onSnapshotMessage(payload) {

    }

    /**
     * Set a timeout for communications from the leader.
     * 
     * In case the timeout expires, starts a new election as a candidate.
     */
    waitForLeaderTimeout(){
        let extractedInterval = this.minLeaderTimeout + Math.random * (this.maxLeaderTimeout - this.minLeaderTimeout);
        let node = this;
        this.leaderTimeout = setInterval(function startNewElection(){
            node.state = State.CANDIDATE;
            node.currentTerm++;
            node.currentLeaderId = null;
            votesGathered = 1;
            node.rpcManager.sendElectionNotice(node.currentTerm, node.id, node.log.length-1, node.log[-1].term);
            node.waitForElectionTimeout();  // Set a timeout in case the election doesn't end.
            node.waitForHeartbeatTimeout(); // Set a timeout in case other nodes do not respond.
        }, extractedInterval)
    }

    /**
     * Set a timeout for the current election.
     * 
     * In case the timeout expires, starts a new election as a candidate.
     */
    waitForElectionTimeout(){
        let extractedInterval = this.minElectionTimeout + Math.random * (this.maxElectionTimeout - this.minElectionTimeout);
        let node = this;
        this.electionTimeout = setInterval(function startNewElection(){
            node.state = State.CANDIDATE;
            node.currentTerm++;
            node.currentLeaderId = null;
            votesGathered = 1;
            node.rpcManager.sendElectionNotice(node.currentTerm, node.id, node.log.length-1, node.log[-1].term);
            node.waitForElectionTimeout();  // Set a timeout in case the new election doesn't end.
            node.waitForHeartbeatTimeout(); // Set a timeout in case other nodes do not respond.
        }, extractedInterval)
    }

    /**
     * Set a timeout to wait for any heartbeat.
     * 
     * In case the timeout expires, sends another heartbeat of type depending on the current state.
     * @param {String | null} nodeId The node to which we must send the heartbeat when the timeout expires. If null, the heartbeat is sent to all other nodes. 
     */
    waitForHeartbeatTimeout(nodeId = null){
        let node = this;
        let sendHeartbeat = null;
        if(nodeId != null){ // The node is specified.
            if(node.state === State.CANDIDATE){  // The message sent is a vote request.
                sendHeartbeat = () => {
                    node.rpcManager.sendElectionNoticeTo(node.sockets.get(nodeId), node.term, node.id, node.log.length - 1, node.log[-1].term);
                    node.waitForHeartbeatTimeout(nodeId);
                }; 
            } else if (node.state === State.LEADER){    // The message sent is a replication request.
                sendHeartbeat = () => {
                    node.rpcManager.sendReplicationTo(node.sockets.get(nodeId), node.term, node.log.length - 1, node.log[-1].term);
                    node.waitForHeartbeatTimeout(nodeId);
                }; 
            } else{ // Illegal state.
                throw new Error("Cannot send heartbeat when in state " + Object.entries(State).find(e => e[1] === node.state)?.at(0));
            }

            // Starts the timeout.
            node.heartbeatTimeouts.set(nodeId, setInterval(sendHeartbeat, node.heartbeatTimeout));
        } else{ // The node is unspecified.
            if(node.state === State.CANDIDATE){  // The message sent is a vote request.
                sendHeartbeat = () => {
                    node.rpcManager.sendElectionNotice(node.term, node.id, node.log.length - 1, node.log[-1].term);
                    node.waitForHeartbeatTimeout();
                }; 
            } else if (node.state === State.LEADER){    // The message sent is a replication request.
                sendHeartbeat = () => {
                    node.rpcManager.sendReplication(node.term, node.log.length - 1, node.log[-1].term);
                    node.waitForHeartbeatTimeout();
                }; 
            } else{ // Illegal state.
                throw new Error("Cannot send heartbeat when in state " + Object.entries(State).find(e => e[1] === node.state)?.at(0));
            }
            
            // Starts all the timeouts.
            this.heartbeatTimeouts.forEach((_, k) => {
                node.heartbeatTimeouts.set(k, setInterval(sendHeartbeat, node.heartbeatTimeout));
            });
        }
    }

    resetLeaderTimeout(){

    }

    resetElectionTimeout(){

    }

    resetForHeartbeatTimeout(socketId){

    }

    stopLeaderTimeout(){

    }

    stopElectionTimeout(){

    }

    stopHeartbeatTimeout(socketId){

    }

    stopAllHeartbeatTimeouts(socketIds){

    }
}