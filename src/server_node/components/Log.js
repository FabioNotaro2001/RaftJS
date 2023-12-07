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
     * @param {String} user 
     * @param {Date} startDate 
     * @param {String} objName 
     * @param {String} objDesc 
     * @param {Number} startPrice 
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
     * @param {String} user 
     * @param {Number} auctionId 
     * @param {Number} value 
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