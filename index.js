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
    console.error('❌ DB init error:', err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();