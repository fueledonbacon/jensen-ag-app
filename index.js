require('dotenv').config()
const { ApolloServer, gql } = require('apollo-server')
const store = require('./store')
const { GraphQLJSON } = require('graphql-type-json')
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const controllers = require('./controllers');

const typeDefs = gql`
  scalar Date
  scalar JSON

  type Query{
    soilMoistureBalance(field: String, date: Date): SoilMoistureBalanceData
    cimis(filters: JSON): JSON
    eto(lat: Float, long: Float, startDate: String, endDate: String): [Float]
    fields(attrs: [String], limit: Int): JSON
    farms(attrs: [String], limit: Int): JSON
    growers(attrs: [String], limit: Int): JSON
    plantings(attrs: [String], limit: Int): JSON
    getField(agrian_id: String, start_date: String, end_date: String): Field
  }

  type Field{
    id: ID!
    agrian_id: String
    agrian_data: JSON
    start_date: Date
    irrigation_rate_in_hr: Float
    mad: Float
    irrigation_efficiency: Float
    etc: [Float]
    eto: [Float]
    smb: [Float]
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
  }
  
  type SoilMoistureBalanceData{
    data: [TimeSeriesDatapoint]
  }

  type TimeSeriesDatapoint{
    date: Date
    value: Float
  }
`


const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value) // ast value is always in string format
      }
      return null;
    },
  }),
  JSON: GraphQLJSON,
  Query: {
    soilMoistureBalance: () => ({
      data: [
        {
          date: new Date(),
          value: 2
        }
      ]
    }),
    cimis: controllers.cimisFetch,
    eto: controllers.eto,
    fields: controllers.agrianFetch("/core/fields", "fields"),
    farms: controllers.agrianFetch("/core/farms", "farms"),
    growers: controllers.agrianFetch("/core/growers", "growers"),
    plantings: controllers.agrianFetch("/core/plantings", "plantings"),
    getField: controllers.getField,
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
  context: store
})

server.listen(process.env.PORT).then(() => {
  console.log(`Listening on ${process.env.PORT}`)
})