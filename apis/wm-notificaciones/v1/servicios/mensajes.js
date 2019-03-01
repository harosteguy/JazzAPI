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

let respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error'),
	conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'cms_notificaciones' ),
	webpush = require('web-push'),
	sanitizeHtml = require('sanitize-html');

module.exports = class Mensajes {

	constructor( req, res, usr ) {
		this.req = req;
		this.res = res;
		this.usr = usr;
		// Obtiene mensajes en el idioma del header
		this.msj = require('../idiomas/' + req.idioma );
	}

	procesarPeticion( aRuta ) {
		if ( this.usr.esAdmin === 1 ) {
			if ( this.req.method == 'POST' ) {
				this.enviar().then( () => {
					respuestas.responder( 200, { ok: true }, this.req.headers['accept-encoding'], this.res );
				}).catch( error => {
					modError.manejarError( error, 'Error enviando mensaje', this.res );
				});
			} else {
				modError.responderError( 405, this.msj.metodoNoValido, this.res );
			}
		} else {
			modError.responderError( 403, this.msj.usrNoAutori, this.res );
		}
	}

	enviar() {
		return new Promise( ( resuelve, rechaza ) => {
			let entrada, noti;
			try { entrada = JSON.parse( this.req.cuerpo ) }
			catch ( error ) { 
				rechaza( new Error( this.msj.cuerpoNoJson ) );
				return;
			}
			this.verificarDatos( entrada ).then( notificacion => {
				noti = notificacion;
				return db.consulta("select endpoint, p256dh, auth, idioma from usuarios where idioma = ?", [noti.filtros.idioma] );
			}).then( suscris => {
				delete noti.filtros;
				webpush.setGCMAPIKey( conf.gcmApiKey );
				webpush.setVapidDetails('mailto:reflejowebvallarta@gmail.com', conf.vapidPublicKey, conf.vapidPrivateKey );
				let cadenaPromesas = Promise.resolve();
				for ( let i = 0; i < suscris.length; i++ ) {
					const suscri = suscris[i];
					cadenaPromesas = cadenaPromesas.then( () => {	// Agrega promesa de envío a la cadena
						const suscriPush = {
							endpoint: suscris[i].endpoint,
							keys: {
								p256dh: suscris[i].p256dh,
								auth: suscris[i].auth
							}
						};
						return this.enviarMensaje( suscriPush, noti );	// Promesa de envío
					});
				}
				return cadenaPromesas;
			}).then( () => {
				resuelve( true );
				return;
			}).catch( error => {
				rechaza( error );
				return;
			});
		});
	}

	enviarMensaje( suscriPush, notificacion ) {
		return webpush.sendNotification( suscriPush, JSON.stringify( notificacion ) )
		.catch( error => {
			if ( typeof error.statusCode !== 'undefined' && ( error.statusCode == 404 || error.statusCode === 410 ) ) {
				return db.consulta("delete from usuarios where endpoint = ? limit 1", [suscriPush.endpoint] );
			} else {
				modError.logError(`Error enviando notificación push: ${JSON.stringify(error)}`);
			}
		});
	}

	sanear( datos ) {
		return new Promise( ( resuelve, rechaza ) => {
			let filtroSaneo = {	// sanitizeHtml
				allowedTags: [],
				allowedAttributes: []
			};
			datos.titulo = datos.titulo ? sanitizeHtml( datos.titulo, filtroSaneo ) : '';
			datos.mensaje = datos.mensaje ? sanitizeHtml( datos.mensaje, filtroSaneo ) : '';
			datos.url = datos.url ? sanitizeHtml( datos.url, filtroSaneo ) : '';
			datos.icono = datos.icono ? sanitizeHtml( datos.icono, filtroSaneo ) : '';
			datos.etiqueta = datos.etiqueta ? sanitizeHtml( datos.etiqueta, filtroSaneo ) : '';
			datos.filtros = datos.filtros || {};
			let filtros = Object.keys( datos.filtros );
			filtros.forEach( ( filtro, i ) => {
				datos.filtros[filtro] = sanitizeHtml( datos.filtros[filtro], filtroSaneo );
			});
			datos.filtros.idioma = datos.filtros.idioma && datos.filtros.idioma === 'en' ? 'en' : 'es';	// Idioma obligatorio
			//
			resuelve( datos );
		});
	}

	verificarDatos( datos ) {
		return new Promise( ( resuelve, rechaza ) => {
			this.sanear( datos ).then( sanos => {
				if ( sanos.titulo == '' ) {
					rechaza( new modError.ErrorEstado( this.msj.faltaTitulo, 400 ) ); return;
				}
				if ( sanos.mensaje == '' ) {
					rechaza( new modError.ErrorEstado( this.msj.faltaMensaje, 400 ) ); return;
				}
				resuelve( sanos );
			}).catch( error => { rechaza( error ) } )
		});
	}
}
