const utilities = module.exports

utilities.justDate = (date) => date.toISOString().split('T')[0]
utilities.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))