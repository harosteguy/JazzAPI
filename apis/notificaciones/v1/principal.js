/**
 * This file is part of JazzAPI
 *
 * JazzAPI - RESTful APIs set developed in Node.js to serve and manage application contents.
 * Copyright (C) 2019 by Guillermo Harosteguy <harosteguy@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
////
			datos.ip = req.headers['x-real-ip'] || '';

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
			datos.idioma = typeof datos.idioma !== 'undefined' && conf.setIdiomas.includes( datos.idioma ) ? datos.idioma : conf.setIdiomas[0];
			datos.uid = typeof datos.uid !== 'undefined' ? datos.uid : 0;
			datos.uid = parseInt( datos.uid, 10 ) || 0;
			datos.urlPagina = typeof datos.urlPagina !== 'undefined' ? datos.urlPagina : '';
			datos.userAgent = typeof datos.userAgent !== 'undefined' ? datos.userAgent : '';
			datos.fecha = ( new Date() ).toISOString().slice( 0, 10 );	// Fecha formato mysql date
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
