const Usuario = require('../models/Usuarios')

const resolvers = {
    Query:{
       obtenerCurso: () => "Algo"
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

            //Guardarlo en la BD
            try {
                const usuario = new Usuario(input)
                usuario.save();
                return usuario
            } catch (error) {
                console.log(error);
                
            }
        }
    }

}

module.exports = resolvers;