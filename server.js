const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const mysql = require("mysql2");
const dbConn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tendamema",
  database: "greatrift",
});
app.use(
  session({
    secret: "ugalimbogacabbagesukuma",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // set to true if using HTTPS, adjust maxAge as needed- ms
  }),
);
app.use(express.static("public")); // direct server to redirect any statci files(js,css,images) requests to the public folder
app.use(express.urlencoded({ extended: true })); // middleware to parse form data
// public routes - accessible to all users
app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // make user info available in all views for conditional rendering
  next();
});
app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
});
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post("/login", (req, res) => {
  // recievedlogin data - username,password,remember me
  const { username, password, remember } = req.body;
  dbConn.query(
    `SELECT * FROM admin_users WHERE username = "${username}"`,
    (err, results) => {
      // check for mysql connection of sql statements errors
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      }
      // if there are no errors - then check if the username exists in the database - data matching the username provided in the login form
      console.log(results);
      if (results.length === 0) {
        return res.status(401).redirect("/login"); // redirect back to login on failed login attempt
      }
      // if the username exists - then check if the password provided in the login form matches the password hash stored in the database for that user
      const user = results[0];
      if (bcrypt.compareSync(password, user.password_hash)) {
        // use hashed passwords and a secure comparison method - bcrypt
        req.session.user = { id: user.id, username: user.username }; // store user info in session- signing user info in a session cookie to maintain authentication state across requests
        res.redirect("/dashboard"); // redirect to dashboard on successful login
      } else {
        res.status(401).redirect("/login"); // redirect back to login on failed login attempt
      }
    },
  );
});
// Private Routes - only accessible to authenticated users
app.get("/dashboard", (req, res) => {
  if (req.session && req.session.user) {
    res.render("dashboard.ejs"); // render user dashboard
  } else {
    res.status(401).redirect("/login"); // restrict access to dashboard for unauthenticated users
  }
});
app.get("/register/admin", (req, res) => {
  if (req.session && req.session.user) {
    res.render("registeradmin.ejs");
  } else {
    res.status(401).send("Not Allowed / Unauthorized ");
  }
});
app.get("/register/driver", (req, res) => {
  if (req.session && req.session.user) {
    res.render("registerdriver.ejs");
  } else {
    res.status(401).send("Not Allowed / Unauthorized ");
  }
});

app.get("/trips", (req, res) => {
  if (req.session && req.session.user) {
    res.render("trips-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/bookings", (req, res) => {
  if (req.session && req.session.user) {
    res.render("bookings-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/routes", (req, res) => {
  if (req.session && req.session.user) {
    res.render("routes-browse.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/payments", (req, res) => {
  if (req.session && req.session.user) {
    res.render("payments-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});



//start the app
app.listen(3003, () => console.log("Server running on PORT 3003"));
