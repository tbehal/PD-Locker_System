import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/:itemId/tables", async (req, res) => {
    const token = req.session.accessToken;
    const { itemId } = req.params;
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/tables`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).send(err.response?.data || err.message);
    }
});

router.get("/:itemId/tables/:tableName/rows", async (req, res) => {
    const token = req.session.accessToken;
    const { itemId, tableName } = req.params;
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/tables/${tableName}/rows`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).send(err.response?.data || err.message);
    }
});

router.post("/:itemId/tables/:tableName/rows", async (req, res) => {
    const token = req.session.accessToken;
    const { itemId, tableName } = req.params;
    const { values } = req.body;
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const response = await axios.post(
            `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/tables/${tableName}/rows/add`,
            { values },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).send(err.response?.data || err.message);
    }
});

router.delete("/:itemId/tables/:tableName/rows/:index", async (req, res) => {
    const token = req.session.accessToken;
    const { itemId, tableName, index } = req.params;
    if (!token) return res.status(401).send("Unauthorized");

    try {
        await axios.post(
            `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/tables/${tableName}/rows/itemAt(index=${index})/delete`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.response?.data || err.message);
    }
});

export default router;
