const express = require('express');
const { getFiles, getWorkbookTables, getTableRows, addTableRow, deleteTableRows } = require('../auth/msalAuth');
const router = express.Router();

router.get('/files', getFiles);
router.get('/workbook/:itemId/tables', getWorkbookTables);
router.get('/table/:tableId/rows', getTableRows);
router.post('/table/:tableId/rows', addTableRow);
router.delete('/table/:tableId/rows', deleteTableRows);

module.exports = router;
