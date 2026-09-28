const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`LLD Practice Platform running on http://localhost:${PORT}`);
  console.log(`Default learner ID: ${require('./container').defaultLearnerId}`);
});

module.exports = app;
