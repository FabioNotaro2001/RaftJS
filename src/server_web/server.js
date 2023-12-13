import express, { response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';
import { Socket as SocketCl, io } from "socket.io-client"
import { CommandType } from '../server_node/enums/CommandType.js';
import { NewAuctionRequest, NewUserRequest, NewBidRequest, LoginRequest, UserExistsRequest, GetLastBidsRequest, GetAuctionInfoRequest } from '../server_node/components/ClientRequestTypes.js';
import { GetAllOpenAuctionsResponse, GetAuctionInfoResponse, GetLastBidsResponse } from '../server_node/components/ServerResponseTypes.js';
import { StatusResults } from '../server_node/components/DBManager.js';
import fs from 'fs';

//TODO: Check if cookie user exists in db.
/** @type {{
 *      serverPort: String, 
 *      nodes: {
 *          host: String,
 *          id: String,
 *          port: Number
 *      }[]
 * }} */
const config = JSON.parse(fs.readFileSync("./src/server_web/cluster-config.json", "utf8"));

const app = express();
const port = config.serverPort;

/**
 * Map from nodeId to host and port.
 * @type {Map<String, {host: String, port: Number}>}
 */
const ports = new Map();

config.nodes.forEach(node => {
    ports.set(node.id, {host: node.host, port: node.port});
});

let nodeIds = [...ports.keys()];

/** @type {SocketCl} */
let sock = null;

/**
 * 
 * @param {String} nodeId 
 * @returns 
 */
function getHostString(nodeId){
    let host = ports.get(nodeId); // Picks a random node to connect to.
    return host.host + ":" + host.port;
}

async function connectToRaftCluster() {
    let nodeId = nodeIds[Math.round(Math.random() * (nodeIds.length - 1))];
    let hostString = getHostString(nodeId);
    let leaderFound = false;

    do {
        let promiseResolve;

        /** @type {Promise<any>} */
        let waiting = new Promise((resolve) => { promiseResolve = resolve; });

        sock = io("ws://" + hostString, {
            autoConnect: false,
            reconnection: false,
            timeout: 5000
        }).connect();

        let t = setTimeout(() => {    // If no response is received, try to connect to a different node.
            sock.close();
            promiseResolve();
        }, 5000);

        sock.on("connect", () => {
            clearTimeout(t);
            let timeout = setTimeout(() => {    // If no response is received, try to connect to a different node.
                sock.close();
                promiseResolve();
            }, 5000);

            sock.emit("isLeader", (response) => {
                clearTimeout(timeout);

                if (!response.isLeader) {
                    sock.close();
                    console.log("Connected to non-leader %s!", nodeId);
                    if (response.leaderId) {    // Contacted node is not the leader but knows which other node is.
                        nodeId = response.leaderId;
                        hostString = getHostString(nodeId);
                        promiseResolve(); // Resolve the promise and confirm a response has been received.
                    } else {
                        nodeId = nodeIds[Math.round(Math.random() * (nodeIds.length - 1))];
                        hostString = getHostString(nodeId);
                        setTimeout(promiseResolve, 1000);
                    }
                } else {
                    leaderFound = true;
                    promiseResolve(); // Resolve the promise and confirm a response has been received.
                }
            });
        });

        sock.on("disconnect", (reason) => {
            if(reason !== "io client disconnect"){
                console.log("Disconnected!");
                connectToRaftCluster();
            }
        });

        await waiting;  // Pause until the response is returned to the socket.
    } while (!leaderFound);
    console.log("Connected to leader %s!", nodeId);
}

connectToRaftCluster();

app.use(cookieParser());
app.use(bodyParser.json());


const __dirname = path.resolve(path.normalize("./src/client_web"));
app.use("/css/", express.static(path.join(__dirname, "css")));
app.use("/js/", express.static(path.join(__dirname, "js")));
app.use("/res/", express.static(path.join(__dirname, "res")));

app.post("/createuser", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {Number} */
    let ret = null;

    sock.emit(CommandType.NEW_USER, new NewUserRequest(req.body.username, req.body.pwd), async (/** @type {?Number} */ response) => {
        ret = response;
        resolvePromise();
    });

    console.log(req);

    await promise;
    if (ret > 0) {
        res.sendStatus(201);
    } else {
        res.sendStatus(409);
    }
});

app.post("/loginuser", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {Boolean} */
    let ret = null;

    sock.emit(CommandType.LOGIN, new LoginRequest(req.body.name, req.body.pwd), async (/** @type {Promise<boolean>} */ response) => {
        ret = response;
        resolvePromise();
    });

    console.log(req);

    await promise;
    if (ret) {
        // Sets the cookie with the expiration timestamp.
        res.cookie("user", req.body.name, { maxAge: 86400000 });
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.post("/logoutuser", (req, res) => {
    // Checks whether the "user" cookie is present in the request.
    if (req.cookies && req.cookies.user) {
        // Delete cookie.
        res.clearCookie("user");
        res.sendStatus(200);
    } else {
        res.sendStatus(200);
    }
});

app.post("/addAuction", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {Number} */
    let ret = null;

    sock.emit(CommandType.NEW_AUCTION, new NewAuctionRequest(req.cookies.user, new Date(), req.body.objName, req.body.objDescription, req.body.startingPrice),
        async (/** @type {?Number} */ response) => {
            ret = response;
            resolvePromise();
        });

    console.log(req);

    await promise;
    if (ret != null) {
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
});

app.post("/getAllAuctions", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {GetAllOpenAuctionsResponse[]} */
    let ret = null;

    sock.emit(CommandType.GET_ALL_OPEN_AUCTIONS, null, async (/** @type {?GetAllOpenAuctionsResponse[]} */ response) => {
        ret = response;
        resolvePromise();
    });

    console.log(req);

    await promise;
    if (ret != null) {
        res.status(200).send(ret);
    } else {
        res.sendStatus(500);
    }
});


app.post("/getAuction", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {GetAuctionInfoResponse} */
    let ret = null;

    sock.emit(CommandType.GET_AUCTION_INFO, new GetAuctionInfoRequest(req.body.auctionId), async (/** @type {?GetAuctionInfoResponse} */ response) => {
        ret = response;
        resolvePromise();
    });

    console.log(req);

    await promise;
    if (ret != null) {
        res.status(200).send(ret);
    } else {
        res.sendStatus(500);
    }
});

app.post("/addOffer", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {StatusResults} */
    let ret = null;

    sock.emit(CommandType.NEW_BID, new NewBidRequest(req.body.username, req.body.auctionId, req.body.bidValue),
        async (/** @type {StatusResults} */ response) => {
            ret = response;
            resolvePromise();
        });

    console.log(req);

    await promise;
    if (ret != null) {
        if(ret.success){
            res.status(201);
        } else {
            res.status(400);
        }
        res.send(ret.info);
    } else {
        res.sendStatus(500);
    }
});

app.post("/getBids", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {GetLastBidsResponse[]} */
    let ret = null;

    sock.emit(CommandType.GET_LAST_N_BIDS, new GetLastBidsRequest(req.body.auctionId, 10),
        async (/** @type {GetLastBidsResponse} */ response) => {
            ret = response;
            resolvePromise();
        });

    console.log(ret);

    await promise;
    if (ret != null) {
        res.status(200);

        if (ret.length == 0) {
            res.send("No bids available");
        }
    } else {
        res.sendStatus(500);
    }
});

app.post("/getNewBids", async (req, res) => {
    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    /** @type {StatusResults} */
    let ret = null;

    sock.emit(CommandType.GET_NEW_BIDS, new GetLastBidsRequest(req.body.auctionId, 10),
        async (/** @type {StatusResults} */ response) => {
            ret = response;
            resolvePromise();
        });

    console.log(req);

    await promise;
    if (ret != null) {
        if(ret.success){
            res.status(201);
        } else {
            res.status(400);
        }
        res.send(ret.info);
    } else {
        res.sendStatus(500);
    }
});

app.get('/', (req, res) => {
    if (req.cookies.user) {
        res.redirect("/home");
    } else {
        res.redirect("/login");
    }
});

// Middleware to check the validity of the cookie.
const checkCookieValidity = (req, res, next) => {
    if(req.cookies.user==null){
        // No cookie.
        res.redirect("/login");
        return;
    } 

    sock.emit(CommandType.USER_EXISTS, new UserExistsRequest(req.cookies.user),
        async (/** @type {Boolean} */ response) => {
            if(response){
                // Valid cookie.
                next();
            }
        });

};

// Using middleware for all routes that require cookie verification.
app.use(['/home', '/auction'], checkCookieValidity);

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "html/login.html"));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, "html/signUp.html"));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, "html/home.html"));
});

app.get('/auction', (req, res) => {
    res.sendFile(path.join(__dirname, "html/auction.html"));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
