const fetch = require("node-fetch");
const queryString = require('query-string');
const controllers = module.exports;
const FieldClass = require("./field-class")
const get = require('lodash/get');


// we're typically going to care about stations 57 and 71
controllers.cimisFetch = async (root, { filters, format = 'comma' }) => {
  filters.appKey = process.env.CIMIS_APPKEY
  const filterQuery = queryString.stringify(filters, { arrayFormat: format })
  const requestURI = `${process.env.CIMIS_HOST}?${filterQuery}`

  const cimisData = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json"
    }
  })).json()
  return cimisData
}

controllers.cimisFetchLatLng = async (root, { lat, long, startDate, endDate } ) => {
  const requestURI = `${process.env.CIMIS_HOST}?appKey=${process.env.CIMIS_APPKEY}&targets=lat=${lat},lng=${long}&startDate=${startDate}&endDate=${endDate}`
  const cimisData = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json"
    }
  })).json()
  return cimisData
}

controllers.eto = async (root, args) => {
  const data = await controllers.cimisFetchLatLng(null, args)
  const records = get(data, 'Data.Providers[0].Records', [])
  return records.map(record => get(record, 'DayAsceEto.Value', 0))
}

controllers.getField = async (root, { agrian_id, start_date, end_date }) => {
  const fieldData = await FieldClass.fetch(agrian_id)
  return new FieldClass(fieldData, start_date, end_date)
}

controllers.agrianFetch = (endpoint, topLevelKey) => async (root, { attrs, limit = -1 }) => {
  const requestURI = `${process.env.AGRIAN_HOST}${endpoint}`

  let data = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json",
      "Authorization": `API-KEY ${process.env.AGRIAN_API_KEY}`,
      "Content-Type": "application/json; charset=UTF-8"
    }
  })).json()

  let arr = get(data, topLevelKey, [])
  if (Array.isArray(attrs) && attrs.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      let record = {}
      for (const key of attrs) {
        record[key] = get(arr[i], key, null)
      }
      arr[i] = record
    }
  }
  return (limit > -1) ? arr.slice(0, limit) : arr
}
