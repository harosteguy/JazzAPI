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
