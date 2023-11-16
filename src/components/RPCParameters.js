class RPCParameters {
    /**
     * 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     */
    constructor(term, isResponse) {
        if(this.constructor == RPCParameters){
            throw new Error("Cannot instantiate the class!");
        }
        this.term = term;
        this.isResponse = isResponse;
    }
}

class AppendEntriesParameters extends RPCParameters {
    /**
     * 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {any} leaderId 
     * @param {Number} prevLogIndex 
     * @param {Number} prevLogTerm 
     * @param {Log[]} entries 
     * @param {Number} leaderCommit 
     * @param {Boolean} success Use only if is response = true.
     * @param {Number} matchIndex Use only if is response = true. 
     */
    constructor(term, isResponse, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit, success, matchIndex) {
        super(term, isResponse);
        this.leaderId = leaderId;
        this.prevLogIndex = prevLogIndex;
        this.prevLogTerm = prevLogTerm;
        this.entries = entries;
        this.leaderCommit = leaderCommit;
        this.success = success;
        this.matchIndex = matchIndex;
    }

    /**
     * 
     * @param {Number} term 
     * @param {any} leaderId 
     * @param {Number} prevLogIndex 
     * @param {Number} prevLogTerm 
     * @param {Log[]} entries 
     * @param {Number} leaderCommit 
     * @returns 
     */
    static forRequest(term, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit){
        return new AppendEntriesParameters(term, false, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit, undefined, undefined);
    }

    /**
     * 
     * @param {Number} term 
     * @param {Boolean} success 
     * @param {Number} matchIndex 
     * @returns 
     */
    static forResponse(term, success, matchIndex){
        return new AppendEntriesParameters(term, true, undefined, undefined, undefined, undefined, undefined, success, matchIndex);
    }
}

class RequestVoteParameters extends RPCParameters {
    /**
     * 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {any} candidateId 
     * @param {Number} lastLogIndex 
     * @param {Number} lastLogTerm 
     * @param {Boolean} voteGranted 
     */
    constructor(term, isResponse, candidateId, lastLogIndex, lastLogTerm, voteGranted) {
        super(term, isResponse);
        this.candidateId = candidateId;
        this.lastLogIndex = lastLogIndex; 
        this.lastLogTerm = lastLogTerm;
        this.voteGranted = voteGranted;
    }

    /**
     * 
     * @param {Number} term 
     * @param {any} candidateId 
     * @param {Number} lastLogIndex 
     * @param {Number} lastLogTerm 
     * @returns 
     */
    static forRequest(term, candidateId, lastLogIndex, lastLogTerm){
        return new RequestVoteParameters(term, false, candidateId, lastLogIndex, lastLogTerm, undefined);
    }

    /**
     * 
     * @param {Number} term 
     * @param {Boolean} voteGranted 
     * @returns 
     */
    static forResponse(term, voteGranted){
        return new AppendEntriesParameters(term, true, undefined, undefined, undefined, voteGranted);
    }
}

class SnapshotParameters extends RPCParameters {
    /**
     * 
     * @param {Number} term 
     * @param {Boolean} isResponse 
     * @param {any} leaderId 
     * @param {Number} lastIncludedIndex 
     * @param {Number} lastIncludedTerm 
     * @param {Number} offset 
     * @param {Object} data 
     * @param {Boolean} done 
     */
    constructor(term, isResponse, leaderId, lastIncludedIndex, lastIncludedTerm, offset, data, done) {
        super(term, isResponse);
        this.leaderId = leaderId;
        this.lastIncludedIndex = lastIncludedIndex; 
        this.lastIncludedTerm = lastIncludedTerm;
        this.offset = offset;
        this.data = data;
        this.done = done;
    }

    /**
     * 
     * @param {Number} term 
     * @param {any} leaderId 
     * @param {Number} lastIncludedIndex 
     * @param {Number} lastIncludedTerm 
     * @param {Number} offset 
     * @param {Object} data 
     * @param {Boolean} done 
     * @returns 
     */
    static forRequest(term, leaderId, lastIncludedIndex, lastIncludedTerm, offset, data, done){
        return new SnapshotParameters(term, false, leaderId, lastIncludedIndex, lastIncludedTerm, offset, data, done);
    }

    /**
     * 
     * @param {Number} term 
     * @returns 
     */
    static forResponse(term){
        return new SnapshotParameters(term, true, undefined, undefined, undefined, undefined, undefined, undefined);
    }
}

export { RPCParameters, AppendEntriesParameters, RequestVoteParameters, SnapshotParameters };
