const mysql = require('mysql2/promise');

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
     * @param {String} usernameParameter The username of the new user.
     * @param {String} passwordParameter The password of the new user.
     */

    async queryAddNewUser(usernameParameter, passwordParameter) {
        try {
            /** @type {mysql.ResultSetHeader} */
            const results = this.connection.execute(
                'INSERT INTO Users (Username, Password) VALUES (?, ?)',
                [usernameParameter, passwordParameter]
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
            let auction = await this.getAuctionInfo(auctionId);
            if (!auction.closed) {
                if (userMaker == auction.creator) {
                    return StatusResults.failure('Auction creator cannot bid in the auction.');
                }

                if (value < auction.startingPrice || (auction.highestBid && value <= auction.highestBid)) {
                    return StatusResults.failure('Insufficient bid price.');
                }

                this.connection.execute(
                    'INSERT INTO Bids (UserMaker, AuctionId, Value, Time) VALUES (?, ?, ?, ?)',
                    [userMaker, auctionId, value, new Date().toISOString()]
                );
                StatusResults.success('Bid added.');
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
    async getAuctionInfo(auctionId) {
        let [rows, _] = await this.connection.execute(
            `SELECT a.UserMaker AS um, a.StartingPrice AS sp, a.ClosingDate AS cd, b.Value AS hv 
            FROM Auctions AS a INNER JOIN Bids AS b
                ON b.AuctionId = a.Id
            WHERE a.Id = ?
            ORDER BY b.Value DESC
            LIMIT 1`,
            [auctionId]
        );

        if (rows.length > 0) {
            let auct = rows[0];
            return {
                /** @type {String} */
                creator: auct.um,
                /** @type {Number} */
                startingPrice: auct.sp,
                /** @type {Boolean} */
                closed: auct.cd != null,
                /** @type {Number | null} */
                highestBid: auct.hv
            };
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
     * @returns {Promise<{
     * id : Number, 
     * objname : String,
     * objdesc : String,
     * date : String,
     * sp : Number
     * }[] | null>}
     */
    async queryViewAllOpenAuctions() {
        try {
            let results = [];
            const [rows, fields] = await this.connection.execute(
                'SELECT Id AS id, ObjectName AS objname, ObjectDescription AS objdesc, OpeningDate AS date FROM Auctions WHERE ClosingDate IS NULL',
            );

            return rows;
        } catch (err) {
            return null;
        }
    }

    /**
     * 
     * @param {Number} auctionId 
     * @param {Number} lastBidId 
     * @returns {Promise<{
    * bidId : Number, 
    * val : Number,
    * time : String
    * }[] | null>}
     */
    async queryGetNewerBids(auctionId, lastBidId) {
        try {
            const [rows, fields] = await this.connection.execute(
                `SELECT Id AS bidId, UserMaker AS user, Value AS val, Time AS time
                FROM Bids
                WHERE AuctionId = ? AND Id > ?`,
                [auctionId, lastBidId]
            );

            return rows;
        } catch (err) {
            return null;
        }
    }

    /**
     * @returns {Promise<{
    * id : Number, 
    * objname : String,
    * objdesc : String,
    * opdate : String,
    * cldate : String,
    * sp : Number
    * }[] | null>}
    */
    async queryViewAllAuctionsOfAUser(userId) {
        try {
            let results = [];
            const [rows, fields] = await this.connection.execute(
                'SELECT Id AS id, ObjectName AS objname, ObjectDescription AS objdesc, OpeningDate AS opdate, ClosingDate AS cldate, StartingPrice AS sp FROM Auctions WHERE UserMaker = ?',
                [userId]
            );

            return rows;
        } catch (err) {
            return null;
        }
    }

    /**
      * @returns {Promise<{
    * id : Number, 
    * objname : String,
    * objdesc : String,
    * date : String,
    * sp : Number
    * }[] | null>}
    */
    async queryViewAllAuctionsParticipatedByUser(userId) {
        try {
            let results = [];
            const [rows, fields] = await this.connection.execute(
                `SELECT a.Id AS id, a.ObjectName AS objname, a.ObjectDescription AS objdesc, a.OpeningDate AS date, a.StartingPrice as sp
                FROM Auctions AS a INNER JOIN Bids AS b
                    ON b.AuctionId = a.Id AND b.UserMaker = ?
                GROUP BY a.Id`,
                [userId]
            );

            return rows;
        } catch (err) {
            return null;
        }
    }

    /**
     * 
     * @param {Number} auctionId 
     * @param {Number} n 
     * @returns {Promise<{
    * bidId : Number, 
    * val : Number,
    * time : String
    * }[] | null>}
     */
    async queryViewNLatestBidsInAuction(auctionId, n){
        try{
            let results = [];
            const [rows, fields] = await this.connection.execute(
                `SELECT Id as bidId, UserMaker as user, Value as val, Time as time
                FROM Bids
                WHERE AuctionId = ?
                LIMIT ?`,
                [auctionId, n]
            );

            return rows;
        } catch(err){
            return null;
        }
    }
}