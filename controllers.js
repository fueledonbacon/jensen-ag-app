const fetch = require("node-fetch");
const queryString = require('query-string');
const controllers = module.exports;
const FieldClass = require("./field-class")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const get = require('lodash/get');

const agrianGetRequest = async (requestURI) => {
  let data = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json",
      "Authorization": `API-KEY ${process.env.AGRIAN_API_KEY}`,
      "Content-Type": "application/json; charset=UTF-8"
    }
  })).json()
  return data
}

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

controllers.cimisFetchLatLng = async (root, { lat, long, startDate, endDate }) => {
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
  return records.map(record => ({
    date: get(record, 'Date', null),
    value: get(record, 'DayAsceEto.Value', 0)
  }))
}

controllers.getField = async (root, { agrian_id, start_date, end_date }) => {
  const fieldData = await FieldClass.fetch(agrian_id)
  return new FieldClass(fieldData, start_date, end_date)
}

controllers.listFields = async () => {
  let data = await FieldClass.listAll()
  for(let i = 0; i < data.length; i++){
    data[i] = new FieldClass(data[i])
  }
  return data
}


controllers.agrianFetch = (endpoint, topLevelKey) => async (root, { attrs, limit = -1 }) => {
  const requestURI = `${process.env.AGRIAN_HOST}${endpoint}`

  let data = await agrianGetRequest(requestURI)
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

controllers.agrianFetchRecord = (endpoint, topLevelKey = "") => async (root, { id, attrs }) => {
  const requestURI = `${process.env.AGRIAN_HOST}${endpoint}/${id}`

  let data = await agrianGetRequest(requestURI)

  data = get(data, topLevelKey, data)
  let record = data
  if (Array.isArray(attrs) && attrs.length > 0) {
    record = []
    for (const key of attrs) {
      record[key] = get(arr[i], key, null)
    }
  }
  return record
}

controllers.syncFields = async () => {
  let fields = await controllers.agrianFetch('/core/fields', "fields")(null, {
    attrs: ['area', 'name', 'id', 'boundary_map.centroid']
  })

  for (const [i, field] of fields.entries()) {
    let [, points] = field["boundary_map.centroid"].match(/POINT \((.*)\)/)
    const [long, lat] = points.split(" ")
    const { name, id, area } = field
    await prisma.field.upsert({
      where: {
        agrian_id: id
      },
      update: {
        name,
        lat: Number(lat),
        long: Number(long),
        area
      },
      create: {
        agrian_id: id,
        name,
        lat: Number(lat),
        long: Number(long),
        area
      }
    })
  }
  return 'OK'
}

controllers.updateField = async (root, {id, update}) => {
  return await prisma.field.update({
    where: {
      agrian_id: id
    },
    data: update
  })
}

controllers.createWaterEvent = async (root, {inputs}) => {
  return await prisma.waterEvent.create({
    data: {
      date: inputs.date,
      type: inputs.type,
      duration_hours: inputs.duration_hours,
      field: {
        connect: {
          agrian_id: inputs.agrian_field_id
        }
      }
    }
  })
}