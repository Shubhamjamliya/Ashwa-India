const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'transporter routes working' });
});

module.exports = router;
