const controllers = require('./controllers')
module.exports =  {
  syncFields: controllers.syncFields,
  updateField: controllers.updateField,
  createWaterEvent: async (root, args, {user}) => {
    if(!user.isAdmin){
      throw new Error('Admin only operation')
    }
    return await controllers.createWaterEvent(args)
  },
  deleteWaterEvent: async (root, args, { user }) => {
    if(!user.isAdmin){
      throw new Error('Admin only operation')
    }
    return await controllers.deleteWaterEvent(args)
  },
  createWaterEvents: async (root, args, { user }) => {
    if(!user.isAdmin){
      throw new Error('Admin only operation')
    }
    return await controllers.createWaterEvents(args)
  },
  harvestEtoValues: controllers.harvestEtoValues,
  harvestFieldEtoValues: controllers.harvestFieldEtoValues,
  updateFieldEtoValues: controllers.updateFieldEtoValues,
  updateAllEtoValues: controllers.updateAllEtoValues
}