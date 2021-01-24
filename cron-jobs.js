const cron = require('node-cron')
const controllers = require('./controllers');
cron.schedule('0 3 * * * ', controllers.updateAllEtoValues)