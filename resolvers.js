const fetch = require("node-fetch");
const queryString = require('query-string');
const resolvers = module.exports;
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

resolvers.cimisFetch = async (root, { filters, format = 'comma' }) => {
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

resolvers.cimisFetchLatLng = async (root, { lat, long, startDate, endDate }) => {
  const requestURI = `${process.env.CIMIS_HOST}?appKey=${process.env.CIMIS_APPKEY}&targets=lat=${lat},lng=${long}&startDate=${startDate}&endDate=${endDate}`
  const cimisData = await (await fetch(requestURI, {
    method: 'GET',
    headers: {
      "Accept": "application/json"
    }
  })).json()
  return cimisData
}

resolvers.eto = async (root, args) => {
  const data = await resolvers.cimisFetchLatLng(null, args)
  const records = get(data, 'Data.Providers[0].Records', [])
  return records.map(record => ({
    date: get(record, 'Date', null),
    value: get(record, 'DayAsceEto.Value', 0)
  }))
}

resolvers.getField = async (root, { agrian_id, start_date, end_date }) => {
  const fieldData = await FieldClass.fetch(agrian_id)
  return new FieldClass(fieldData, start_date, end_date)
}

resolvers.harvestEtoValues = async () => {
  const fields = await FieldClass.listAll()
  for (const field of fields) {
    await FieldClass.harvestEtoValues(field)
  }
  return 'OK'
}

resolvers.harvestFieldEtoValues = async (root, {agrian_id}) => {
  const field = await FieldClass.fetch(agrian_id)
  await FieldClass.harvestEtoValues(field)
  return 'OK'
}

resolvers.updateAllEtoValues = async () => {
  const fields = await FieldClass.listAll(false, true)
  for (const field of fields) {
    await FieldClass.updateEtoValues(field)
  }
  return 'OK'
}

resolvers.updateFieldEtoValues = async (root, {agrian_id}) => {
  const field = await FieldClass.fetch(agrian_id)
  await FieldClass.updateEtoValues(field)
  return 'OK'
}

resolvers.listFields = async () => {
  let data = await FieldClass.listAll(true)
  for (let i = 0; i < data.length; i++) {
    data[i] = new FieldClass(data[i])
  }
  return data
}


resolvers.agrianFetch = (endpoint, topLevelKey) => async (root, { attrs, limit = -1 }) => {
  const requestURI = `${process.env.AGRIAN_HOST}${endpoint}`

  let data = await agrianGetRequest(requestURI)
  let arr = []
  while (data.meta.page < data.meta.page_count) {
    data = await agrianGetRequest(`${requestURI}?page=${data.meta.page + 1}`)
    let pageData = get(data, topLevelKey, [])
    for (const page of pageData) {
      arr.push(page)
    }
  }
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

resolvers.agrianFetchRecord = (endpoint, topLevelKey = "") => async (root, { id, attrs }) => {
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

resolvers.syncFields = async () => {
  let fields = await resolvers.agrianFetch('/core/fields', "fields")(null, {
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

resolvers.updateField = async (root, { id, update }) => {
  return await prisma.field.update({
    where: {
      agrian_id: id
    },
    data: update
  })
}

resolvers.createWaterEvent = async (root, { inputs }) => {
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
resolvers.deleteWaterEvent = async (root, { id }) => {
  return await prisma.waterEvent.delete({
    where: {
      id
    }
  })
}

resolvers.createWaterEvents = async (root, { inputs }) => {
  for(const event of inputs){
    await prisma.waterEvent.create({
      data: {
        date: event.date,
        type: event.type,
        duration_hours: event.duration_hours,
        field: {
          connect: {
            agrian_id: event.agrian_field_id
          }
        }
      }
    })
  }
  return 'OK'
}