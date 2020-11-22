const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./resolvers')
const { get } = require('lodash')
const constants = require('./constants.json')
const moment = require('moment')
const utilities = require('./utils')

const kc_value = (type, date, index = 0) => {
  const collection = get(constants, `kc.${type}[${index}].values`, [])
  const m = moment(date).month()
  const d = moment(date).date()
  let value = null
  for (const kc of collection) {
    const kcm = moment(new Date(kc.date)).month()
    const kcd = moment(new Date(kc.date)).date()
    if (kcm > m || (kcm == m && kcd >= d)) {
      break
    }
    value = Number(kc.value)
  }
  return value
}

module.exports = class Field {
  static async fetch(agrian_id) {
    const data = await prisma.field.findOne({ where: { agrian_id }, include: { water_events: true, et_values: true } })
    return data
  }

  static async listAll(water = false, eto = false) {
    const options = {
      include: {
        water_events: water,
        et_values: eto
      }
    } 
    const data = await prisma.field.findMany(options)
    return data
  }

  constructor(field) {
    field.et_values = get(field, 'et_values', [])
    field.et_values.sort((a,b) => a.date.getTime() - b.date.getTime())
    this.et_values = field.et_values
    Object.assign(this, field)
    if(field.et_values.length > 0){
      let start = Math.max(new Date(field.start_date).getTime(), new Date(field.et_values[0].date).getTime())
      this.start_date = moment(new Date(start)).format('YYYY-MM-DD')
    }
  }


  static async harvestEtoValues(field) {
    
    let startDate = moment().format('YYYY-MM-DD')
    do {
      let endDate = moment(startDate).subtract(1, 'day').format('YYYY-MM-DD')
      startDate = moment(endDate).subtract(30, 'days').format('YYYY-MM-DD')
      try {
        console.log(`month: ${moment(startDate).month()}, field: ${field.agrian_id}`)
        const eto_values = await controllers.eto(null, {
          lat: field.lat,
          long: field.long,
          startDate,
          endDate
        })
        for (const eto of eto_values) {
          const date = moment(eto.date).format('YYYY-MM-DD')
          await prisma.eTValue.upsert({
            where: {
              key: `${field.agrian_id}:${date}`
            },
            update: {
              value: Number(eto.value)
            },
            create: {
              key: `${field.agrian_id}:${date}`,
              date: new Date(date),
              value: Number(eto.value),
              field: {
                connect: {
                  agrian_id: field.agrian_id
                }
              }
            }
          })
        }
      } catch (e) {
        console.log(e)
      }
      await utilities.timeout(2000)
    } while (moment(startDate).month() > 1)

    return 'OK'
  }

  static async updateEtoValues(field) {
    const last = get(field, 'et_values.length', 0) - 1

    if(last < 0){
      console.log(`No ET values associated with field ${field.agrian_id}`)
      await Field.harvestEtoValues(field)
      return
    } 

    const endDate = moment().startOf('day').subtract(2, 'day').format('YYYY-MM-DD')
    const lastDate = field.et_values[last].date
    let startDate = moment(new Date(lastDate)).subtract(1, 'day').format('YYYY-MM-DD')

    if(new Date(endDate).getTime() - new Date(startDate).getTime() > 90 * 24 * 60 * 60 * 1000){
      console.log(`More than 90 days of data missing, getting 90 days ${field.name}, id: ${field.agrian_id}`)
      startDate = moment(new Date(endDate)).subtract(90, 'days').format('YYYY-MM-DD')
    }

    if(new Date(startDate).getTime() >= new Date(endDate).getTime()){
      console.log(`field: ${field.agrian_id} already up to date`)
      return 
    }

    console.log(`field: ${field.agrian_id}, start: ${startDate}, end: ${endDate}`)
    try {
      const eto_values = await controllers.eto(null, {
        lat: field.lat,
        long: field.long,
        startDate,
        endDate
      })
      for (const eto of eto_values) {
        const date = moment(eto.date).format('YYYY-MM-DD')
        console.log(`date: ${date}, value: ${eto.value}`)
        await prisma.eTValue.upsert({
          where: {
            key: `${field.agrian_id}:${date}`
          },
          update: {
            value: Number(eto.value)
          },
          create: {
            key: `${field.agrian_id}:${date}`,
            date: new Date(date),
            value: Number(eto.value),
            field: {
              connect: {
                agrian_id: field.agrian_id
              }
            }
          }
        })
      }
    } catch (e) {
      console.log(e)
    }

    return 'OK'
  }
  
  end_date(){
    if(this.et_values.length > 0)
      return this.et_values.slice(-1)[0].date
    return new Date(moment().startOf('day').subtract(2, 'days').format('YYYY-MM-DD'))
  }

  irrigation_rate_in_hr() {
    return 96.3 / 43560 * this.avg_gpm / (this.area / this.irrigated_blocks)
  }
  mad() {
    return -1 * this.soil_holding_capacity * this.mad_percent
  }
  irrigation_efficiency() {
    return this.du * (1 - this.pre_infiltration_losses)
  }
  eto() {
    let data = get(this, 'et_values', [])
    let start = new Date(this.start_date).getTime()
    let end = new Date(this.end_date()).getTime()
    data = data.filter(et => {
      const curr = new Date(et.date).getTime()
      return curr >= start && curr <= end
    })

    return data
  }
  etc() {
    let result = []
    for (const { date, value: eto } of this.eto()) {
      let record = { date }
      const kc = kc_value(this.kc_type, date)
      record.value = Number(eto) * kc * this.canopy_cover_percent
      result.push(record)
    }
    return result
  }
  smb() {
    let events = new Map()
    for (const e of this.water_events) {
      events.set(utilities.justDate(e.date), e)
    }
    let result = [{ date: moment(this.start_date).subtract(1, 'day').format('YYYY-MM-DD'), value: 0 }]
    for (const { date, value } of this.etc()) {
      let adjustment = 0
      const dateKey = utilities.justDate(date)
      if (events.has(dateKey)) {
        const { duration_hours } = events.get(dateKey)
        adjustment = duration_hours * this.irrigation_rate_in_hr() * this.irrigation_efficiency()
      }
      const last = result[result.length - 1]
      let record = {
        date,
        value: Math.max(Math.min(Number(last.value) - Number(value) + adjustment, 0), -1 * this.depletion_limit)
      }
      result.push(record)
    }
    return result
  }
}
