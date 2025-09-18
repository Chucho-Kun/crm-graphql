const { ApolloServer } = require("apollo-server");
const typeDefs = require("./db/schemas");
const resolvers = require("./db/resolvers");
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env'})
const conectarDB = require('./config/db');
conectarDB()

// Contexto
const context = () => ({miContext: "hola desde el contexto"})
// Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        console.log(req.headers.authorization);
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token, process.env.SECRET_WORD)
                console.log({usuario});
                return {
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }

    }
})

server.listen({ port: process.env.PORT || 4000 }).then((url) => {
    console.log(`Escuchando en la url: ${url.url}`);
    
})