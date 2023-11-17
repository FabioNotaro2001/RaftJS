import { LogRecord } from "./Log";

class RPCParameters {
    /**
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Boolean} isResponse 
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
     * 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {Number} prevLogIndex 
     * @param {Number} prevLogTerm 
     * @param {LogRecord[]} entries 
     * @param {Number} leaderCommit 
     * @param {Boolean} success Use only if is response = true.
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
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Number} prevLogIndex 
     * @param {Number} prevLogTerm 
     * @param {LogRecord[]} entries 
     * @param {Number} leaderCommit 
     * @returns 
     */
    static forRequest(senderId, term, prevLogIndex, prevLogTerm, entries, leaderCommit){
        return new AppendEntriesParameters(senderId, term, false, prevLogIndex, prevLogTerm, entries, leaderCommit, undefined, undefined);
    }

    /**
     * 
     * @param {Number} term 
     * @param {Boolean} success 
     * @param {Number} matchIndex 
     * @returns 
     */
    static forResponse(senderId, term, success, matchIndex){
        return new AppendEntriesParameters(senderId, term, true, undefined, undefined, undefined, undefined, success, matchIndex);
    }
}

class RequestVoteParameters extends RPCParameters {
    /**
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {Number} lastLogIndex 
     * @param {Number} lastLogTerm 
     * @param {Boolean} voteGranted 
     */
    constructor(senderId, term, isResponse, lastLogIndex, lastLogTerm, voteGranted) {
        super(senderId, term, isResponse);
        this.lastLogIndex = lastLogIndex; 
        this.lastLogTerm = lastLogTerm;
        this.voteGranted = voteGranted;
    }

    /**
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Number} lastLogIndex 
     * @param {Number} lastLogTerm 
     * @returns 
     */
    static forRequest(senderId, term, lastLogIndex, lastLogTerm){
        return new RequestVoteParameters(senderId, term, false, lastLogIndex, lastLogTerm, undefined);
    }

    /**
     * 
     * @param {Number} term 
     * @param {Boolean} voteGranted 
     * @returns 
     */
    static forResponse(senderId, term, voteGranted){
        return new AppendEntriesParameters(senderId, term, true, undefined, undefined, voteGranted);
    }
}

class SnapshotParameters extends RPCParameters {
    /**
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {Number} lastIncludedIndex 
     * @param {Number} lastIncludedTerm 
     * @param {Number} offset 
     * @param {Object} data 
     * @param {Boolean} done 
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
     * 
     * @param {String} senderId 
     * @param {Number} term 
     * @param {Number} lastIncludedIndex 
     * @param {Number} lastIncludedTerm 
     * @param {Number} offset 
     * @param {Object} data 
     * @param {Boolean} done 
     * @returns 
     */
    static forRequest(senderId, term, lastIncludedIndex, lastIncludedTerm, offset, data, done){
        return new SnapshotParameters(senderId, term, false, lastIncludedIndex, lastIncludedTerm, offset, data, done);
    }

    /**
     * 
     * @param {Number} term 
     * @returns 
     */
    static forResponse(senderId, term){
        return new SnapshotParameters(senderId, term, true, undefined, undefined, undefined, undefined, undefined);
    }
}

export { RPCParameters, AppendEntriesParameters, RequestVoteParameters, SnapshotParameters };
