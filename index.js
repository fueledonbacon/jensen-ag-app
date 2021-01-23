require('dotenv').config()
const { GraphQLJSON } = require('graphql-type-json')
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const bodyParser = require('body-parser')
const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const path = require('path')
const app = express()
const utilities = require('./utils')
const typeDefs = require('./type-defs')

require('./cron-jobs')

const context = require('./context')
const cors = require("cors")
app.use(cors())
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
  Query: require('./query-resolvers'),
  Mutation: require('./mutation-resolvers')
  
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

