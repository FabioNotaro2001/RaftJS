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

        // TODO: if this dbmanager handles the first connection, then delete all tables content.
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
    // TODO: Create methods as API that execute specific queries.
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
    // FIXME: add the constraint that the creator of the auction cannot make a bid for it
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
            `SELECT TOP 1 a.UserMaker as um, a.StartingPrice as sp, a.ClosingDate as cd, b.Value as hv FROM Auctions a INNER JOIN Bid b
                ON b.AuctionId = a.Id
             WHERE Id = ?
             ORDER BY b.Value DESC`,
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

    // TODO: query to close an auction (set closingTime to now) --> as consequence if present mark the winner bid
    // TODO: function clearAllTables() that delete the contents of all tables
    // TODO: query to view all open auctions
    // TODO: query to view all auction of a specific user (the logged one)
    // TODO: query to view all auction that the logged user has participated to
    // TODO: query to view last n bids given a specific auction

}