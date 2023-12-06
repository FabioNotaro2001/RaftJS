import * as mysql from "mysql2/promise";

/**
 * Represents the results of an operation, indicating success or failure.
 */
export class StatusResults {
    /**
     * Creates a new StatusResults instance.
     * @param {Boolean} success - Indicates whether the operation was successful.
     * @param {String} info - Additional information about the operation.
     */
    constructor(success, info) {
        /** @type {Boolean} */
        this.success = success;
        /** @type {String} */
        this.info = info;
    }

    /**
     * Creates a new StatusResults instance indicating success.
     * @param {String} info - Additional information about the success.
     * @returns {StatusResults} - A StatusResults instance indicating success.
     */
    static success(info) {
        return new StatusResults(true, info);
    }

    /**
     * Creates a new StatusResults instance indicating failure.
     * @param {String} info - Additional information about the failure.
     * @returns {StatusResults} - A StatusResults instance indicating failure.
     */
    static failure(info) {
        return new StatusResults(false, info);
    }
}

/**
 * Manages database operations.
 */
export class DBManager {
    /**
     * Constructor for the DBManager class.
     * @param {String} host - The database host.
     * @param {String} user - The database user.
     * @param {String} password - The database password.
     * @param {String} database - The database name.
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
        // Create a connection to the database.
        this.connection = await mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database
        });

        if (this.firstConnection) {
            // Delete all tables contents if this is the first connection.
            // Assumes tables already exist.
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");
            await this.connection.query("TRUNCATE TABLE Users");
            await this.connection.query("TRUNCATE TABLE Bids");
            await this.connection.query("TRUNCATE TABLE Auctions");
            await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");

            this.firstConnection = false;
        }

        // Connect to the database.
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
     * Adds a new user to the database.
     * @param {String} usernameParameter - The username of the new user.
     * @param {String} passwordParameter - The password of the new user.
     * @returns {Number | null} - The ID of the newly inserted user, null if unsuccessful.
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
     * @param {Number} auctionId - The ID of the auction.
     * @param {Number} n - The number of latest bids to retrieve.
     * @returns {Promise<{bidId: Number, user: String, val: Number, time: String}[] | null>} - Array of latest bids.
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

            return rows;
        } catch (err) {
            return null;
        }
    }
}
