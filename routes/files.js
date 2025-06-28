const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked'); // Use destructuring to get the function
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const FILES_DIR = path.join(__dirname, '../userfiles');

// List all markdown files
router.get('/', requireAuth, (req, res) => {
    fs.readdir(FILES_DIR, (err, files) => {
        if (err) return res.status(500).send('Error reading files');
        res.render('files', { files });
    });
});

// View a file
router.get('/view/:filename', requireAuth, (req, res) => {
    const filePath = path.join(FILES_DIR, req.params.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('File not found');
        const html = marked(data);
        res.render('file_view', { filename: req.params.filename, html });
    });
});

// Edit a file (GET)
router.get('/edit/:filename', requireAuth, (req, res) => {
    const filePath = path.join(FILES_DIR, req.params.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('File not found');
        res.render('file_edit', { filename: req.params.filename, content: data });
    });
});

// Edit a file (POST)
router.post('/edit/:filename', requireAuth, (req, res) => {
    const filePath = path.join(FILES_DIR, req.params.filename);
    fs.writeFile(filePath, req.body.content, err => {
        if (err) return res.status(500).send('Error saving file');
        res.redirect('/files/view/' + req.params.filename);
    });
});

// Create new file (GET)
router.get('/new', requireAuth, (req, res) => {
    res.render('file_edit', { filename: '', content: '' });
});

// Create new file (POST)
router.post('/new', requireAuth, (req, res) => {
    const filename = req.body.filename;
    const filePath = path.join(FILES_DIR, filename);
    fs.writeFile(filePath, req.body.content, err => {
        if (err) return res.status(500).send('Error creating file');
        res.redirect('/files/view/' + filename);
    });
});

module.exports = router;
