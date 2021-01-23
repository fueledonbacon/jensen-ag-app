const controllers = require('./controllers')
module.exports =  {
  syncFields: controllers.syncFields,
  updateField: controllers.updateField,
  createWaterEvent: controllers.createWaterEvent,
  deleteWaterEvent: controllers.deleteWaterEvent,
  createWaterEvents: controllers.createWaterEvents,
  harvestEtoValues: controllers.harvestEtoValues,
  harvestFieldEtoValues: controllers.harvestFieldEtoValues,
  updateFieldEtoValues: controllers.updateFieldEtoValues,
  updateAllEtoValues: controllers.updateAllEtoValues
}