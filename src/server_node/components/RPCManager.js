import { Socket as SocketCl } from 'socket.io-client';
import { RPCType } from '../enums/RPCType.js';
import { RPCParameters, AppendEntriesParameters, RequestVoteParameters, SnapshotParameters } from './RPCParameters.js';
import { LogRecord } from './Log.js';

/**
 * Class containing the methods for sending RPCs to other nodes.
 */
export class RPCManager {

    /**
     * Creates an instance of the class.
     * @param {Map<String, SocketCl>} sockets Map from IDs to sockets.
     * @param {String} nodeId Id of the node linked to this manager instance.
     */
    constructor(sockets, nodeId) {
        this.sockets = sockets;
        this.currentId = nodeId;
    }

    /**
     * Send a specified RPC and its parameters to a specified destination server.
     * @param {SocketCl} receiver Destination server. 
     * @param {String} rpcType Type of RPC to be sent to the receiver.
     * @param {RPCParameters} rpcParameters Parameters useful for the RPC.
     */
    sendTo(receiver, rpcType, rpcParameters) {
        if (receiver.connected) {
            receiver.emit(rpcType, rpcParameters);
        }
    }

    /**
     * Send a specified RPC and its parameters to all other destination servers (a sort of broadcast of RPC).
     * @param {RPCType} rpcType Type of RPC to be sent to the list of other servers.
     * @param {RPCParameters} rpcParameters Parameterrs useful for the RPC.
     */
    sendAll(rpcType, rpcParameters) {
        this.sockets.forEach((s, _) => {
            if (s.connected) {
                s.emit(rpcType, rpcParameters);
            }
        });
    }

    /**
     * RPC request for appending entries and log replication.
     * @param {Number} term Leader's current term.
     * @param {Number} prevLogIndex Index of log entry immediately preceding new ones.
     * @param {Number | null} prevLogTerm Term of prevLogIndex entry
     * @param {LogRecord[]} entries Log entries to store.
     * @param {Number} leaderCommit Leader’s commitIndex
     */
    sendReplication(term, prevLogIndex, prevLogTerm, entries, leaderCommit) {
        this.sendAll(RPCType.APPENDENTRIES, AppendEntriesParameters.forRequest(this.currentId, term, prevLogIndex, prevLogTerm, entries, leaderCommit));
    }

    /**
     * RPC request for appending entries and log replication in a single node.
     * @param {SocketCl} receiver 
     * @param {Number} term Leader's current term.
     * @param {Number} prevLogIndex Index of log entry immediately preceding new ones.
     * @param {Number | null} prevLogTerm Term of prevLogIndex entry
     * @param {LogRecord[]} entries Log entries to store.
     * @param {Number} leaderCommit Leader’s commitIndex
     */
    sendReplicationTo(receiver, term, prevLogIndex, prevLogTerm, entries, leaderCommit) {
        this.sendTo(receiver, RPCType.APPENDENTRIES, AppendEntriesParameters.forRequest(this.currentId, term, prevLogIndex, prevLogTerm, entries, leaderCommit));
    }
    
    /**
     * RPC response for appending entries and log replication.
     * @param {SocketCl} receiver Socket of the server who sent the replication request (the leader).
     * @param {Number} term CurrentTerm, for leader to update itself.
     * @param {Boolean} success True if follower contained entry matching revLogIndex and prevLogTerm.
     * @param {Number} matchIndex Index of highest log entry known to be replicated on follower's server.
     */
    sendReplicationResponse(receiver, term, success, commitIndex, lastApplied) {
        this.sendTo(receiver, RPCType.APPENDENTRIES, AppendEntriesParameters.forResponse(this.currentId, term, success, commitIndex, lastApplied));
    }
    
    /**
     * RPC request made by a candidate for requesting a new leader election.
     * @param {Number} term Candidate’s term.
     * @param {Number} lastLogIndex Index of candidate’s last log entry.
     * @param {Number | null} lastLogTerm Term of candidate’s last log entry.
     */
    sendElectionNotice(term, lastLogIndex, lastLogTerm) {
        this.sendAll(RPCType.REQUESTVOTE, RequestVoteParameters.forRequest(this.currentId, term, lastLogIndex, lastLogTerm));
    }

    /**
     * RPC request made by a candidate for requesting a new leader election to a single node.
     * @param {SocketCl} receiver 
     * @param {Number} term Candidate’s term.
     * @param {Number} lastLogIndex Index of candidate’s last log entry.
     * @param {Number | null} lastLogTerm Term of candidate’s last log entry.
     */
    sendElectionNoticeTo(receiver, term, lastLogIndex, lastLogTerm) {
        this.sendTo(receiver, RPCType.REQUESTVOTE, RequestVoteParameters.forRequest(this.currentId, term, lastLogIndex, lastLogTerm));
    }
    
    /**
     * RPC response made by a server for voting during a new leader election.
     * @param {SocketCl} receiver Socket of the candidate who started the election.
     * @param {Boolean} voteGranted True means candidate received vote.
     */
    sendVote(receiver, term, voteGranted) {
        this.sendTo(receiver, RPCType.REQUESTVOTE, RequestVoteParameters.forResponse(this.currentId, term, voteGranted));
    }
    
    /**
     * Send a snapshot RPC message to all other nodes.
     */
    sendSnapshotMessage() {
        this.sendAll(RPCType.SNAPSHOT, SnapshotParameters.forRequest(/* ... */))
    } 

    /**
     * Send a snapshot RPC response to a specified receiver.
     * @param {SocketCl} receiver Socket of the node to receive the snapshot response.
     */
    sendSnapshotResponse(receiver) {
        this.sendTo(receiver, RPCType.SNAPSHOT, SnapshotParameters.forResponse(/* ... */))
    } 
}