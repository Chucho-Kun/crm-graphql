# FullStack Server GraphQL Javascript 100% 
## Server
## Technologies
Node + Javascript + ApolloServer + Mongoose + Dotenv + Bcrypt + JsonWebToken
## Developer Notes

### Basic structure of GraphQL 
### db/schemas.js
```
const { gql } = require("apollo-server");

// Schema 
const typeDefs = gql`
  
    type Usuario{
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }

    type Token {
        token: String
    }

    type Producto{
        id: ID
        nombre: String
        existencia: Int
        precio: Float
        creado: String
    }

    type Cliente{
        id: ID
        nombre: String
        apellido: String
        empresa: String
        email: String
        telefono: String
        vendedor: ID
    }

    type Pedido{
        id: ID
        pedido: [PedidoGrupo]
        total: Float
        cliente: ID
        vendedor: ID
        fecha: String
        estado: EstadoPedido
    }

    type PedidoGrupo{
        id: ID
        cantidad: Int
    }

    type TopCliente{
        total: Float
        cliente: [Cliente]
    }

    type TopVendedor{
        total: Float
        vendedor: [Usuario]
    }

    input UsuarioInput {
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }

    input AutenticarInput {
        email: String!
        password: String!
    }

    input ProductoInput{
        nombre: String!
        existencia: Int!
        precio: Float!
    }

    input ClienteInput{
        nombre: String!
        apellido: String!
        empresa: String!
        email: String!
        telefono: String
    }

    input PedidoProductoInput{
        id: ID
        cantidad: Int
    }

    input PedidoInput{
        pedido: [PedidoProductoInput]
        total: Float
        cliente: ID
        estado: EstadoPedido
    }

    enum EstadoPedido{
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query  {
        # Usuarios
        obtenerUsuario( token : String!): Usuario

        # Productos
        obtenerProductos: [Producto]
        obtenerProducto(id: ID): Producto 

        #Clientes
        obtenerClientes: [Cliente]
        obtenerClientesVendedor: [Cliente]
        obtenerCliente( id: ID! ): Cliente

        # Pedidos
        obtenerPedidos: [Pedido]
        obtenerPedidosVendedor: [Pedido]
        obtenerPedido(id: ID!) : Pedido
        obtenerPedidosEstado(estado: String!) : [Pedido]

        # Busquedas Avanzadas
        mejoresClientes: [TopCliente]
        mejoresVendedores: [TopVendedor]
        buscarProducto( texto: String! ): [Producto]
    }  
    
    type Mutation {
        # Usuarios
        nuevoUsuario( input: UsuarioInput): Usuario
        autenticarUsuario( input : AutenticarInput ) : Token

        # Productos
        nuevoProducto( input: ProductoInput ) : Producto
        actualizaProducto( id: ID , input: ProductoInput ) : Producto
        eliminarProducto(id: ID!) : String

        # Clientes
        nuevoCliente(input: ClienteInput) : Cliente
        actualizarCliente(id: ID! , input: ClienteInput): Cliente
        eliminarCliente(id: ID!) : String

        # Pedidos
        nuevoPedido(input: PedidoInput): Pedido
        actualizarPedido( id: ID! , input: PedidoInput ): Pedido
        eliminarPedido(id: ID!) : String
    }
`;
module.exports = typeDefs
```
### db/resolver.js
```
const Usuario = require('../models/Usuarios')
const Producto = require('../models/Producto')
const Cliente = require('../models/Cliente')
const Pedido = require('../models/Pedido')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env'})

const crearToken = ( usuario , secret , expiresIn ) => {    
    const { id } = usuario
    return jwt.sign( { id } , secret , {expiresIn} )
}

const resolvers = {
    Query:{
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify( token , process.env.SECRET_WORD )
            return usuarioId
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos
            } catch (error) {
                console.log(error);
                
            }
        },
        obtenerProducto: async(_, { id }) => {
            // revisar si el producto existe
            const producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
            return producto
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({})
                return clientes
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async ( _, {}, ctx ) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() })
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async ( _, { id } , ctx) => {
            // revisar si el cliente existe
            const cliente = await Cliente.findById(id);
            if(!cliente){
                throw new Error('No se encontró al cliente')
            }
            //solo quien lo creó puede verlo
            if( cliente.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales')
            }
            return cliente
        },
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
                
            }
        },
        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id})
                return pedidos
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido: async ( _, { id } , ctx ) => {
            // verificar si existe el pedido
            const pedido = await Pedido.findById(id)
            if(!pedido){
                throw new Error('Pedido no encontrado')
            }
            // Autorizacion de quien puede verlo
            if( pedido.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales')
            }
            // retornar resultado
            return pedido;
        },
        obtenerPedidosEstado: async ( _, { estado }, ctx ) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id , estado });
            return pedidos;
        },
        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match : { estado : "COMPLETADO" }},
                { $group : {
                    _id: "$cliente",
                    total: { $sum: '$total' }
                }},
                {
                    $lookup:{
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },{
                    $sort: { total : -1 }
                }
            ]);

            return clientes;
        },
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO" }},
                { $group: {
                    _id: "$vendedor",
                    total: { $sum : '$total'}
                } },
                {
                    $lookup:{
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 5
                },{
                    $sort: { total: -1 }
                }
            ]);

            return vendedores;
        },
        buscarProducto: async ( _, { texto }) => {
            const productos = await Producto.find({ $text: { $search: texto } }).limit(10)
            return productos;
        }
    },
    Mutation: {
        nuevoUsuario: async ( _, { input }) => {
            const { email , password } = input;
            //Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error( `El correo ${ email } ya fue usado por otro usuario`)
            }
            //Hashear password
            const salt = bcryptjs.genSaltSync(10);
            input.password = bcryptjs.hashSync( password , salt )

            //Guardarlo en la BD
            try {
                const usuario = new Usuario(input)
                usuario.save();
                return usuario
            } catch (error) {
                console.log(error);
                
            }
        },
        autenticarUsuario: async (_, {input}) => {
            const { email , password } = input 
            // Revisar si ya existe el usuario
            const existeUsuario = await Usuario.findOne({email})
            if(!existeUsuario){
                throw new Error('El usuario no existe')
            }
            // Revisar password
            const passworCompare = bcryptjs.compareSync( password , existeUsuario.password )
            if(!passworCompare){
                throw new Error('El password es incorrecto')
            }
            // Crear el token
            return{
                token: crearToken(existeUsuario, process.env.SECRET_WORD , '24h' )
            }
        },
        nuevoProducto: async (_, {input}) => {
            try {
                    const producto = new Producto( input )

                    // guardar en db
                    const resultado = await producto.save();
                    return resultado
            } catch (error) {
                console.log(error);
                
            }
        },
        actualizaProducto: async (_,{ id, input }) => {
            // revisar si ya existe
            let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
            // guardar en base de datos
            producto = await Producto.findOneAndUpdate({ _id: id} , input, { new: true })

            return producto;
        },
        eliminarProducto: async(_, { id }) => {
            // revisar si el producto existe
            let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
            //Eliminar
            await Producto.findOneAndDelete({_id: id});
            return "Producto Eliminado"
        },
        nuevoCliente: async ( _, {input} , ctx) => {
            
            const { email } = input
            // verificar si el cliente esta registrado
            const cliente = await Cliente.findOne({ email })
            if(cliente){
                throw new Error('Ese cliente ya fue asignado')
            }
            const nuevoCliente = new Cliente(input)

            //asignar al vendedor
            nuevoCliente.vendedor = ctx.usuario.id

            //guardarlo en base de datos
            try {
                const resultado = await nuevoCliente.save()
                return resultado
            } catch (error) {
                console.log(error);
            }
        },
        actualizarCliente: async ( _, { id , input } , ctx ) => {
            //verificar si existe
            let cliente = await Cliente.findById(id)
            if(!cliente){
                throw new Error('Ese cliente no existe')
            }
            //verificar que vendedor puede editar
            if( cliente.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales')
            }
            // guardar cambios
            cliente = await Cliente.findOneAndUpdate({ _id : id } , input, { new: true})
            return cliente
        },
        eliminarCliente: async ( _, {id} , ctx) => {
            // verificar si existe
            let cliente = await Cliente.findById(id);
            if(!cliente){
                throw new Error('No se encontró al cliente')
            }
            //verificar quien trata de eliminarlo
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('Error en las credenciales');
            }
            //eliminar cliente
            await Cliente.findOneAndDelete( {_id: id} )
            return "Cliente borrado exitosamente"
        },
        nuevoPedido: async (_, {input} , ctx) => {
            const { cliente } = input
            // verificar si el cliente existe
            let clienteExiste = await Cliente.findById(cliente);
            // verificar si el cliente es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales');
            }
            // Revisar que exista stock disponible
            for await (const articulo of input.pedido ){
                const { id } = articulo
                const producto = await Producto.findById(id);
                if(articulo.cantidad > producto.existencia){
                    throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
                }else{
                    // Restar al stock disponible
                    producto.existencia = producto.existencia - articulo.cantidad
                    await producto.save()
                }
            }
            // Crear nuevo pedido
            const nuevoPedido = new Pedido(input)
            // Asignarle vendedor
            nuevoPedido.vendedor = ctx.usuario.id
            // Guardar en base de datos
            const resultado = await nuevoPedido.save()
            return resultado
        },
        actualizarPedido: async ( _,{ id , input }, ctx ) => {
            const { cliente } = input
            // pedido existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido){
                throw new Error('El pedido no existe')
            }
            // cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if( !existeCliente ){
                throw new Error('El cliente no existe')
            }
            // cliente y pedido pertenecen al vendedor
            if( existeCliente.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales')
            }
            // revisar stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El artículo ${producto.nombre} excede la cantidad disponible`)
                    } else {
                        // restar cantidad disponible
                        producto.existencia = producto.existencia - articulo.cantidad
                        await producto.save()
                    }
                }
            }
            // Guardar pedido
            const resultado = await Pedido.findOneAndUpdate({ _id: id }, input , { new: true })
            return resultado;
        },
        eliminarPedido: async (_,{ id }, ctx) => {
            const pedido = await Pedido.findById(id);
            if(!pedido){
                throw new Error('El pedido no existe')
            }

            if( pedido.vendedor.toString() !== ctx.usuario.id ){
                throw new Error('Error en las credenciales')
            }

            //eliminar
            await Pedido.findOneAndDelete({_id: id});
            return "Pedido eliminado";
        }
    }

}

module.exports = resolvers; 
```

#### Run project in local
```
npm run dev
```
