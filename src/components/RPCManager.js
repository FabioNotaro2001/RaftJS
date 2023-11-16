import { Server } from 'socket.io';
import { RPCType } from '../enums/RPCType.js';
import { RPCParameters, AppendEntriesParameters, RequestVoteParameters, SnapshotParameters } from './RPCParameters.js';


class RPCManager {

    /**
     * 
     * @param {Server[]} sockets Array of peer sockets.
     */
    constructor(sockets, currentId){
        this.sockets = sockets;
        this.currentId = currentId;
    }


    /**
     * 
     * @param {Server} receiver Destination server. 
     * @param {String} rpcType 
     * @param {RPCParameters} rpcParameters 
     */
    sendTo(receiver, rpcType, rpcParameters) {
        receiver.emit(rpcType, rpcParameters);
    }

    /**
     * 
     * @param {RPCType} rpcType 
     * @param {RPCParameters} rpcParameters 
     */
    sendAll(rpcType, rpcParameters) {
        this.sockets.forEach(s => {
            s.emit(rpcType, rpcParameters);
        })
    }
    
    /**
     * 
     * @param {Number} term 
     * @param {Number} prevLogIndex 
     * @param {Number} prevLogTerm 
     * @param {Number} leaderCommit 
     */
    sendHeartbeat(term, prevLogIndex, prevLogTerm, leaderCommit) {
        this.sendAll(RPCType.APPENDENTRIES, AppendEntriesParameters.forRequest(term, this.currentId, prevLogIndex, prevLogTerm, [], leaderCommit));
    }
    
    /**
     * 
     * @param {Server} receiver 
     * @param {Number} term 
     * @param {Boolean} success 
     * @param {Number} matchIndex 
     */
    sendHearbeatResponse(receiver, term, success, matchIndex ) {
        this.sendTo(receiver, RPCType.APPENDENTRIES, AppendEntriesParameters.forResponse(term, success, matchIndex));
    }

    sendReplication() {

    }

    sendReplicationResponse() {

    }

    sendElectionNotice() {

    }

    sendVote() {

    }

}