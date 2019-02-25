'use strict';

let conf = require('../../apis-comun/config'),
	BaseDatos = require('../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUser, conf.dbPass, 'cms_notificaciones' ),
	respuestas = require('../../apis-comun/respuestas'),
	modError = require('../../apis-comun/error');

module.exports = ( req, res ) => {

	let msj = require('./idiomas/' + req.idioma );

	if ( req.method == 'POST') {
		verificarDatos().then( datos => {							// Extrae datos del cuerpo de la petición, los sanea y verifica
			datos.ip = req.headers['x-real-ip'];
			db.consulta("insert into usuarios set ?", datos ).then( () => {

// PENDIENTE usar función responder sin cabeceras para CORS ¡VERIFICAR!
				respuestas.responder( 200, {}, req.headers['accept-encoding'], res );



			}).catch( error => {
				modError.responderError( 500, msj.noPudoCrearConte, res );
			});
		}).catch( error => {

//
			modError.manejarError( error, msj.errorCreandoArticulo, res );

		});

	} else {
		modError.responderError( 405, msj.metodoNoValido, res );
	}

	function sanear( datos ) {
		return new Promise( ( resuelve, rechaza ) => {
			datos.endpoint = typeof datos.endpoint !== 'undefined' ? datos.endpoint : '';
			datos.p256dh = typeof datos.p256dh !== 'undefined' ? datos.p256dh : '';
			datos.auth = typeof datos.auth !== 'undefined' ? datos.auth : '';
			// Extras
			datos.idioma = typeof datos.idioma !== 'undefined' && datos.idioma === 'en' ? 'en' : 'es';
			datos.uid = typeof datos.uid !== 'undefined' ? datos.uid : 0;
			datos.uid = parseInt( datos.uid, 10 ) || 0;
			datos.urlPagina = typeof datos.urlPagina !== 'undefined' ? datos.urlPagina : '';
			let fecha = new Date();
			datos.fecha = fecha.getUTCFullYear() + '-' +
				('00' + (fecha.getUTCMonth()+1)).slice(-2) + '-' +
				('00' + fecha.getUTCDate()).slice(-2) + ' ' + 
				('00' + fecha.getUTCHours()).slice(-2) + ':' + 
				('00' + fecha.getUTCMinutes()).slice(-2) + ':' + 
				('00' + fecha.getUTCSeconds()).slice(-2);
			datos.enviados = 0;		// Inicia sin mensajes enviados
			// ...
			resuelve( datos );
			return;
		});
	}

	function verificarDatos() {
		return new Promise( ( resuelve, rechaza ) => {
			let datos = {};
			try { datos = JSON.parse( req.cuerpo ); }
			catch ( error ) {
				rechaza( error );
				return;
			}
			sanear( datos ).then( datosLimpios => {
				if ( datosLimpios.endpoint === '') {
					rechaza( new modError.ErrorEstado( 'Falta endpoint', 400 ) ); return;
					return;
				}
				if ( datosLimpios.p256dh === '') {
					rechaza( new modError.ErrorEstado( 'Falta p256dh', 400 ) ); return;
					return;
				}
				if ( datosLimpios.auth === '') {
					rechaza( new modError.ErrorEstado( 'Falta auth', 400 ) ); return;
					return;
				}
				//
				resuelve( datosLimpios );
				return;
			}).catch( error => {
				rechaza( error );
				return;
			});
		});
	}

};
