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
		if ( usuario.esAdmin === 1 ) {
			let Contenidos = require('./servicios'),
				conte = new Contenidos( req, res ),
				ruta = url.parse( req.url ).pathname,
				aRuta = ruta.split('/');

			if ( req.method == 'GET') {
				if ( !aRuta[4] ) {								// Si en la ruta de la petición no existe nada después de la versión "v1" o "v1/"
					conte.listaIds();							// Lista de todos los IDs
				} else {
					conte.obtener( aRuta[4] );					// Devuelve un contenido en ambos idiomas
				}
			} else if ( req.method == 'POST') {
				if ( !aRuta[4] ) {
					conte.crear();
				} else {
					modError.responderError( 400, msj.servicioNoValido, res );
				}
			} else if ( req.method == 'PUT') {
				if ( aRuta[4] ) {
					conte.actualizar( aRuta[4], aRuta[5] );		// El segundo parámetro es idioma para el caso de actualizar un solo contenido
				} else {
					modError.responderError( 400, msj.servicioNoValido, res );
				}
			} else if ( req.method == 'DELETE') {
				if ( aRuta[4] ) {
					conte.eliminar( aRuta[4] );
				} else {
					modError.responderError( 400, msj.servicioNoValido, res );
				}
			} else {
				modError.responderError( 405, msj.metodoNoValido, res );
			}
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
