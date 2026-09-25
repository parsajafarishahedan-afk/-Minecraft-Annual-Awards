const express = require('express');
const path = require('path');
const config = require('./config');
const { initDB } = require('./database');
const apiRoutes = require('./api');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function start() {
  try {
    initDB();
  } catch (err) {
    console.error('âŒ DB init error:', err.message);
    process.exit(1);
  }
  app.listen(config.port, () => {
    console.log('ðŸš€ Server running on http://localhost:' + config.port);
  });
}

start();
