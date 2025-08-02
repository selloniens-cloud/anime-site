const express = require('express');
const router = express.Router();

// GET /api/external/mal
router.get('/mal', (req, res) => {
  res.json({ 
    message: 'MyAnimeList API endpoint',
    status: 'working'
  });
});

// GET /api/external/anilist
router.get('/anilist', (req, res) => {
  res.json({ 
    message: 'AniList API endpoint',
    status: 'working'
  });
});

// GET /api/external/kitsu
router.get('/kitsu', (req, res) => {
  res.json({ 
    message: 'Kitsu API endpoint',
    status: 'working'
  });
});

module.exports = router;