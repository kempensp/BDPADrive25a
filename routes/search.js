const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const FILES_DIR = path.join(__dirname, '../userfiles');

// Search files by filename or content
router.get('/', requireAuth, (req, res) => {
    const query = req.query.q;
    fs.readdir(FILES_DIR, (err, files) => {
        if (err) return res.status(500).send('Error reading files');
        if (!query) return res.render('search', { files: [], query: '' });
        const results = [];
        let pending = files.length;
        if (!pending) return res.render('search', { files: [], query });
        files.forEach(file => {
            const filePath = path.join(FILES_DIR, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (!err && (file.includes(query) || data.includes(query))) {
                    results.push(file);
                }
                if (!--pending) {
                    res.render('search', { files: results, query });
                }
            });
        });
    });
});

module.exports = router;
