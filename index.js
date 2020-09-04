require('dotenv').config()
const store = require('./store')
const { GraphQLJSON } = require('graphql-type-json')
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const bodyParser = require('body-parser')
const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const path = require('path')
const app = express()
const controllers = require('./controllers');
const utilities = require('./utilities')
const typeDefs = require('./typeDefs')

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
    cimis: controllers.cimisFetch,
    eto: controllers.eto,
    field: controllers.agrianFetchRecord("/core/fields", "field"),
    fields: controllers.agrianFetch("/core/fields", "fields"),
    // farms: controllers.agrianFetch("/core/farms", "farms"),
    // growers: controllers.agrianFetch("/core/growers", "growers"),
    // plantings: controllers.agrianFetch("/core/plantings", "plantings"),
    getField: controllers.getField,
    listFields: controllers.listFields,
  },
  Mutation: {
    syncFields: controllers.syncFields,
    updateField: controllers.updateField,
    createWaterEvent: controllers.createWaterEvent,
    harvestEtoValues: controllers.harvestEtoValues,
    harvestFieldEtoValues: controllers.harvestFieldEtoValues
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
  res.sendFile(path.join(__dirname, 'app', 'dist', 'index.html'))
})

app.listen(process.env.PORT,() => {
  console.log(`Listening on ${process.env.PORT}`)
})