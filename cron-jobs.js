const cron = require('node-cron')
const controllers = require('./resolvers');
cron.schedule('0 3 * * * ', controllers.updateAllEtoValues)