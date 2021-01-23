const controllers = require('./controllers')
const get = require('lodash.get')
module.exports = {
  cimis: controllers.cimisFetch,
  eto: controllers.eto,
  field: controllers.agrianFetchRecord("/core/fields", "field"),
  fields: async (root, args, { user }) => {
    if(!get(user, 'grower.id', ''))
      throw new Error('Grower ID not defined')
    await controllers.listFields({
      where: { grower_id: user.grower.id }
    })
  },
  getField: controllers.getField,
  listFields: async (root, args, { user }) => {
    if(!get(user, 'grower.id', ''))
      throw new Error('Grower ID not defined')
    return await controllers.listFields({
      where: { grower_id: user.grower.id }
    })
  },
}