const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers')
const { get } = require('lodash')
const constants = require('./constants.json')
const utilities = require('./utilities')

const kc_value = (type, date, index = 0) => {
  const collection = get(constants, `kc.${type}[${index}].values`, [])
  const [, m, d] = date.split('-')
  let value = null
  for (const kc of collection) {
    const [kcm, kcd] = kc.date.split('-')
    if (Number(kcm) > Number(m) || ( Number(kcm) == Number(m) && Number(kcd) >= Number(d)) ) {
      break
    }
    value = Number(kc.value)
  }
  return value
}

module.exports = class Field {
  static async fetch(agrian_id) {
    const data = await prisma.field.findOne({ where: { agrian_id }, include: {water_events: true} })
    return data
  }
  static async listAll(withWaterEvents = false){
    const options = withWaterEvents ? { include: {water_events: true} } : {}
    const data = await prisma.field.findMany(options)
    return data
  }

  constructor(field, startDate, endDate) {
    Object.assign(this, field)
    this.startDate = startDate || this.start_date
    this.endDate = endDate || utilities.justDate(new Date())
    this.cache = new Map()
  }

  irrigation_rate_in_hr() {
    return 96.3 / 43560 * this.avg_gpm / this.area
  }
  mad() {
    return -1 * this.soil_holding_capacity * this.mad_percent
  }
  irrigation_efficiency() {
    return this.du * (1 - this.pre_infiltration_losses)
  }
  async eto() {
    let data = []
    if (this.startDate && this.endDate) {
      data = await controllers.eto(null, this)
      this.cache.set("eto_values", data)
    }
    return data
  }
  async etc() {
    if (this.cache.has("etc_values"))
      return this.cache.get("etc_values")
    let eto_arr = (this.cache.has("eto_values")) ? this.cache.get("eto_values") : await this.eto()

    let data = new Array(eto_arr.length)
    for (const [i, { date, value: eto }] of eto_arr.entries()) {
      let record = { date }
      const kc = kc_value(this.kc_type, date)
      record.value = Number(eto) * kc * this.canopy_cover_percent
      data[i] = record
    }
    this.cache.set("etc_values", data)
    return data
  }
  async smb() {
    const etc_values = (this.cache.has("etc_values")) ? this.cache.get("etc_values") : await this.etc()
    let events = new Map()
    for(const e of this.water_events){
      events.set(utilities.justDate(e.date), e)
    }
    let result = [{ date: null, value: 0 }]
    for (const [i, { date, value }] of etc_values.entries()) {
      let adjustment = 0
      if(events.has(date)) {
        const { duration_hours } = events.get(date) 
        adjustment = duration_hours * this.irrigation_rate_in_hr() * this.irrigation_efficiency()
      }
      let record = {
        date,
        value: Math.min(Number(result[i].value) - Number(value) + adjustment, 0)
      }
      result.push(record)
    }
    return result
  }
}
