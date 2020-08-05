require('dotenv').config()
const { ApolloServer, gql } = require('apollo-server')
const store = require('./store')

require('./twitter')(store)

const typeDefs = gql`

  type Query{
    soilMoistureBalance: SoilMoistureBalanceData
  }

  type Grower{
    id: ID!
    name: String,
    farms: [Farm]
  }
  type Farm{
    id: ID!
    fields: [Field]
  }
  type Field{
    id: ID!
    plantings: [Planting]
  }
  type Planting{
    id: ID!
    name: String
    type: String
    variety: String
    plantingDate: Date
  }
  type Measurement{
    id: ID!
    type: String
    date: Date
    value: Number
  }

  type SoilMoistureBalanceData{
    data: [TimeSeriesDatapoint]
  }

  type TimeSeriesDatapoint{
    date: Date
    value: Number
  }
`

const resolvers = {
  Query: {
    soilMoistureBalance: () => ({})
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