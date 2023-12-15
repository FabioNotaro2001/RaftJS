import { CommandType } from "../enums/CommandType.js";
import { StatusResults } from "./DBManager.js";

/**
 * Entry of the log.
 */
export class LogRecord {
    /**
     * Creates a new log record.
     * @param {Number} term The term associated with the log record.
     * @param {CommandType} commandType The type of command associated with the log record.
     * @param {UserCreateData | AuctionCreateData | AuctionCloseData | BidCreateData} logData The data associated with the log record.
     * @param {*} callback The callback associated with the log record.
     */
    constructor(term, commandType, logData, callback) {
        this.term = term;
        this.commandType = commandType;
        this.logData = logData;
        this.callback = callback;
    }
}

/**
 * Data structure for creating a new user.
 */
export class UserCreateData {
    /**
     * Creates user creation data.
     * @param {String} username The username of the new user.
     * @param {String} password The password of the new user.
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}

/**
 * Data structure for creating a new auction.
 */
export class AuctionCreateData {
    /**
     * Creates auction creation data.
     * @param {String} username The username of the user creating the auction.
     * @param {String} startDate The start date of the auction.
     * @param {String} objName The name of the object being auctioned.
     * @param {String} objDesc The description of the object being auctioned.
     * @param {Number} startPrice The starting price of the auction.
     */
    constructor(username, startDate, objName, objDesc, startPrice) {
        /** @type {String} */
        this.username = username;
        /** @type {String} */
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
 * Data structure for closing an auction.
 */
export class AuctionCloseData {
    /**
     * Creates auction closure data.
     * @param {Number} auctionId The ID of the auction being closed.
     * @param {String} closingDate The date of the auction closure.
     */
    constructor(auctionId, closingDate) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {String} */
        this.closingDate = closingDate;
    }
}

/**
 * Data structure for creating a new bid.
 */
export class BidCreateData {
    /**
     * Creates bid creation data.
     * @param {String} username The username of the user making the bid.
     * @param {Number} auctionId The ID of the auction the bid is being made on.
     * @param {Number} value The value of the bid.
     */
    constructor(username, auctionId, value) {
        /** @type {String} */
        this.username = username;
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {Number} */
        this.value = value;
    }
}