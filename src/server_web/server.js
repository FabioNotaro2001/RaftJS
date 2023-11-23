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
    res.cookie("user", "1", {maxAge:60000})
    res.sendStatus(201);
});

app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, "html/login.html"));
    if(req.cookies.user){
        res.redirect("/home");
    } else {
        res.redirect("/login");
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "html/login.html"));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, "html/signUp.html"));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
