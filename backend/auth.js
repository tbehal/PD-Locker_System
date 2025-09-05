import express from "express";
import { ConfidentialClientApplication } from "@azure/msal-node";

const router = express.Router();

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET,
    },
};

const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = ["user.read", "Files.ReadWrite", "Sites.ReadWrite.All"];

const msalClient = new ConfidentialClientApplication(msalConfig);

router.get("/login", async (req, res) => {
    const authCodeUrlParameters = {
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
    };

    try {
        const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
        res.redirect(authUrl);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/redirect", async (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
    };

    try {
        const response = await msalClient.acquireTokenByCode(tokenRequest);
        req.session.accessToken = response.accessToken;
        res.redirect("http://localhost:3000/dashboard"); // Your React dashboard page
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/me", async (req, res) => {
    const token = req.session.accessToken;
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await userRes.json();
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
