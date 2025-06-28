const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const api = require('../middleware/APIRequests');
require('dotenv').config();

// GET /search (search form and results)
router.get('/', auth.requireAuth, async function (req, res) {
  const { name, tag, content, type } = req.query;
  const token = process.env.BEARER_TOKEN;
  let results = [];
  let error = null;

  // Only search if at least one field is filled
  if (name || tag || content || type) {
    // Build API URL with query params
    let apiUrl = `https://api.bdpadrive.com/v1/search?`;
    if (name) apiUrl += `name=${encodeURIComponent(name)}&`;
    if (tag) apiUrl += `tag=${encodeURIComponent(tag)}&`;
    if (content) apiUrl += `content=${encodeURIComponent(content)}&`;
    if (type) apiUrl += `type=${encodeURIComponent(type)}&`;
    apiUrl = apiUrl.replace(/&$/, '');

    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] Search API URL: ${apiUrl}`);
    }

    try {
      const apiRes = await api.getWithBearerToken(apiUrl, token);
      if (process.env.DEBUG === 'true') {
        console.log(`[DEBUG] Search API response:`, apiRes);
      }
      if (apiRes.status === 200 && Array.isArray(apiRes.data)) {
        // Sort: files by modified desc, folders/symlinks by created desc
        results = apiRes.data.sort((a, b) => {
          if (a.type === 'file' && b.type === 'file') {
            return new Date(b.modifiedAt) - new Date(a.modifiedAt);
          } else if (a.type !== 'file' && b.type !== 'file') {
            return new Date(b.createdAt) - new Date(a.createdAt);
          } else {
            // files before folders/symlinks
            return a.type === 'file' ? -1 : 1;
          }
        });
      } else if (apiRes.status !== 200) {
        error = apiRes.data && apiRes.data.message ? apiRes.data.message : 'Search failed.';
      }
    } catch (err) {
      error = 'Error searching files/folders.';
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Search error:`, err);
      }
    }
  }
  res.render('search', { results, error });
});

module.exports = router;
