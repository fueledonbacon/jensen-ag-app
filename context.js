
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers');
const utilities = require('./utils')

module.exports = async ({ req }) => {
  let user = await utilities.getClaims(req)
  if(user.email){
    const grower = await prisma.grower.findFirst({
      where : {
        email: jwtClaims.email
      }
    })
    user.grower = grower
  }
  return {
    user,
    controllers,
    prisma
  }
}