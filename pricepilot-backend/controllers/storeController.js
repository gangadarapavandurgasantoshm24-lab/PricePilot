const storeService = require('../services/storeService');

function getStores(req, res) {
  res.json({
    success: true,
    stores: storeService.getSupportedStores()
  });
}

module.exports = {
  getStores
};
