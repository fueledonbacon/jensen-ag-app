require('dotenv').config()
const store = require('./store')
const { GraphQLJSON } = require('graphql-type-json')
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const controllers = require('./controllers');
const utilities = require('./utilities')
const bodyParser = require('body-parser')
const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const app = express()
app.use(bodyParser.json())

const typeDefs = gql`
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
  }

  type Mutation{
    syncFields: String
  }

  type Field{
    id: ID!
    agrian_id: String
    agrian_data: JSON
    start_date: Date
    irrigation_rate_in_hr: Float
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
    water_events: [WaterEvent]
  }

  type Datapoint{
    date: Date
    value: Float
  }

  type WaterEvent {
    id: ID!
    duration_hours: Int
    date: Date
    type: String
    field_id: Int
  }
`

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return utilities.justDate(new Date(value)); // value from the client
    },
    serialize(value) {
      return utilities.justDate(new Date(value))
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return utilities.justDate(new Date(+ast.value)) // ast value is always in string format
      }
      return null;
    },
  }),
  JSON: GraphQLJSON,
  Query: {
    cimis: controllers.cimisFetch,
    eto: controllers.eto,
    field: controllers.agrianFetchRecord("/core/fields", "field"),
    // fields: controllers.agrianFetch("/core/fields", "fields"),
    // farms: controllers.agrianFetch("/core/farms", "farms"),
    // growers: controllers.agrianFetch("/core/growers", "growers"),
    // plantings: controllers.agrianFetch("/core/plantings", "plantings"),
    getField: controllers.getField,
  },
  Mutation: {
    syncFields: controllers.syncFields
  }
}

const schema = new ApolloServer({
  typeDefs,
  resolvers,
  playground: {
    endpoint: '/graphql'
  },
  context: store
})

schema.applyMiddleware({ app })

app.get('/', (req, res) => {
  res.send("Soon there will be graphs here")
})

app.listen(process.env.PORT,() => {
  console.log(`Listening on ${process.env.PORT}`)
})