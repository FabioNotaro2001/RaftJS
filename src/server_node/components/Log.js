import { CommandType } from "../enums/CommandType.js";
import { StatusResults } from "./DBManager.js";

/**
 * Entry of the log.
 */
export class LogRecord {
    /**
     * Creates a new log record.
     * @param {Number} term 
     * @param {String} commandType
     * @param {UserCreateData | AuctionCreateData | AuctionCloseData | BidCreateData} logData
     * @param {*} callback
     */
    constructor(term, commandType, logData, callback) {
        this.term = term;
        this.commandType = commandType;
        this.logData = logData;
        this.callback = callback;
    }
}

export class UserCreateData {
    /**
     * 
     * @param {String} username 
     * @param {String} password 
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}

export class AuctionCreateData {
    /**
     * 
     * @param {String} username 
     * @param {String} startDate 
     * @param {String} objName 
     * @param {String} objDesc 
     * @param {Number} startPrice 
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

export class AuctionCloseData {
    /**
     * 
     * @param {Number} auctionId 
     * @param {Date} closingDate 
     */
    constructor(auctionId, closingDate) {
        /** @type {Number} */
        this.auctionId = auctionId;
        /** @type {Date} */
        this.closingDate = closingDate;
    }
}

export class BidCreateData {
    /**
     * 
     * @param {String} username 
     * @param {Number} auctionId 
     * @param {Number} value 
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