/**
 * Response class for retrieving auction information.
 */
export class GetAuctionInfoResponse {
    /**
     * @param {String} creator Creator of the auction.
     * @param {String} objName Name of the auctioned object.
     * @param {String} objDesc Description of the auctioned object.
     * @param {Number} startingPrice Starting price of the auction.
     * @param {Boolean} closed Indicates whether the auction is closed.
     * @param {?Number} highestBidValue Value of the highest bid, if any.
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

/**
 * Response class for retrieving information on all open auctions.
 */
export class GetAllOpenAuctionsResponse {
    /**
     * @param {Number} auctionId ID of the auction.
     * @param {String} objName Name of the auctioned object.
     * @param {?String} objDescription Description of the auctioned object.
     * @param {String} openingDate Date when the auction opens.
     * @param {Number} startingPrice Starting price of the auction.
     * @param {?Number} highestBidValue Value of the highest bid, if any.
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
        /** @type {?Number} */
        this.highestBidValue = highestBidValue;
    }
}

/**
 * Response class for retrieving information on new bids.
 */
export class GetNewBidsResponse {
    /**
     * @param {Number} bidId ID of the bid.
     * @param {String} userMaker User making the bid.
     * @param {Number} bidValue Value of the bid.
     * @param {String} bidDate Date when the bid was made.
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

/**
 * Response class for retrieving information on auctions associated with a user.
 */
export class GetUserAuctionsResponse {
    /**
     * @param {Number} auctionId ID of the auction.
     * @param {String} objName Name of the auctioned object.
     * @param {?String} objDescription Description of the auctioned object.
     * @param {String} openingDate Date when the auction opens.
     * @param {?String} closingDate Date when the auction closes, if available.
     * @param {Number} startingPrice Starting price of the auction.
     * @param {?Number} highestBidValue Highest bid in the auction.
     */
    constructor(auctionId, objName, objDescription, openingDate, closingDate, startingPrice, highestBidValue) {
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
        /** @type {?Number} */
        this.highestBidValue = highestBidValue;
    }
}

/**
 * Response class for retrieving information on user participations in auctions.
 */
export class GetUserParticipationsResponse { 
    /**
     * @param {Number} auctionId ID of the auction.
     * @param {String} objName Name of the auctioned object.
     * @param {?String} objDescription Description of the auctioned object.
     * @param {String} openingDate Date when the auction opens.
     * @param {Number} startingPrice Starting price of the auction.
     * @param {?Number} highestBidValue Highest bid in the auction.
     */
    constructor(auctionId, objName, objDescription, openingDate, startingPrice, highestBidValue) {
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
       /** @type {?Number} */
       this.highestBidValue = highestBidValue;
    }
}

/**
 * Response class for retrieving information on the latest bids.
 */
export class GetLastBidsResponse { 
    /**
     * @param {Number} bidId ID of the bid.
     * @param {String} userMaker User making the bid.
     * @param {Number} bidValue Value of the bid.
     * @param {String} bidDate Date when the bid was made.
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
