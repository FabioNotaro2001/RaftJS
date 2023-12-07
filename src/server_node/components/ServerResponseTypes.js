// TODO: all types for fields (and comments for constructor arguments)

export class GetAuctionInfoResponse {
    /**
     * 
     * @param {String} creator 
     * @param {Number} startingPrice 
     * @param {Boolean} closed 
     * @param {?Number} highestBid 
     */
    constructor(creator, startingPrice, closed, highestBid) {
        this.creator = creator;
        this.startingPrice = startingPrice;
        this.closed = closed;
        this.highestBid = highestBid;
    }
}

export class GetAllOpenAuctionsResponse {
    /**
     * 
     * @param {Number} id 
     * @param {String} objName 
     * @param {String} objdesc 
     * @param {String} date 
     * @param {Number} sp 
     */
    constructor(id, objName, objDesc, date, sp) {
        this.id = id;
        this.objName = objName;
        this.objDesc = objDesc;
        this.date = new Date(date);
        this.sp = sp;
    }
}

export class GetNewBidsResponse {
    constructor() {    // TODO: complete from fields in queryGetNewerBids return value

    }
}

export class GetUserAuctionsResponse {   // TODO: complete from fields in corresponding method's return value
    constructor() {

    }
}

export class GetUserParticipationsResponse { // TODO: complete from fields in corresponding method's return value
    constructor() {

    }
}

export class GetLastBidsResponse {   // TODO: complete from fields in corresponding method's return value
    constructor() {

    }
}