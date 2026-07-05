function getHealth(req, res) {
  res.json({
    success: true,
    message: 'Backend Running'
  });
}

module.exports = {
  getHealth
};
