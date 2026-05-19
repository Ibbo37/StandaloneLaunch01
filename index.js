const express = require("express");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const app = express();

const CLIENT_ID = "LE6F5gp-Pg7hQOjH6aAaCYQAKe9SYMR9lQBzySCPw3w";
const REDIRECT_URI = "https://standalonelaunch01.onrender.com/callback";
const AUTH_URL = "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/authorize";
const FHIR_BASE = "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD";

// Store verifier per state
const stateStore = {};

function base64URLEncode(str) {
  return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

app.get("/", (req, res) => {
  const state = uuidv4();
  const scope = "offline_access patient/Patient.read";

  // Generate per-request verifier
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  // Save verifier linked to state
  stateStore[state] = codeVerifier;

  const authUrl =
    `${AUTH_URL}` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    `&aud=${encodeURIComponent(FHIR_BASE)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  console.log("Auth URL:", authUrl);
  console.log("Code Verifier:", codeVerifier);

  res.redirect(authUrl);
});

app.get("/callback", (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  const codeVerifier = stateStore[state];
  delete stateStore[state];

  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial; padding: 20px; word-break: break-all; }
          .box { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 10px 0; font-size: 13px; }
          h3 { color: #333; }
        </style>
      </head>
      <body>
        <h3>Code</h3>
        <div class="box">${code}</div>

        <h3>Code Verifier</h3>
        <div class="box">${codeVerifier}</div>

        <h3>Redirect URI</h3>
        <div class="box">${REDIRECT_URI}</div>

        <h3>Full URL (Debug)</h3>
        <div class="box">${JSON.stringify(req.query)}</div>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log("Server running on https://standalonelaunch01.onrender.com");
});