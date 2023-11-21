const mysql = require('mysql2/promise');

export class DBManager {
    /**
     * 
     * @param {String} host 
     * @param {String} user 
     * @param {String} password 
     * @param {String} database 
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

    // TODO: Create methods as API that execute specific queries.
    queryAddNewUser(usernameParameter, passwordParameter){
        // execute will internally call prepare and query
        this.connection.execute(
            'INSERT INTO Users (Username, Password) VALUES (?, ?)',
            [usernameParameter, passwordParameter]
        );
        
    }

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
     * 
     * @param {*} auctionId 
     * @returns Promise <Boolean> 
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
    
    
    queryAddNewAuction(id, objectName, objectDescription, startingPrice, userMaker){
        let now = new Date().toISOString();
        this.connection.execute(
            'INSERT INTO Auctions (Id, OpeningDate, ClosingDate, ObjectName, ObjectDescription, StartingPrice, UserMaker) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, new Date().toISOString(), null, objectName, objectDescription, startingPrice, userMaker]
        );
    }

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