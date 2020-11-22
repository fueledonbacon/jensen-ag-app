require('dotenv').config()
const { GraphQLJSON } = require('graphql-type-json')
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const bodyParser = require('body-parser')
const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const path = require('path')
const cron = require('node-cron')
const app = express()
const resolvers = require('./resolvers');
const utilities = require('./utils')
const typeDefs = require('./typeDefs')

const context = require('./context')

app.use(bodyParser.json())
app.use('/', express.static(path.join(__dirname, 'app/dist')))


const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value).toISOString(); // value from the client
    },
    serialize(value) {
      return utilities.justDate(new Date(value))
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value).toISOString() // ast value is always in string format
      }
      return null;
    },
  }),
  JSON: GraphQLJSON,
  Query: {
    cimis: resolvers.cimisFetch,
    eto: resolvers.eto,
    field: resolvers.agrianFetchRecord("/core/fields", "field"),
    fields: resolvers.agrianFetch("/core/fields", "fields"),
    // farms: resolvers.agrianFetch("/core/farms", "farms"),
    // growers: resolvers.agrianFetch("/core/growers", "growers"),
    // plantings: resolvers.agrianFetch("/core/plantings", "plantings"),
    getField: resolvers.getField,
    listFields: resolvers.listFields,
  },
  Mutation: {
    syncFields: resolvers.syncFields,
    updateField: resolvers.updateField,
    createWaterEvent: resolvers.createWaterEvent,
    deleteWaterEvent: resolvers.deleteWaterEvent,
    createWaterEvents: resolvers.createWaterEvents,
    harvestEtoValues: resolvers.harvestEtoValues,
    harvestFieldEtoValues: resolvers.harvestFieldEtoValues,
    updateFieldEtoValues: resolvers.updateFieldEtoValues,
    updateAllEtoValues: resolvers.updateAllEtoValues
  }
}

const schema = new ApolloServer({
  typeDefs,
  resolvers,
  playground: {
    endpoint: '/graphql'
  },
  context
})

schema.applyMiddleware({ app })

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'dist', 'index.html'))
})

app.listen(process.env.PORT,() => {
  console.log(`Listening on ${process.env.PORT}`)
})

cron.schedule('0 3 * * * ', resolvers.updateAllEtoValues)