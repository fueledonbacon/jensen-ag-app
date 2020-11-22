
const utilities = require('./utils')
module.exports = async ({req}) => {
  const jwtClaims = await utilities.getClaims(req)
  return {
    jwtClaims,
    // user,
    // controllers
  }
}