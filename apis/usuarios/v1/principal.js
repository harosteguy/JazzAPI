'use strict';

let url = require('url'),
	modError = require('../../apis-comun/error');

// Función única que rutea a los servicios de la API
module.exports = ( req, res ) => {

	let msj = require('./idiomas/' + req.idioma );

	let Usuario = require('./servicios'),
		usuario = new Usuario( req, res ),
		ruta = url.parse( req.url ).pathname,
		aRuta = ruta.split('/');

	if ( req.method == 'GET') {
		if ( aRuta[4] == 'token' ) {
			usuario.token( req, res );
		} else if ( aRuta[4] == 'autorizacion' ) {
			usuario.autorizacion( req, res );
		} else {
			usuario.obtener( req, res );
		}
	} else if ( req.method == 'POST') {
		if ( aRuta[4] == 'emailClave' ) {
			usuario.emailClave( req, res );
		} else if ( aRuta[4] == 'preRegistro' ) {
			usuario.preRegistro( req, res );
		} else if ( aRuta[4] == 'imagen' ) {
			usuario.imagen( req, res );
		} else {
			usuario.registro( req, res );
		}
	} else if ( req.method == 'PUT') {
		if ( aRuta[4] == 'nuevaClave' ) {
			usuario.nuevaClave( req, res );
		} else {
			usuario.actualizar( req, res );
		}
	} else if ( req.method == 'DELETE') {
		usuario.eliminar( req, res );
	} else {
		modError.responderError( 405, msj.metodoNoValido, res );
	}

};
