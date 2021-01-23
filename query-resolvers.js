const controllers = require('./controllers')
module.exports = {
  cimis: controllers.cimisFetch,
  eto: controllers.eto,
  field: controllers.agrianFetchRecord("/core/fields", "field"),
  fields: controllers.agrianFetch("/core/fields", "fields"),
  // farms: controllers.agrianFetch("/core/farms", "farms"),
  // growers: controllers.agrianFetch("/core/growers", "growers"),
  // plantings: controllers.agrianFetch("/core/plantings", "plantings"),
  getField: controllers.getField,
  listFields: controllers.listFields,
}