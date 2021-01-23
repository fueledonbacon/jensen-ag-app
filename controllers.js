const fetch = require("node-fetch");
const queryString = require('query-string');
const controllers = module.exports;
const FieldClass = require("./field-class")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment');
const utilities = require('./utilities');
const get = require('lodash/get');
const { snakeCase } = require('change-case')

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

const csv = require('csv-parse/lib/sync')
const fs = require('fs')
const path = require('path')

controllers.importFields = async () => {
  const fields = fs.readFileSync(path.resolve(__dirname, 'prisma/fields.csv'))
  const collection = csv(fields, { columns: true })
  for (const field of collection) {
    for(const key in field){
      try{
        if(key == 'start_date'){
          field[key] = new Date(Number(field[key]))
          continue
        }
        if(['soil_type', 'kc_type'].includes(key))
          continue
        if(['grower_id'].includes(key)){
          delete field[key]
        }
        if(!isNaN(Number(field[key])))
          field[key] = Number(field[key])
      } catch {
        // nothing
      }
    }
    try{
      await prisma.field.upsert({
        where: { id: field.id }, 
        create: field,
        update: field
      })
    } catch(e) {
      console.error(e)
    }
  }
  return collection
}

controllers.prisma = prisma

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

controllers.harvestEtoValues = async () => {
  const fields = await FieldClass.listAll()
  for (const field of fields) {
    await FieldClass.harvestEtoValues(field)
  }
  return 'OK'
}

controllers.harvestFieldEtoValues = async (root, {agrian_id}) => {
  const field = await FieldClass.fetch(agrian_id)
  await FieldClass.harvestEtoValues(field)
  return 'OK'
}

controllers.updateAllEtoValues = async () => {
  const fields = await FieldClass.listAll(false, true)
  for (const field of fields) {
    await FieldClass.updateEtoValues(field)
  }
  return 'OK'
}

controllers.updateFieldEtoValues = async (root, {agrian_id}) => {
  const field = await FieldClass.fetch(agrian_id)
  await FieldClass.updateEtoValues(field)
  return 'OK'
}

controllers.listFields = async () => {
  let data = await FieldClass.listAll(true)
  for (let i = 0; i < data.length; i++) {
    data[i] = new FieldClass(data[i])
  }
  return data
}

controllers.test = () => { console.log('works') }

controllers.syncGrowers = async () => {
  let growers =  await controllers.agrianFetchDirect('core/growers', {
    attrs: ['id', 'account_number', 'code']
  })
  for(const grower of growers){
    try{
      await prisma.grower.upsert({
        where: {
          id: grower.id,
        },
        create: {
          id: grower.id,
          email: grower.account_number
        },
        update: {
          email: grower.account_number
        }
      })
    } catch (e) {
      console.log(e.message)
    }
  }
  return growers
}

controllers.associateFieldsGrowers = async () => {
  const relationships = await controllers.agrianFetchDirect('core/fields', {
    attrs: [`id`, `associations.['agrian.grower'][0]`]
  })

  for(const rel of relationships){
    if(rel.associations_agrian_grower_0){
      console.log(`associate field ${rel.id} grower ${rel.associations_agrian_grower_0}`)
      try{
        const grower = await prisma.grower.findFirst({where: {id: rel.associations_agrian_grower_0}})
        if(!grower)
          throw new Error(`Grower ${rel.associations_agrian_grower_0} not in db`)
        await prisma.field.update({
          where: { agrian_id: rel.id },
          data: {
            grower_id: rel.associations_agrian_grower_0
          }
        })
      } catch (e) {
        console.log(e.message)
      }
    }
  }
}

controllers.agrianFetchDirect = async (endpoint, options = { attrs: [], limit: -1 } ) => {
  const url = new URL(endpoint, process.env.AGRIAN_HOST)

  const topLevelKey = endpoint.split('/')[1]

  let data = await agrianGetRequest(url.toString())

  let arr = []
  while (data.meta.page <= data.meta.page_count) {
    url.search = new URLSearchParams({ page: data.meta.page })
    data = await agrianGetRequest(url.toString())
    let pageData = get(data, topLevelKey, [])
    for (const item of pageData) {
      arr.push(item)
    }
    data.meta.page++
  }
  if (Array.isArray(options.attrs) && options.attrs.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      let record = {}
      for (const key of options.attrs) {
        record[snakeCase(key)] = get(arr[i], key, null)
      }
      arr[i] = record
    }
  }
  return (options.limit > -1) ? arr.slice(0, options.limit) : arr
}

controllers.agrianFetch = (endpoint, topLevelKey) => async (root, { attrs, limit = -1 }) => {
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


controllers.updateField = async (root, { id, update }) => {
  return await prisma.field.update({
    where: {
      agrian_id: id
    },
    data: update
  })
}

controllers.createWaterEvent = async (root, { inputs }) => {
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
controllers.deleteWaterEvent = async (root, { id }) => {
  return await prisma.waterEvent.delete({
    where: {
      id
    }
  })
}

controllers.createWaterEvents = async (root, { inputs }) => {
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