const controllers = require('./controllers')
const get = require('lodash/get')
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
  listFields: async (root, { where }, { user, utilities }) => {
    let listQuery = { where }

    if(!utilities.isAdmin(user)){
      const grower_id = get(user, 'grower.id', '')
      if(!grower_id)
        throw new Error('Grower ID not defined')
      listQuery.where.grower_id = grower_id
    }
    return await controllers.listFields(listQuery)
  },
  self: async (root, args, { user }) => {
    return user
  }
}