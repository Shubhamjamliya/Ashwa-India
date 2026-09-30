const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'store routes working' });
});

module.exports = router;
