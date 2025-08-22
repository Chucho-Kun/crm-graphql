const { ApolloServer } = require("apollo-server");
const typeDefs = require("./db/schemas");
const resolvers = require("./db/resolvers");

// Contexto
const context = () => ({miContext: "hola desde el contexto"})
// Servidor
const server = new ApolloServer({
    typeDefs, resolvers , context    
})

server.listen().then((url) => {
    console.log(`Servidor corriendo en ${url.url}`);
})