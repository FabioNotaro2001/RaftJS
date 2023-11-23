const mysql = require('mysql2/promise');

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
    queryAddNewUser(usernameParameter, passwordParameter){
        // execute will internally call prepare and query
        this.connection.execute(
            'INSERT INTO Users (Username, Password) VALUES (?, ?)',
            [usernameParameter, passwordParameter]
        );
        
    }

    /**
     * Adds a new bid to the database.
     * @param {String} id The bid ID.
     * @param {String} userMaker The user making the bid.
     * @param {String} auctionId The ID of the auction.
     * @param {Number} value The bid value.
     * @param {Boolean} isWinner Indicates if the bid is the winning bid.
     * @returns {Boolean} Returns true if the auction is not closed, otherwise false.
     */
    // FIXME: check if value is > lastBid for that auction and value > startingPrice of the auction.
    // FIXME: add the constraint that the creator of the auction cannot make a bid for it
    async queryAddNewBid(id, userMaker, auctionId, value, isWinner){
        if(await this.checkAuctionNotAlreadyClosed(auctionId)){
            this.connection.execute(
                'INSERT INTO Bids (Id, UserMaker, Auction, Value, Time, IsWinner) VALUES (?, ?, ?, ?, ?, ?)',
                [id, userMaker, auctionId, value, new Date().toISOString(), isWinner]
            );
            return true;
        }
        return false;
    }

    /**
     * Checks if an auction is not already closed.
     * @param {String} auctionId The ID of the auction.
     * @returns {Promise<Boolean>} Returns a promise that resolves if an auction is close.
     */
    async checkAuctionNotAlreadyClosed(auctionId){
        return await this.connection.execute(
            'SELECT ClosingDate FROM Auctions WHERE Id = ?',
            [auctionId]
        ).then(([rows, fields]) => {
            if(rows.length > 0){
                return rows[0].ClosingDate;
            }
            return false;
        });
    }
    
    /**
     * Adds a new auction to the database.
     * @param {String} id The auction ID.
     * @param {String} objectName The name of the auctioned object.
     * @param {String} objectDescription The description of the auctioned object.
     * @param {Number} startingPrice The starting price of the auction.
     * @param {String} userMaker The user creating the auction.
     */
    queryAddNewAuction(id, objectName, objectDescription, startingPrice, userMaker){
        let now = new Date().toISOString();
        this.connection.execute(
            'INSERT INTO Auctions (Id, OpeningDate, ClosingDate, ObjectName, ObjectDescription, StartingPrice, UserMaker) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, new Date().toISOString(), null, objectName, objectDescription, startingPrice, userMaker]
        );
    }

    /**
     * Checks if a given username and password match a user in the database.
     * @param {String} username The username.
     * @param {String} password The password.
     * @returns {Promise<Boolean>} Returns a promise that resolves to true if the login is successful, otherwise false.
     */
    async queryForLogin(username, password){
        const [rows, fields] = await this.connection.execute(
            'SELECT 1 AS Success FROM Users WHERE Username = ? AND Password = ?',
            [username, password]
        );
        return rows.length > 0;
    }

    // TODO: query to close an auction (set closingTime to now) --> as consequence if present mark the winner bid
    // TODO: function clearAllTables() that delete the contents of all tables
    // TODO: query to view all open auctions
    // TODO: query to view all auction of a specific user (the logged one)
    // TODO: query to view all auction that the logged user has participated to
    // TODO: query to view last n bids given a specific auction

}