const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'provider routes working' });
});

module.exports = router;
