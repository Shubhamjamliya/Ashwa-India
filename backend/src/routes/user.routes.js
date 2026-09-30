const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'user routes working' });
});

module.exports = router;
