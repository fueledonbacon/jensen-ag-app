
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers')(prisma);
const utilities = require('./utils')
module.exports = async ({req}) => {
  const jwtClaims = await utilities.getClaims(req)
  return {
    jwtClaims,
    // user,
    controllers,
    prisma
  }
}