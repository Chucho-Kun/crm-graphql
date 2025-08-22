# FullStack Platform GraphQL NEXT / REACT / TypeScript

## Technologies
Next + React + Typescript + TailwindCSS + Zod + Zustand + Prisma + Cloudinary
## Developer Notes

### Basic structure of GraphQL 
### index.js
```
const { ApolloServer, gql } = require("apollo-server");

const cursos = [
    {
        titulo: 'JavaScript Moderno Guía Definitiva Construye +10 Proyectos',
        tecnologia: 'JavaScript ES6',
    },
    {
        titulo: 'React - La Guía Completa: Hooks Context Redux MERN +15 Apps',
        tecnologia: 'React',
    },
    {
        titulo: 'Node.js - Bootcamp Desarrollo Web inc. MVC y REST API’s',
        tecnologia: 'Node.js'
    },
    {
        titulo: 'ReactJS Avanzado - FullStack React GraphQL y Apollo',
        tecnologia: 'React'
    }
];

// Schema
const typeDefs = gql`

type Curso {
    titulo: String
    tecnologia: String
    }
    
type Query{
    obtenerCursos: [Curso]
    }
`;

// Resovers
const resolvers = {
    Query: {
        obtenerCursos: () => cursos
    }
}

// Servidor
const server = new ApolloServer({
    typeDefs, resolvers
})

server.listen().then((url) => {
    console.log(`Servidor corriend en ${url}`);
})
```

#### Deploying project
```
npm run dev
```
