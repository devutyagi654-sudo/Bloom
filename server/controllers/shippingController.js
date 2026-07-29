const { createShiprocketOrder } = require('../services/shiprocketService');
const {
  createShipment,
  getTrackingDetails,
  cancelShipment,
  requestReturn
} = require('./shiprocketController');

module.exports = {
  createShipment,
  getTrackingDetails,
  trackShipment: getTrackingDetails,
  cancelShipment,
  requestReturn,
  createShipmentInternal: createShiprocketOrder
};
