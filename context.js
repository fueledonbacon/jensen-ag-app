
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers');
const utilities = require('./utils')
const get = require('lodash/get')

module.exports = async ({ req }) => {
  let user = await utilities.getClaims(req) || {}
  if(user.email){
    const grower = await prisma.grower.findFirst({
      where : {
        email: user.email
      }
    })
    user.grower = grower || null
  }
  user.isAdmin = utilities.isAdmin(user)
  return {
    user,
    controllers,
    prisma,
    utilities
  }
}