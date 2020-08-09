const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require("node-fetch");
const queryString = require('query-string');
const controllers = module.exports;
const get = require('lodash/get');


// we're typically going to care about stations 57 and 71
controllers.cimisFetch = async (root, { filters }) => {
  filters.appKey = process.env.CIMIS_APPKEY
  const filterQuery = queryString.stringify(filters, { arrayFormat: 'comma' })
  const requestURI = `${process.env.CIMIS_HOST}?${filterQuery}`

  const cimisData = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json"
    }
  })).json()
  return cimisData
}

controllers.dailyEto = async (root, { station, startDate, endDate }) => {

  let filters = {}
  filters.targets = [station]
  filters.startDate = startDate
  filters.endDate = endDate

  const data = await controllers.cimisFetch(null, { filters })

  const records = get(data, 'Data.Providers[0].Records', [])
  return records.map(record => get(record, 'DayAsceEto.Value', 0))
}