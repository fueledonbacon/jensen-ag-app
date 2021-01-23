
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers');
const utilities = require('./utils')
module.exports = async ({req}) => {
  const jwtClaims = await utilities.getClaims(req)
  if(jwtClaims.email){
    const grower = await prisma.grower.findFirst({
      where : {
        email: jwtClaims.email
      }
    })
  }
  return {
    jwtClaims,
    controllers,
    prisma
  }
}