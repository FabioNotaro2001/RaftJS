import { LogRecord } from "./Log.js";

class RPCParameters {
    /**
     * Constructor of RPC paramters.
     * @param {String} senderId Sender's id.
     * @param {Number} term Sender's term.
     * @param {Boolean} isResponse True if the RPC related to the parameters is a response, else false if it's a request.
     */
    constructor(senderId, term, isResponse) {
        if(this.constructor == RPCParameters){
            throw new Error("Cannot instantiate the class!");
        }
        this.senderId = senderId;
        this.term = term;
        this.isResponse = isResponse;
    }
}

class AppendEntriesParameters extends RPCParameters {
    /**
     * Constructor for parameters related to a AppendEntries RPC.
     * @param {Number} term Leader’s term.
     * @param {Boolean} isResponse True if the RPC AppendEntries related to the parameters is a response, else false if it's a request.
     * @param {Number} prevLogIndex Index of log entry immediately preceding ones.
     * @param {Number} prevLogTerm Term of prevLogIndex entry.
     * @param {LogRecord[]} entries Log entries to store.
     * @param {Number} leaderCommit Leader’s commitIndex.
     * @param {Boolean} success True if follower contained entry matching prevLogIndex and prevLogTerm. Use only if is response = true.
     * @param {Number} matchIndex Use only if is response = true. 
     */
    constructor(senderId, term, isResponse, prevLogIndex, prevLogTerm, entries, leaderCommit, success, matchIndex) {
        super(senderId, term, isResponse);
        this.prevLogIndex = prevLogIndex;
        this.prevLogTerm = prevLogTerm;
        this.entries = entries;
        this.leaderCommit = leaderCommit;
        this.success = success;
        this.matchIndex = matchIndex;
    }

    /**
     * Static function that simplifies the call of AppendEntriesParameters in case of a request.
     * @param {String} senderId  Sender's id.
     * @param {Number} term Sender's term.
     * @param {Number} prevLogIndex Index of log entry immediately preceding ones.
     * @param {Number} prevLogTerm Term of prevLogIndex entry.
     * @param {LogRecord[]} entries Log entries to store.
     * @param {Number} leaderCommit Leader’s commitIndex.
     * @returns {AppendEntriesParameters} The instantiated new AppendEntriesParameters for a request.
     */
    static forRequest(senderId, term, prevLogIndex, prevLogTerm, entries, leaderCommit){
        return new AppendEntriesParameters(senderId, term, false, prevLogIndex, prevLogTerm, entries, leaderCommit, undefined, undefined);
    }

    /**
     * Static function that simplifies the call of AppendEntriesParameters in case of a response.
     * @param {Number} term Sender's term.
     * @param {Boolean} success True if follower contained entry matching prevLogIndex and prevLogTerm. Use only if is response = true.
     * @param {Number} matchIndex Index of highest log entry known to be replicated on server. Use only if is response = true. 
     * @returns {AppendEntriesParameters} The instantiated new AppendEntriesParameters for a response.
     */
    static forResponse(senderId, term, success, matchIndex){
        return new AppendEntriesParameters(senderId, term, true, undefined, undefined, undefined, undefined, success, matchIndex);
    }
}

class RequestVoteParameters extends RPCParameters {
    /**
     * Constructor for parameters related to RequestVote RPC.
     * @param {String} senderId Candidate's id.
     * @param {Number} term Candidate's term.
     * @param {Boolean} isResponse True if the RPC RequestVote related to the parameters is a response, else false if it's a request.
     * @param {Number} lastLogIndex Index of candidate’s last log entry.
     * @param {Number} lastLogTerm Term of candidate’s last log entry.
     * @param {Boolean} voteGranted True means candidate received vote.
     */
    constructor(senderId, term, isResponse, lastLogIndex, lastLogTerm, voteGranted) {
        super(senderId, term, isResponse);
        this.lastLogIndex = lastLogIndex; 
        this.lastLogTerm = lastLogTerm;
        this.voteGranted = voteGranted;
    }

    /**
     * Static function that simplifies the call of RequestVote in case of a request.
     * @param {String} senderId Candidate's id.
     * @param {Number} term Candidate's term.
     * @param {Number} lastLogIndex Index of candidate’s last log entry.
     * @param {Number} lastLogTerm Term of candidate’s last log entry.
     * @returns {RequestVoteParameters} The instantiated new RequestVoteParamters for a request.
     */
    static forRequest(senderId, term, lastLogIndex, lastLogTerm){
        return new RequestVoteParameters(senderId, term, false, lastLogIndex, lastLogTerm, undefined);
    }

    /**
     * Static function that simplifies the call of RequestVote in case of a response.
     * @param {Number} term Candidate's term.
     * @param {Boolean} voteGranted True means candidate received vote.
     * @returns {RequestVoteParameters} The instantiated new RequestVoteParamters for a response.
     */
    static forResponse(senderId, term, voteGranted){
        return new AppendEntriesParameters(senderId, term, true, undefined, undefined, voteGranted);
    }
}

class SnapshotParameters extends RPCParameters {
    /**
     * Constructor for parameters related to Snapshot RPC.
     * @param {String} senderId Leader's id.
     * @param {Number} term Leader’s term.
     * @param {Boolean} isResponse True if the RPC Snapshot related to the parameters is a response, else false if it's a request.
     * @param {Number} lastIncludedIndex The snapshot replaces all entries up through including this index
     * @param {Number} lastIncludedTerm Term of lastIncludedIndex.
     * @param {Number} offset Byte offset where chunk is positioned in the snapshot file.
     * @param {Object} data Raw bytes of the snapshot chunk, starting at offset.
     * @param {Boolean} done True if this is the last chunk.
     */
    constructor(senderId, term, isResponse, lastIncludedIndex, lastIncludedTerm, offset, data, done) {
        super(senderId, term, isResponse);
        this.lastIncludedIndex = lastIncludedIndex; 
        this.lastIncludedTerm = lastIncludedTerm;
        this.offset = offset;
        this.data = data;
        this.done = done;
    }

    /**
     * Static function that simplifies the call of Snapshot in case of a request.
     * @param {String} senderId Leader's id.
     * @param {Number} term Leader’s term.
     * @param {Number} lastIncludedIndex The snapshot replaces all entries up through including this index
     * @param {Number} lastIncludedTerm  Term of lastIncludedIndex.
     * @param {Number} offset Byte offset where chunk is positioned in the snapshot file.
     * @param {Object} data Raw bytes of the snapshot chunk, starting at offset.
     * @param {Boolean} done True if this is the last chunk.
     * @returns {SnapshotParameters} The instantiated new SnapshotParameters for a request.
     */
    static forRequest(senderId, term, lastIncludedIndex, lastIncludedTerm, offset, data, done){
        return new SnapshotParameters(senderId, term, false, lastIncludedIndex, lastIncludedTerm, offset, data, done);
    }

    /**
     * Static function that simplifies the call of Snapshot in case of a response.
     * @param {Number} term Leader’s term.
     * @returns {SnapshotParameters} The instantiated new SnapshotParameters for a response.
     */
    static forResponse(senderId, term){
        return new SnapshotParameters(senderId, term, true, undefined, undefined, undefined, undefined, undefined);
    }
}

export { RPCParameters, AppendEntriesParameters, RequestVoteParameters, SnapshotParameters };
