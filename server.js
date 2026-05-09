const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();

const db = new sqlite3.Database("database.db");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: "sistecsecret",
    resave: false,
    saveUninitialized: true
}));
const app = express();
app.use(express.static("public"));


// CREATE TABLES

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS records(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature TEXT,
            humidity TEXT,
            time TEXT,
            date TEXT
        )
    `);

});


// REGISTER

app.post("/register", (req, res) => {

    const { name, email, password } = req.body;

    db.run(
        "INSERT INTO users(name,email,password) VALUES(?,?,?)",
        [name, email, password],
        (err) => {

            if (err) {
                return res.send("Error");
            }

            res.redirect("/index.html");
        }
    );

});


// LOGIN

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, row) => {

            if (row) {

                req.session.user = row;

                res.redirect("/dashboard.html");
            }
            else {
                res.send("Invalid Login");
            }

        }
    );

});


// GET USER
app.listen(...)
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
    


// SAVE LCD TEXT
app.post("/saveText", (req, res) => {

    const text = req.body.text;

    fs.writeFileSync("lcd.txt", text);

    res.send("Saved");

});


// GET LCD TEXT API

app.get("/api/lcd", (req, res) => {

    if (!fs.existsSync("lcd.txt")) {
        fs.writeFileSync("lcd.txt", "WELCOME");
    }

    const data = fs.readFileSync("lcd.txt", "utf8");

    res.send(data);

});


// SAVE SENSOR DATA API

app.get("/api/save", (req, res) => {

    const temp = req.query.temp;
    const hum = req.query.hum;

    const now = new Date();

    const time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    const date = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    db.run(
        "INSERT INTO records(temperature,humidity,time,date) VALUES(?,?,?,?)",
        [temp, hum, time, date]
    );

    res.send("DATA SAVED");

});


// GET LATEST DATA

app.get("/latest", (req, res) => {

    db.get(
        "SELECT * FROM records ORDER BY id DESC LIMIT 1",
        (err, row) => {

            res.json(row);

        }
    );

});


// GET ALL RECORDS

app.get("/records", (req, res) => {

    db.all(
        "SELECT * FROM records ORDER BY id DESC",
        (err, rows) => {

            res.json(rows);

        }
    );

});


// DELETE RECORD

app.get("/delete/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "DELETE FROM records WHERE id=?",
        [id]
    );

    res.redirect("/dashboard.html");

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Running");
});