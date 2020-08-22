const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controllers = require('./controllers')
const constants = require('./constants.json')
module.exports = class Field{
  static async fetch(agrian_id){
    const data = await prisma.field.findOne({ where: { agrian_id } })
    return data
  }

  constructor(field, startDate, endDate){
    Object.assign(this, field)
    this.startDate = startDate
    this.endDate = endDate
  }

  irrigation_rate_in_hr(){
    return 96.3 / 43560 * this.avg_gpm / this.area
  }
  mad(){
    return -1 * this.soil_holding_capacity * this.mad_percent
  }
  irrigation_efficiency(){
    return this.du * (1 - this.pre_infiltration_losses)
  }
  etc(){
    return 0
  }
  smb(){
    return 0
  }
  async eto(){
    if(this.startDate && this.endDate){
      return await controllers.eto(null, this) 
    }
    return []
  }
}