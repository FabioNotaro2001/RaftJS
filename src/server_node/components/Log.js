import { CommandType } from "../enums/CommandType.js";

/**
 * Represents an entry in the log.
 */
export class LogRecord {
    /**
     * Creates a new log record.
     * @param {Number} term - The term of the log entry.
     * @param {CommandType} commandType - The type of command associated with the log entry.
     * @param {UserCreateData | AuctionCreateData | AuctionCloseData | BidCreateData} logData - Data associated with the log entry.
     * @param {*} callback - A callback function associated with the log entry.
     */
    constructor(term, commandType, logData, callback) {
        this.term = term;
        this.commandType = commandType;
        this.logData = logData;
        this.callback = callback;
    }
}

/**
 * Represents data for creating a new user.
 */
export class UserCreateData {
    /**
     * Creates user creation data.
     * @param {String} username - The username of the new user.
     * @param {String} password - The password of the new user.
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}

/**
 * Represents data for creating a new auction.
 */
export class AuctionCreateData {
    /**
     * Creates auction creation data.
     * @param {String} user - The user creating the auction.
     * @param {Date} startDate - The start date of the auction.
     * @param {String} objName - The name of the auctioned object.
     * @param {String} objDesc - The description of the auctioned object.
     * @param {Number} startPrice - The starting price of the auction.
     */
    constructor(user, startDate, objName, objDesc, startPrice) {
        /** @type {String} */
        this.user = user;
        /** @type {Date} */
        this.startDate = startDate;
        /** @type {String} */
        this.objName = objName;
        /** @type {String} */
        this.objDesc = objDesc;
        /** @type {Number} */
        this.startPrice = startPrice;
    }
}

/**
 * Represents data for closing an auction.
 */
export class AuctionCloseData {
    /**
     * Creates auction closure data.
     * @param {Number} auctionId - The ID of the auction to close.
     * @param {Date} closingDate - The date when the auction will be closed.
     */
    constructor(auctionId, closingDate) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {Date} */
        this.closingDate = closingDate;
    }
}

/**
 * Represents data for creating a new bid.
 */
export class BidCreateData {
    /**
     * Creates bid creation data.
     * @param {String} user - The user making the bid.
     * @param {Number} auctionId - The ID of the auction.
     * @param {Number} value - The value of the bid.
     */
    constructor(user, auctionId, value) {
        /** @type {String} */
        this.user = user;
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {Number} */
        this.value = value;
    }
}
