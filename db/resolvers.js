const Usuario = require('../models/Usuarios')
const Producto = require('../models/Producto')
const Cliente = require('../models/Cliente')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env'})

const crearToken = ( usuario , secret , expiresIn ) => {    
    const { id , email , nombre , apellido } = usuario
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
        }
    },
    Mutation: {
        nuevoUsuario: async ( _, { input }) => {
            const { email , password } = input;
            //Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error('El usuario ya existe en la base de datos')
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
        nuevoCliente: async (_,{input}) => {
            const { email } = input
            // verificar si el cliente esta registrado
            const cliente = await Cliente.findOne({ email })
            if(cliente){
                throw new Error('Ese cliente ya fue asignado')
            }
            const nuevoCliente = new Cliente(input)

            //asignar al vendedor
            nuevoCliente.vendedor = "68acabb309c46afeaa2839c4"

            //guardarlo en base de datos
            try {
                const resultado = await nuevoCliente.save()
                return resultado
            } catch (error) {
                console.log(error);
            }
        }
    }

}

module.exports = resolvers;