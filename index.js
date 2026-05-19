const express = require("express");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const app = express();

const CLIENT_ID = "LE6F5gp-Pg7hQOjH6aAaCYQAKe9SYMR9lQBzySCPw3w";

const REDIRECT_URI = "http://localhost:3000/callback";

const AUTH_URL = "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/authorize";

const FHIR_BASE = "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD";

// PKCE helpers
function base64URLEncode(str) {
  return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

const codeVerifier = base64URLEncode(crypto.randomBytes(32));
const codeChallenge = base64URLEncode(sha256(codeVerifier));

// Step 1 — Redirect user to ECW login
app.get("/", (req, res) => {
  const state = uuidv4();
  const scope = "openid fhirUser offline_access patient/Patient.read";

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
  console.log("Code Verifier (save this for Postman):", codeVerifier);

  res.redirect(authUrl);
});

// Step 2 — Catch the authorization code, show it on screen
app.get("/callback", (req, res) => {
  const code = req.query.code;

  res.send(`
    <h2>Code</h2>
    <p>${code}</p>

    <h2>Redirect URI</h2>
    <p>${REDIRECT_URI}</p>
  `);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});