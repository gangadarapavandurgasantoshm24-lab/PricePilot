const app = require('./app');
const { PORT } = require('./config/constants');

app.listen(PORT, () => {
  console.log(`PricePilot backend running on http://localhost:${PORT}`);
});
