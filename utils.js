const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const cert = fs.readFileSync(path.resolve(__dirname, 'cert.pem'));

const utils = module.exports

utils.getClaims = (request) => {
  const Authorization = request.get('authorization')
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    if(process.env.NODE_ENV === 'development' && token === 'test'){
      return ({ email: 'eric@cwynar.dev' , sub: 'irrelevant' })
    }
    try{
      const claims = jwt.verify(token, cert);
      if(claims){
        return claims;
      }
      throw new Error("Invalid authorization header.")
    } catch(e){
      throw new Error("Invalid authorization header.")
    }
  }

  return null
}

utils.justDate = (date) => date.toISOString().split('T')[0]

utils.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))