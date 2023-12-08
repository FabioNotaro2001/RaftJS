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
        /** @type {String} */
        this.creator = creator;
        /** @type {Number} */
        this.startingPrice = startingPrice;
        /** @type {Boolean} */
        this.closed = closed;
        /** @type {?Number} */
        this.highestBid = highestBid;
    }
}

export class GetAllOpenAuctionsResponse {
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objDescription 
     * @param {?String} objDescription 
     * @param {String} openingDate 
     * @param {Number} startingPrice 
     */
    constructor(auctionId, objDescription, objDescription, openingDate, startingPrice) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {String} */
        this.objectName = objDescription;
        /** @type {?String} */
        this.objDescription = objDescription;
        /** @type {Date} */
        this.openingDate = new Date(openingDate);
        /** @type {Number} */
        this.startingPrice = startingPrice;
    }
}

export class GetNewBidsResponse {
    /**
     * 
     * @param {Number} bidId 
     * @param {String} userMaker 
     * @param {Number} bidValue 
     * @param {String} bidDate 
     */
    constructor(bidId, userMaker, bidValue, bidDate) {
        /** @type {Number} */
        this.bidId = bidId;
        /** @type {String} */
        this.userMaker = userMaker;
        /** @type {Number} */
        this.bidValue = bidValue;
        /** @type {Date} */
        this.bidDate = new Date(bidDate);
    }
}

export class GetUserAuctionsResponse {
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objName 
     * @param {?String} objDescription 
     * @param {String} openingDate 
     * @param {?String} closingDate 
     * @param {Number} startingPrice 
    */
   constructor(auctionId, objName, objDescription, openingDate, closingDate, startingPrice) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {String} */
        this.objName = objName;
        /** @type {?String} */
        this.objDescription = objDescription;
        /** @type {Date} */
        this.openingDate = new Date(openingDate);
        /** @type {?Date} */
        this.closingDate = closingDate ? new Date(closingDate) : null;
        /** @type {Number} */
        this.startingPrice = startingPrice;
    }
}

export class GetUserParticipationsResponse { 
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objName 
     * @param {?String} objDescription 
     * @param {String} openingDate 
     * @param {Number} startingPrice 
    */
   constructor(auctionId, objName, objDescription, openingDate, startingPrice) {
       /** @type {Number} */
       this.auctionId = auctionId;
       /** @type {?String} */
       this.objName = objName;
       /** @type {?String} */
       this.objDescription = objDescription;
       /** @type {Date} */
       this.openingDate = new Date(openingDate);
       /** @type {Number} */
       this.startingPrice = startingPrice;
    }
}

export class GetLastBidsResponse { 
    /**
     * 
     * @param {Number} bidId 
     * @param {String} userMaker 
     * @param {Number} bidValue 
     * @param {String} bidDate 
    */
   constructor(bidId, userMaker, bidValue, bidDate) {
        /** @type {Number} */
        this.bidId = bidId;
        /** @type {String} */
        this.userMaker = userMaker;
        /** @type {Number} */
        this.bidValue = bidValue;
        /** @type {Date} */
        this.bidDate = new Date(bidDate);
    }
}