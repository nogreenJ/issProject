require('dotenv').config()

const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const express = require('express')
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')
const admin = require("firebase-admin");

const serviceAccount =
{
    "type": "service_account",
    "project_id": "httpfilegetterauth",
    "private_key_id": process.env.FIREBASE_PKEY_ID,
    "private_key": process.env.FIREBASE_PKEY,
    "client_email": "firebase-adminsdk-1nxb4@httpfilegetterauth.iam.gserviceaccount.com",
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-1nxb4%40httpfilegetterauth.iam.gserviceaccount.com"
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const csrfMiddleware = csrf({ cookie: true });

router.use(express.static(path.join(__dirname, 'public')));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(csrfMiddleware);

router.all("*", (req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken());
    next();
});

router.get('/', function (req, res) {
    const sessionCookie = req.cookies.session || "";

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((userData) => {
            console.log("Logged in:", userData.email)
            res.sendFile(__dirname + '/public/html/table.html');
        })
        .catch((error) => {
            res.sendFile(__dirname + '/public/html/login.html');
            const sessionCookie = req.cookies.session || "";
        });
})

router.post('/login', async (req, res) => {
    const idToken = req.body.idToken.toString();

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    admin
        .auth()
        .createSessionCookie(idToken, { expiresIn })
        .then(
            (sessionCookie) => {
                const options = { maxAge: expiresIn, httpOnly: true };
                res.cookie("session", sessionCookie, options);
                res.end(JSON.stringify({ status: "success" }));
            },
            (error) => {
                res.status(400).send("Erro de autorização");
            }
        );
})

router.get("/logout", (req, res) => {
    console.log("fuck")
    res.clearCookie("session");
    res.redirect("/");
});

module.exports = router;