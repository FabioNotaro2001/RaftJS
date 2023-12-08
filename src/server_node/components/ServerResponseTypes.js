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
    /**
     * 
     * @param {Number} bidId 
     * @param {String} user 
     * @param {Number} value 
     * @param {String} time 
     */
    constructor(bidId, user, value, time) {
        this.bidId = bidId;
        this.user = user;
        this.value = value;
        this.time = new Date(time);
    }
}

export class GetUserAuctionsResponse {
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objectName 
     * @param {String} objectDescription 
     * @param {String} openingDate 
     * @param {String} closingDate 
     * @param {Number} startingPrice 
     */
    constructor(auctionId, objectName, objectDescription, openingDate, closingDate, startingPrice) {
        this.auctionId = auctionId;
        this.objectName = objectName;
        this.objectDescription = objectDescription;
        this.openingDate = new Date(openingDate);
        this.closingDate = new Date(closingDate);
        this.startingPrice = startingPrice;
    }
}

export class GetUserParticipationsResponse { 
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objectName 
     * @param {String} objectDescription 
     * @param {String} openingDate 
     * @param {Number} startingPrice 
     */
    constructor(auctionId, objectName, objectDescription, openingDate, startingPrice) {
        this.auctionId = auctionId;
        this.objectName = objectName;
        this.objectDescription = objectDescription;
        this.openingDate = new Date(openingDate);
        this.startingPrice = startingPrice;
    }
}

export class GetLastBidsResponse { 
    /**
     * 
     * @param {Number} bidId 
     * @param {String} userMaker 
     * @param {Number} value 
     * @param {String} time 
     */
    constructor(bidId, userMaker, value, time) {
        this.bidId = bidId;
        this.userMaker = userMaker;
        this.value = value;
        this.time = new Date(time);
    }
}