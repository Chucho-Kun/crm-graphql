const mongoose = require("mongoose");

const ProductosSchema = mongoose.Schema({
    nombre:{
        type: String,
        required: true,
        trime: true
    },
    existencia:{
        type: Number,
        required: true,
        trime: true
    },
    precio:{
        type: Number,
        required: true,
        trim: true
    },
    creado:{
        type: Date,
        default: Date.now()
    }
})

ProductosSchema.index({ nombre: 'text' })

module.exports = mongoose.model('Producto' , ProductosSchema)