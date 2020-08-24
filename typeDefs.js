const { gql } = require('apollo-server-express')
module.exports = gql`
  scalar Date
  scalar JSON

  type Query{
    cimis(filters: JSON): JSON
    eto(lat: Float, long: Float, startDate: String, endDate: String): [Float]
    fields(attrs: [String], limit: Int): JSON
    field(id: String, attrs: [String]): JSON
    farms(attrs: [String], limit: Int): JSON
    growers(attrs: [String], limit: Int): JSON
    plantings(attrs: [String], limit: Int): JSON
    getField(agrian_id: String, start_date: String, end_date: String): Field
    listFields: [Field]
  }

  type Mutation{
    syncFields: String
    updateField(id: String, update: FieldUpdate): Field
    createWaterEvent(inputs: WaterEventInput): WaterEvent
  }

  type Field{
    id: ID!
    agrian_id: String
    agrian_data: JSON
    start_date: Date
    mad: Float
    irrigation_efficiency: Float
    etc: [Datapoint]
    eto: [Datapoint]
    smb: [Datapoint]
    name: String
    lat: Float
    long: Float
    soil_type: String
    water_holding_capacity: Float
    avg_gpm: Int
    du: Float
    area: Float
    wetted_area_percent: Float
    pre_infiltration_losses: Float
    canopy_cover_percent: Float
    soil_holding_capacity: Float
    rooting_depth: Float
    mad_percent: Float
    kc_type: String
    irrigation_rate_in_hr: Float
    water_events: [WaterEvent]
  }

  input FieldUpdate{
    start_date: Date
    soil_type: String
    avg_gpm: Int
    du: Float
    area: Float
    wetted_area_percent: Float
    pre_infiltration_losses: Float
    canopy_cover_percent: Float
    soil_holding_capacity: Float
    rooting_depth: Float
    mad_percent: Float
    kc_type: String
  }

  type Datapoint{
    date: Date
    value: Float
  }

  input WaterEventInput{
    duration_hours: Int
    date: Date
    type: String
    agrian_field_id: String
  }

  type WaterEvent {
    id: ID!
    duration_hours: Int
    date: Date
    type: String
    agrian_field_id: String
    field: Field
  }
`