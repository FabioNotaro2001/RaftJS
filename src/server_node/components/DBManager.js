import * as mysql from "mysql2/promise";
import { GetAllOpenAuctionsResponse, GetAuctionInfoResponse, GetLastBidsResponse, GetNewBidsResponse, GetUserAuctionsResponse, GetUserParticipationsResponse } from "./ServerResponseTypes.js";

export class StatusResults {
    /**
     * Represents the result status of an operation.
     * @param {Boolean} success Indicates whether the operation was successful.
     * @param {String} info Additional information about the operation result.
     */
    constructor(success, info) {
        /** @type {Boolean} */
        this.success = success;
        /** @type {String} */
        this.info = info;
    }

    /**
     * Creates a success status result with the provided information.
     * @param {String} info Additional information about the successful operation.
     * @returns {StatusResults} A success status result.
     */
    static success(info) {
        return new StatusResults(true, info);
    }

    /**
     * Creates a failure status result with the provided information.
     * @param {String} info Additional information about the failed operation.
     * @returns {StatusResults} A failure status result.
     */
    static failure(info) {
        return new StatusResults(false, info);
    }
}

export class DBManager {
    /**
     * Manages interactions with the MySQL database.
     * @param {String} host The database host.
     * @param {String} user The database user.
     * @param {String} password The database password.
     * @param {String} database The name of the database.
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

    async connectToDb() {
        this.connection = await mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
            idleTimeout: 180000,
            enableKeepAlive: true
        });
    }

    /**
     * Establishes a connection to the database.
     * @returns {Promise<void>} A promise that resolves when the connection is established.
     */
    async connect() {
        await this.connectToDb();

        if (this.firstConnection) {
            // Delete all tables contents if this is the first connection. We assume they already exist.
            // This is caused by the fact that at the beginning the log must be empty, so the database cannot contain any data, otherwise this can lead to an inconsistency.
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

        let manager = this;

        this.connection.on('error', async function (err) {
            console.error('Database error', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                manager.connection.destroy();
                await manager.connectToDb();
            } else {
                throw err;
            }
        });
    }

    /**
     * Closes the connection to the database.
     * @returns {Promise<void>} A promise that resolves when the connection is closed.
     */
    async disconnect() {
        // Close the connection.
        await this.connection.end((err) => {
            if (err) {
                console.error('Error while closing the connection:', err);
                return;
            }
            console.log('Closed connection to the database.');
        });
    }

    /**
     * @typedef {Object} InsertUserResult
     * @property {mysql.ResultSetHeader} results
     * @property {any} _
     */
    /**
     * Adds a new user to the database.
     * @param {string} username Nome utente da inserire nel database.
     * @param {string} password Password da inserire nel database.
     * @returns {Promise<number|null>} Il numero di righe interessate dall'inserimento o null in caso di errore.
     */
    async queryAddNewUser(username, password) {
        try {
            /** @type {InsertUserResult} */
            const [results, _] = await this.connection.execute(
                'INSERT INTO Users (Username, Password) VALUES (?, ?)',
                [username, password]
            );

            return results.affectedRows;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Adds a new bid to the database.
     * @param {String} userMaker The user making the bid.
     * @param {Number} auctionId The ID of the auction.
     * @param {Number} value The bid value.
     * @returns {Promise<StatusResults>} A promise that resolves to the result of the bid addition.
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

                const [results, _] = await this.connection.execute(
                    'INSERT INTO Bids (UserMaker, AuctionId, Value, Time) VALUES (?, ?, ?, ?)',
                    [userMaker, auctionId, value, new Date().toISOString()]
                );
                if (results.insertId) {
                    await this.connection.execute(
                        'UPDATE Auctions SET WinnerBid = ? WHERE Id = ?',
                        [results.insertId, auctionId]
                    );
                    return StatusResults.success('Bid added.');
                }
            }
            return StatusResults.failure('Auction closed.');
        } catch (err) {
            console.error(err);
            return StatusResults.failure('Failed to add bid.');
        }
    }

    /**
     * Retrieves key information on a certain auction.
     * @param {String} auctionId The ID of the auction.
     * @returns {Promise<GetAuctionInfoResponse|null>} A promise that resolves to the auction's information or null if not found.
     */
    async queryGetAuctionInfo(auctionId) {
        try {
            let [rows, _] = await this.connection.execute(
                `SELECT a.UserMaker AS um, a.ObjectName as obn, a.ObjectDescription as obd, a.StartingPrice AS sp, a.ClosingDate AS cd, b.Value AS hv 
            FROM Auctions AS a LEFT JOIN Bids AS b
                ON a.WinnerBid = b.Id
            WHERE a.Id = ?`,
                [auctionId]
            );

            if (rows.length > 0) {
                let auct = rows[0];
                return new GetAuctionInfoResponse(auct.um, auct.obn, auct.obd, auct.sp, auct.cd != null, auct.hv);
            }
            return null;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    // ... (previous comments)

    /**
     * Adds a new auction to the database.
     * @param {String} userMaker The user creating the auction.
     * @param {String} openingDate Date of the start of the auction.
     * @param {String} objectName The name of the auctioned object.
     * @param {String} objectDescription The description of the auctioned object.
     * @param {Number} startingPrice The starting price of the auction.
     * @returns {Promise<number|null>} A promise that resolves to the id of the newly inserted auction or null if unsuccessful.
     */
    async queryAddNewAuction(userMaker, openingDate, objectName, objectDescription, startingPrice) {
        try {
            /** @type {mysql.ResultSetHeader} */
            const [results, _] = await this.connection.execute(
                'INSERT INTO Auctions (UserMaker, OpeningDate, ClosingDate, ObjectName, ObjectDescription, StartingPrice, WinnerBid) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userMaker, openingDate, null, objectName, objectDescription, startingPrice, null]
            );

            return results.insertId;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Checks if a given username and password match a user in the database.
     * @param {String} username The username.
     * @param {String} password The password.
     * @returns {Promise<Boolean>} A promise that resolves to true if the login is successful, otherwise false.
     */
    async queryForLogin(username, password) {
        try {
            const [rows, fields] = await this.connection.execute(
                'SELECT 1 AS Success FROM Users WHERE Username = ? AND Password = ?',
                [username, password]
            );
            return rows.length > 0;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    /**
     * Checks if a given username matches a user in the database.
     * @param {String} username The username.
     * @returns {Promise<Boolean>} A promise that resolves to true if the user exists, otherwise false.
     */
    async queryUserExists(username) {
        try {
            const [rows, fields] = await this.connection.execute(
                'SELECT 1 AS Success FROM Users WHERE Username = ?',
                [username]
            );
            return rows.length > 0;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    /**
     * Query that marks a given auction as closed.
     * @param {Number} auctionId The id of the auction to be closed.
     * @param {String} closingDate The exact time when the auction is closed.
     * @returns {Promise<StatusResults>} A promise that resolves to the result of closing the auction.
     */
    async queryCloseAuction(auctionId, closingDate) {
        try {
            /** @type {mysql.ResultSetHeader} */
            let [results, _] = await this.connection.execute(
                'UPDATE Auctions SET ClosingDate = ? WHERE ClosingDate IS NULL AND Id = ?',
                [closingDate, auctionId]
            );

            if (results.affectedRows > 0) {
                return StatusResults.success('Successfully closed auction.');
            }
            return StatusResults.failure('Failed to close auction.');
        } catch (err) {
            console.error(err);
            return StatusResults.failure('Error while updating auction.');
        }
    }

    /**
     * Query that returns all the open auctions.
     * @returns {Promise<GetAllOpenAuctionsResponse[]|null>} A promise that resolves to an array of open auctions or null if unsuccessful.
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
            console.error(err);
            return null;
        }
    }

    /**
     * Query that returns all the bids of a given auction following a specified one.
     * @param {Number} auctionId The id of the auction to check.
     * @param {Number} lastBidId The id of the starting bid to return.
     * @returns {Promise<GetNewBidsResponse[]|null>} A promise that resolves to an array of new bids or null if unsuccessful.
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
            console.error(err);
            return null;
        }
    }

    /**
     * Query that returns all the auction created by a given user.
     * @param {String} username The username of the user whose auctions must be shown.
     * @returns {Promise<GetUserAuctionsResponse[]|null>} A promise that resolves to an array of user auctions or null if unsuccessful.
     */
    async queryViewAllAuctionsOfAUser(username) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT a.Id AS id, a.ObjectName AS objName, a.ObjectDescription AS objDesc, a.OpeningDate AS opDate, a.ClosingDate AS clDate, a.StartingPrice AS sp, b.Value AS hv 
                FROM Auctions AS a LEFT JOIN Bids AS b
                    ON a.WinnerBid = b.Id
                WHERE a.UserMaker = ?`,
                [username]
            );

            /** @type {GetUserAuctionsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetUserAuctionsResponse(row.id, row.objName, row.objDesc, row.opDate, row.clDate, row.sp, row.hv));
            });

            return results;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Query that returns all the auctions in which a given user has participated.
     * @param {String} username The username of the user whose participated auctions must be checked.
     * @returns {Promise<GetUserParticipationsResponse[]|null>} A promise that resolves to an array of user participations or null if unsuccessful.
     */
    async queryViewAllAuctionsParticipatedByUser(username) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT a.Id AS id, a.ObjectName AS objName, a.ObjectDescription AS objDesc, a.OpeningDate AS date, a.StartingPrice as sp, b.Value AS hv 
                FROM Auctions AS a LEFT JOIN Bids AS b
                    ON a.WinnerBid = b.Id
                INNER JOIN Bids AS b1
                    ON b1.AuctionId = a.Id AND b1.UserMaker = ?
                GROUP BY a.Id`,
                [username]
            );

            /** @type {GetUserParticipationsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetUserParticipationsResponse(row.id, row.objName, row.objDesc, row.date, row.sp, row.hv));
            });

            return results;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Query that returns the last n bids of a given auction.
     * @param {Number} auctionId Id of the auction from which to get the latest n bids.
     * @param {Number} n Number of bids to be returned.
     * @returns {Promise<GetLastBidsResponse[]|Error>} A promise that resolves to an array of last n bids or an error if unsuccessful.
     */
    async queryViewNLatestBidsInAuction(auctionId, n) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT Id as bidId, UserMaker as user, Value as val, Time as time
                FROM Bids
                WHERE AuctionId = ?
                ORDER BY Value DESC
                LIMIT ?`,
                [auctionId, n]
            );

            /** @type {GetLastBidsResponse[]} */
            let results = [];

            rows.forEach(row => {
                results.push(new GetLastBidsResponse(row.bidId, row.user, row.val, row.time));
            });

            return results;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}
