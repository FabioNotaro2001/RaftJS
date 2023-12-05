import express, { response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';
import { Socket as SocketCl, io } from "socket.io-client" 

const app = express();
const port = 5000;

const ports = new Map();
ports.set("Node1", 15001);
ports.set("Node2", 15003);
ports.set("Node3", 15005);
ports.set("Node4", 15007);
ports.set("Node5", 15009);

/** @type {SocketCl} */
let sock = null;
let leaderFound = false;

let arr = [...ports.keys()];
let host = null;

//TODO Gestire disconnessioni e connessioni a nuovo leader.
async function connectionRaft(){
    let randomNodeId = arr[Math.round(Math.random() * arr.length)];
    host = "127.0.0.1:"+ports.get(randomNodeId);
    do{
        let promiseResolve;
        console.log("Rifatto!");
        /** @type {Promise<any>} */
        let waiting = new Promise((resolve) => {promiseResolve = resolve;});
        console.log(host);
        sock = io("ws://" + host, {
                        autoConnect: false,
                        reconnection: false,
                        timeout: 5000
        });
        sock.connect();
        sock.on("connect", () => {
            sock.emit("isLeader", (response) => {
                if(!response.isLeader){
                    console.log("Leader is " + response.leaderId);
                    sock.close();
                    if(response.leaderId){
                        host = "127.0.0.1:" + ports.get(response.leaderId);
                    } else {
                        randomNodeId = arr[Math.round(Math.random() * arr.length)];
                        host = "127.0.0.1:" + ports.get(randomNodeId);
                    }
                } else {
                    leaderFound = true;
                }
                promiseResolve();
            });
        })

        await waiting;
    }while(!leaderFound);
    console.log("Connected!");
}

connectionRaft();

app.use(cookieParser());
app.use(bodyParser.json());

const __dirname = path.resolve(path.dirname("../client_web/html"));
app.use("/css/",express.static(path.join(__dirname,"css")));
app.use("/js/",express.static(path.join(__dirname,"js")));
app.use("/res/",express.static(path.join(__dirname,"res")));

app.post("/createuser", (req, res) => {
    // TODO Aggiunta dell'utente al DB se ha successo restituisci 200 se no l'errore.
    console.log(req);
    res.sendStatus(201);
});

app.post("/loginuser", (req, res) => {
    // TODO Verifica i dati inseriti dall'utente nel database e restituire la risposta settando in tal caso il cookie.
    // Sets the cookie with the expiration timestamp.
    const expireTime = new Date().getTime() + 86400000; // 1 giorno
    res.cookie("user", expireTime, { maxAge:  86400000});
    res.sendStatus(201);
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

app.post("/addAuction", (req, res) => {
    // TODO Fare l'aggiunta della nuova asta.
    res.sendStatus(201);
});

app.post("/getAllAuctions", (req, res) => {
    // TODO Prendere tutte le aste dal database.
    res.sendStatus(201);
});

app.post("/addOffer", (req, res) => {
    // TODO Aggiungere offerta al DB.
    res.sendStatus(201);
});

app.post("/checkOffer", (req, res) => {
    // TODO Prendere l'ultimo prezzo di una determinata asta..
    res.sendStatus(201);
});

app.get('/', (req, res) => {
    if(req.cookies.user){
        res.redirect("/home");
    } else {
        res.redirect("/login");
    }
});

// Middleware to check the validity of the cookie.
const checkCookieValidity = (req, res, next) => {
    if (req.cookies.user) {
        const now = new Date().getTime();
        const cookieExpireTime = req.cookies.user;

        if (now < cookieExpireTime) {
            // If the cookie is still valid, we call next() to proceed to the next route.
            next();
            return;
        }
    }

    // If the cookie has expired or is not present, we redirect the user to the login page.
    res.redirect("/login");
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
