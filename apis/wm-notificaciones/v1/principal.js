'use strict';

let url = require('url'),
	modError = require('../../apis-comun/error');

// Función única que rutea a los servicios de la API
module.exports = ( req, res ) => {

	let msj = require('./idiomas/' + req.idioma );

	require('../../apis-comun/usr-ok')( req ).then( usuario => {
		let ruta = url.parse( req.url ).pathname,
			aRuta = ruta.split('/');

		if ( aRuta[4] === 'mensajes') {
			// /apis/wm-notificaciones/v1/mensajes
			let Mensajes = require('./servicios/mensajes'),
				mensajes = new Mensajes( req, res, usuario );
			mensajes.procesarPeticion( aRuta );
		} else if ( aRuta[4] === 'suscriptores') {
			// /apis/wm-notificaciones/v1/suscriptores
			let Suscriptores = require('./servicios/suscriptores'),
				suscriptores = new Suscriptores( req, res, usuario );
			suscriptores.procesarPeticion( aRuta );
		} else {
			modError.responderError( 400, msj.servicioNoValido, res );
		}
	})
	.catch( error => {
		if ( error.estado ) {
			if ( error.estado == 403 ) {
				modError.responderError( error.estado, msj.usrNoAutori, res );
			} else {
				modError.responderError( error.estado, error.message, res );
			}
		} else {
			modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
			modError.responderError( 500, msj.errServidorVerLog, res );
		}
	});

};
