import * as mysql from "mysql2/promise";
import { GetAllOpenAuctionsResponse, GetAuctionInfoResponse, GetLastBidsResponse, GetNewBidsResponse, GetUserAuctionsResponse, GetUserParticipationsResponse } from "./ServerResponseTypes.js";

export class StatusResults {
    /**
     * 
     * @param {Boolean} success 
     * @param {String} info 
     */
    constructor(success, info) {
        /** @type {Boolean} */
        this.success = success;
        /** @type {String} */
        this.info = info;
    }

    /**
     * 
     * @param {String} info 
     */
    static success(info) {
        return new StatusResults(true, info);
    }

    /**
     * 
     * @param {String} info 
     */
    static failure(info) {
        return new StatusResults(false, info);
    }
}

export class DBManager {
    /**
     * Constructor for the DBManager class.
     * @param {String} host The database host.
     * @param {String} user The database user.
     * @param {String} password The database password.
     */
    constructor(host, user, password, database) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.database = database;

        // Configure database connection.
        this.connection = null;
        this.firstConnection = true;
    }

    /**
     * Establishes a connection to the database.
     */
    async connect() {
        this.connection = await mysql.createConnection({
            host: this.host,    // According to configuration.
            user: this.user, // Username.
            password: this.password, // Password.
            database: this.database
        });

        if (this.firstConnection) {
            // Delete all tables contents if this is the first connection. We assume they already exist.
            // This is caused by the fact that at the beginning the log must be empty, so the database cannot contain any data, otherwise this can led to an inconsistency.
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");
            await this.connection.query("TRUNCATE TABLE Users");
            await this.connection.query("TRUNCATE TABLE Bids");
            await this.connection.query("TRUNCATE TABLE Auctions");
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");

            this.firstConnection = false;
        }

        // Connect to the database,
        await this.connection.connect((err) => {
            if (err) {
                console.error('Database connection error:', err);
                return;
            }
            console.log('Connected to MySQL database!');
        });
    }

    /**
     * Closes the connection to the database.
     */
    async disconnect() {
        // Close the conncetion.
        await this.connection.end((err) => {
            if (err) {
                console.error('Error while closing the connection:', err);
                return;
            }
            console.log('Closed connection to the database.');
        });
    }

    /**
     * Adds a new user to the database.
     * @param {String} username The username of the new user.
     * @param {String} password The password of the new user.
     */
    async queryAddNewUser(username, password) {
        try {
            /** @type {mysql.ResultSetHeader} */
            const results = await this.connection.execute(
                'INSERT INTO Users (Username, Password) VALUES (?, ?)',
                [username, password]
            );

            return results.insertId;
        } catch (err) {
            return null;
        }

    }

    /**
     * Adds a new bid to the database.
     * @param {String} userMaker The user making the bid.
     * @param {Number} auctionId The ID of the auction.
     * @param {Number} value The bid value.
     * @returns The result of the insert plus a description.
     */
    async queryAddNewBid(userMaker, auctionId, value) {
        try {
            let auction = await this.queryGetAuctionInfo(auctionId);
            if (!auction.closed) {
                if (userMaker == auction.creator) {
                    return StatusResults.failure('Auction creator cannot bid in the auction.');
                }

                if (value < auction.startingPrice || (auction.highestBid && value <= auction.highestBid)) {
                    return StatusResults.failure('Insufficient bid price.');
                }

                const result = await this.connection.execute(
                    'INSERT INTO Bids (UserMaker, AuctionId, Value, Time) VALUES (?, ?, ?, ?)',
                    [userMaker, auctionId, value, new Date().toISOString()]
                );
                if(result.insertId){
                    await this.connection.execute(
                        'UPDATE Auctions SET WinnerBid = ? WHERE Id = ?',
                        [result.insertId, auctionId]
                    );
                    StatusResults.success('Bid added.');
                }
            }
            return StatusResults.failure('Auction closed.');
        } catch (err) {
            return StatusResults.failure('Failed to add bid.');
        }
    }

    /**
     * Retrieves key information on a certain auction.
     * @param {String} auctionId The ID of the auction.
     * @returns The auction's information.
     */
    async queryGetAuctionInfo(auctionId) {
        let [rows, _] = await this.connection.execute(
            `SELECT a.UserMaker AS um, a.StartingPrice AS sp, a.ClosingDate AS cd, b.Value AS hv 
            FROM Auctions AS a LEFT JOIN Bids AS b
                ON a.WinnerBid = b.Id
            WHERE a.Id = ?`,
            [auctionId]
        );

        if (rows.length > 0) {
            let auct = rows[0];
            return new GetAuctionInfoResponse(auct.um, auct.sp, auct.cd, auct.hv);
        }
        return null;
    }

    /**
     * Adds a new auction to the database.
     * @param {String} userMaker The user creating the auction.
     * @param {Date} openingDate Date of the start of the auction.
     * @param {String} objectName The name of the auctioned object.
     * @param {String} objectDescription The description of the auctioned object.
     * @param {Number} startingPrice The starting price of the auction.
     * @returns The id of the newly inserted auction, null if unsuccessful.
     */
    async queryAddNewAuction(userMaker, openingDate, objectName, objectDescription, startingPrice) {
        try {
            /** @type {mysql.ResultSetHeader} */
            const results = await this.connection.execute(
                'INSERT INTO Auctions (UserMaker, OpeningDate, ClosingDate, ObjectName, ObjectDescription, StartingPrice, WinnerBid) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userMaker, openingDate.toISOString(), null, objectName, objectDescription, startingPrice, null]
            );

            return results.insertId;
        } catch (err) {
            return null;
        }
    }

    /**
     * Checks if a given username and password match a user in the database.
     * @param {String} username The username.
     * @param {String} password The password.
     * @returns Returns a promise that resolves to true if the login is successful, otherwise false.
     */
    async queryForLogin(username, password) {
        const [rows, fields] = await this.connection.execute(
            'SELECT 1 AS Success FROM Users WHERE Username = ? AND Password = ?',
            [username, password]
        );
        return rows.length > 0;
    }

    /**
     * Query that mark a given auction as closed.
     * @param {Number} auctionId The id of the auction to be closed.
     * @param {String} closingDate The exact time when the auction is cloed.
     */
    async queryCloseAuction(auctionId, closingDate) {
        try {
            /** @type {mysql.ResultSetHeader} */
            let results = await this.connection.execute(
                'UPDATE Auctions SET ClosingDate = ? WHERE Id = ?',
                [closingDate, auctionId]
            );

            if (results.affectedRows > 0) {
                return StatusResults.success('Succesfully closed auction.');
            }
            return StatusResults.failure('Failed to close auction.');
        } catch (err) {
            return StatusResults.failure('Error while updating auction.');
        }
    }

    /**
     * Query that returns all the open auctions.
     */
    async queryViewAllOpenAuctions() {
        try {
            const [rows, _] = await this.connection.execute(
                `SELECT a.Id AS id, a.ObjectName AS objName, a.ObjectDescription AS objDesc, a.OpeningDate AS date, a.StartingPrice AS sp, b.Value AS hv 
                FROM Auctions AS a LEFT JOIN Bids AS b
                ON a.WinnerBid = b.Id
                WHERE ClosingDate IS NULL`
            );

            /** @type {GetAllOpenAuctionsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetAllOpenAuctionsResponse(row.id, row.objName, row.objDesc, row.date, row.sp, row.hv));
            });

            return results;
        } catch (err) {
            return null;
        }
    }

    /**
     * Query that returns all the bids of a given auction following a specified one.
     * @param {Number} auctionId The id of the auction to check.
     * @param {Number} lastBidId The id of the starting bid to return.
     */
    async queryGetNewerBids(auctionId, lastBidId) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT Id AS bidId, UserMaker AS user, Value AS val, Time AS time
                FROM Bids
                WHERE AuctionId = ? AND Id > ?`,
                [auctionId, lastBidId]
            );

            /** @type {GetNewBidsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetNewBidsResponse(row.bidId, row.user, row.val, row.time));
            });

            return results;
        } catch (err) {
            return null;
        }
    }

    /**
     * Query that returns all the auction created by a given user.
     * @param {Number} userId The id of the user whose auction must be showed.
     */
    async queryViewAllAuctionsOfAUser(userId) {
        try {
            const [rows, fields] = await this.connection.execute(
                'SELECT Id AS id, ObjectName AS objName, ObjectDescription AS objDesc, OpeningDate AS opDate, ClosingDate AS clDate, StartingPrice AS sp FROM Auctions WHERE UserMaker = ?',
                [userId]
            );

            /** @type {GetUserAuctionsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetUserAuctionsResponse(row.id, row.objName, row.objDesc, row.opDate, row.clDate, row.sp));
            });

            return results;
        } catch (err) {
            return null;
        }
    }

    /**
     * Query that returns all the auction in which a given user has partecipated.
     * @param {Number} userId The id of the user we want to check which auctions have been participated by him.
     */
    async queryViewAllAuctionsParticipatedByUser(userId) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT a.Id AS id, a.ObjectName AS objName, a.ObjectDescription AS objDesc, a.OpeningDate AS date, a.StartingPrice as sp
                FROM Auctions AS a INNER JOIN Bids AS b
                    ON b.AuctionId = a.Id AND b.UserMaker = ?
                GROUP BY a.Id`,
                [userId]
            );

            /** @type {GetUserParticipationsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetUserParticipationsResponse(row.id, row.objName, row.objDesc, row.date, row.sp)); 
            });

            return results;
        } catch (err) {
            return null;
        }
    }

    /**
     * Query that returns the last n bids of a given auction.
     * @param {Number} auctionId Id of the auction we want to get the lates n bids.
     * @param {Number} n Number of bids that must be returned.
     */
    async queryViewNLatestBidsInAuction(auctionId, n) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT Id as bidId, UserMaker as user, Value as val, Time as time
                FROM Bids
                WHERE AuctionId = ?
                LIMIT ?`,
                [auctionId, n]
            );

            /** @type {GetLastBidsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetLastBidsResponse(row.bidId, row.user, row,val, row.time));
            });

            return results;
        } catch (err) {
            return null;
        }
    }
}