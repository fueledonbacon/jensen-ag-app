const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const file = fs.readFileSync(path.resolve(__dirname,'.test-env'))
const result = dotenv.parse(file)
console.log(result.parsed)
for (const k in result) {
  process.env[k] = result[k]
}
console.log(process.env.AGRIAN_API_KEY)
const controllers = require('./controllers')
global.controllers = controllers