const utilities = module.exports

utilities.justDate = (date) => date.toISOString().split('T')[0]
