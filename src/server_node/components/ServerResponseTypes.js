export class GetAuctionInfoResponse {
    /**
     * 
     * @param {String} creator 
     * @param {String} objName 
     * @param {String} objDesc 
     * @param {Number} startingPrice 
     * @param {Boolean} closed 
     * @param {?Number} highestBidValue 
     */
    constructor(creator, objName, objDesc, startingPrice, closed, highestBidValue) {
        /** @type {String} */
        this.creator = creator;
        /** @type {String} */
        this.objName = objName;
        /** @type {String} */
        this.objDesc = objDesc;
        /** @type {Number} */
        this.startingPrice = startingPrice;
        /** @type {Boolean} */
        this.closed = closed;
        /** @type {?Number} */
        this.highestBid = highestBidValue;
    }
}

export class GetAllOpenAuctionsResponse {
    /**
     * 
     * @param {Number} auctionId 
     * @param {String} objName 
     * @param {?String} objDescription 
     * @param {String} openingDate 
     * @param {Number} startingPrice 
     * @param {?Number} highestBidValue
     */
    constructor(auctionId, objName, objDescription, openingDate, startingPrice, highestBidValue) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {String} */
        this.objName = objName;
        /** @type {?String} */
        this.objDescription = objDescription;
        /** @type {Date} */
        this.openingDate = new Date(openingDate);
        /** @type {Number} */
        this.startingPrice = startingPrice;
        /** @type {?Number}*/
        this.highestBidValue = highestBidValue;
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