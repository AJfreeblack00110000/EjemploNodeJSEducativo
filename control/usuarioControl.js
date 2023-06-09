'use strict'

const bcrypt = require('bcrypt');
var usuariosModelo = require('../modelo/usuarios');
var usuario = new usuariosModelo();
var jwt = require('../servicio/jwt');
var fs = require('fs');
var path = require('path');

function prueba(req, res) {
    res.status(200).send({
        msj: 'Probando una accion del controlador de usuarios del api REST con node y mongo',
    });
}

function registrarUsuario(req, res) {
    var params = req.body; //recibe todos los datos por Por el Metodo POST
    console.log(params);

    usuario.nombre = params.nombre;
    usuario.apellido = params.apellido;
    usuario.email = params.email;
    usuario.rol = 'ROLE_ADMIN';
    usuario.imagen = 'null';

    if (params.password) {
        bcrypt.hash(params.password, 10, function(err, hash) {
            usuario.password = hash;
            if (usuario.nombre != null && usuario.apellido != null && usuario.email != null) {
                //guardar el ususario en BD
                usuario.save((err, usuarioAlmacenado) => {
                    if (err) {
                        res.status(500).send({ mesagge: 'Error al guardar el usuario' });
                    } else {
                        if (!usuarioAlmacenado) {
                            res.status(404).send({ mesagge: 'No se ha registrado el usuario' });
                        } else {
                            //nos devuelve un objeto con los datos del ususario guardado
                            res.status(200).send([{
                                "id": usuarioAlmacenado._id,
                                "nombre": usuarioAlmacenado.nombre,
                                "apellido": usuarioAlmacenado.apellido,
                                "email": usuarioAlmacenado.email,
                                "password": usuarioAlmacenado.password
                            }]);
                            console.log(usuarioAlmacenado);
                        }
                    }
                });
            } else {
                res.status(200).send({ mesagge: 'Introduce todos los campos' });
            }
        });

    } else {
        res.status(404).send({ mesagge: 'Introduce la contraseña' });
    }

}

function accesoUsuario(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    usuariosModelo.findOne({ email: email }, (err, user) => {
        if (err) {
            res.status(500).send({ mesagge: 'Error en la peticion al servidor' });
        } else {
            if (!user) {
                res.status(404).send({ mesagge: 'El usuario no existe' });
            } else {
                bcrypt.compare(password, usuario.password, function(err, check) {
                    if (check) {
                        //devolver los datos del ususario logeado
                        console.log('coincide el password')
                        if (params.gethash) {
                            res.status(200).send({
                                token: jwt.createToken(user)
                            });
                            //devolver un token de jwt
                        } else {
                            res.status(200).send({ user: user });
                        }
                    } else {
                        res.status(404).send({ mesagge: 'El usuario no se ha identificado' });
                    }
                });
            }
        }
    });
}

function actualizarUsuario(req, res) { //PUT
    var userId = req.params.id; //GET
    var update = req.body //POST

    usuariosModelo.findByIdAndUpdate(userId, update, (err, userUpdate) => {
        if (err) {
            res.status(500).send({ message: 'Error al actualizar el usuario en el servidor' });
        } else {
            if (!userUpdate) {
                res.status(404).send({ message: 'No se ha podido encontar el usuario' });
            } else {
                res.status(200).send({ user: userUpdate });
            }
        }
    });
}

function actualizarFoto(req, res) {
    var UserId = req.params.id;
    if (req.files && req.files.image) { // Asegúrate de que req.files.image existe
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
       
        var file_name = file_split[2]; // Corrige el nombre de la variable
        var extension = file_name.split('.');
        var file_ext = extension[1];

        if (file_ext == 'png' || file_ext == 'gif' || file_ext == 'jpg') {
            usuariosModelo.findByIdAndUpdate(UserId, { imagen: file_name }, (err, user) => { // Corrige el nombre de la variable
                if (err) {
                    res.status(500).send({ message: 'Error al buscar el usuario' }); // Corrige la propiedad "mesagge" a "message"
                }
                if (!user) {
                    res.status(404).send({ message: 'Error en el id' }); // Corrige la propiedad "mesagge" a "message"
                } else {
                    res.status(200).send({
                        image: file_name,
                        user: user
                    });
                }
            })
        } else {
            res.status(400).send({ message: 'El formato no es adecuado' }); // Cambia el código de estado a 400 Bad Request
        }
    } else {
        res.status(400).send({ message: 'No se cargó el archivo' }); // Cambia el código de estado a 400 Bad Request y corrige la propiedad "mesagge" a "message"
    }
}


function getFoto(req, res) {
    var imageFile = req.params.imageFile;
    var rutaFoto = './cargas/usuario/' + imageFile;
    console.log(imageFile);
    fs.exists(rutaFoto, function(existe) {
        if (existe) {
            res.sendFile(path.resolve(rutaFoto));
        } else {
            res.status(404).send({ mesagge: 'No has cargado una imagen con ese nombre' });
        }
    })

}

function eliminarUsuario(req, res) {
    var UserId = req.params.id;

    usuariosModelo.findByIdAndRemove(UserId, (err, user) => {
        if (err) {
            res.status(500).send({ message: 'Error al eliminar el usuario' });
        } else {
            if (!user) {
                res.status(404).send({ message: 'Usuario no encontrado' });
            } else {
                res.status(200).send({ message: 'Usuario eliminado correctamente' });
            }
        }
    });

}

module.exports = {
    prueba,
    registrarUsuario,
    accesoUsuario,
    actualizarUsuario,
    actualizarFoto,
    getFoto,
    eliminarUsuario
};
