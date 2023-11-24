import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';


const app = express();
const port = 5000;

app.use(cookieParser());
app.use(bodyParser.json());

const __dirname = path.resolve(path.dirname("../client_web/html"));
app.use("/css/",express.static(path.join(__dirname,"css")));
app.use("/js/",express.static(path.join(__dirname,"js")));

app.post("/createuser", (req, res) => {
    // TODO Aggiunta dell'utente al DB se ha successo restituisci 200 se no l'errore.
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
