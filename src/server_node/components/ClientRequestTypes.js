export class NewUserRequest {
    /**
     * 
     * @param {String} username The name of the new user.
     * @param {String} password The password of the new user.
     */
    constructor(username, password) {
        /** @type {String} */
        this.username = username;
        /** @type {String} */
        this.password = password;
    }
}

export class NewAuctionRequest {
    /**
     * 
     * @param {String} username The name of the user creating the auction.
     * @param {Date} startDate The date of the start of the auction.
     * @param {String} objName The name of the object up for auction.
     * @param {String} objDesc A description of the object being auctioned.
     * @param {Number} startPrice The starting price of the auction.
     */
    constructor(username, startDate, objName, objDesc, startPrice) {
        /** @type {String} */
        this.username = username;
        /** @type {String} */
        this.startDate = startDate.toISOString();
        /** @type {String} */
        this.objName = objName;
        /** @type {String} */
        this.objDesc = objDesc;
        /** @type {Number} */
        this.startPrice = startPrice;
    }
}

export class NewBidRequest {
    /**
     * 
     * @param {String} username The name of the user making the bid.
     * @param {Number} auctionId The id of the auction the bid is being made on.
     * @param {Number} bidValue The value of the bid.
     */
    constructor(username, auctionId, bidValue) {
        /** @type {String} */
        this.username = username;
        /** @type {String} */
        this.auctionId = auctionId;
        /** @type {Number} */
        this.bidValue = bidValue;
    }
}

export class CloseAuctionRequest {
    /**
     * 
     * @param {Number} auctionId The id of the auction being closed.
     * @param {Date} closingDate The date of end of the auction.
     */
    constructor(auctionId, closingDate) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {String} */
        this.closingDate = closingDate.toISOString();
    }
}

