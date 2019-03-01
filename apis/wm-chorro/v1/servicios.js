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
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'cms_contenidos' ),
	fs = require('fs'),
	zlib = require('zlib'),
	respuestas = require('../../apis-comun/respuestas'),
	modError = require('../../apis-comun/error'),
	sanitizeHtml = require('sanitize-html');

const urlApi = '/apis/wm-chorro/v1/';

module.exports = class Contenidos {

	constructor( req, res ) {
		this.req = req;
		this.res = res;
		this.msj = require('./idiomas/' + req.idioma );
	}
	
	listaIds() {
		db.consulta("select id from contenidos order by id").then( resultado => {
			let listaIds = [];
			for ( let i = 0, tot = resultado.length; i < tot; i++ ) {
				listaIds.push( resultado[i].id );
			}
			if ( listaIds.length > 0 ) {
				respuestas.responder( 200, listaIds, this.req.headers['accept-encoding'], this.res );
			} else {
				modError.responderError( 404, this.msj.noHayContenidos, this.res );
			}
		}).catch( error => { modError.responderError( error.estado, this.msj.errRecupeDatos, this.res ) });
	}

	obtener( id ) {
		db.consulta("select * from contenidos where id = ? limit 1", [id] ).then( resultado => {
			if ( resultado.length > 0 ) {
				respuestas.responder( 200, resultado[0], this.req.headers['accept-encoding'], this.res );
			} else {
				modError.responderError( 404, this.msj.elConteNoExiste, this.res );
			}
		}).catch( error => { modError.responderError( error.estado, this.msj.errRecupeDatos, this.res ) } );
	}

	crear() {
		let datos = this.verificarDatos();		// Extrae datos del cuerpo de la petición, los sanea y verifica
		if ( datos ) {
			db.consulta("insert into contenidos set ?", datos ).then( () => {
				respuestas.responder( 200, { url: urlApi + datos.id }, this.req.headers['accept-encoding'], this.res );
				global.rwCache = {};		// Purga cache
			}).catch( error => {
				if ( error.errno == 1062 ) {
					modError.responderError( 409, this.msj.conteDuplicado, this.res );
				} else {
					modError.responderError( 500, this.msj.noPudoCrearConte, this.res );
				}
			});
		}
	}

	actualizar( idOriginal, idioma ) {
		let datos;
		if ( typeof idioma !== 'undefined' && ['es','en'].indexOf( idioma ) !== -1 ) {
			// Se estaría actualizando el contnido de un solo idioma
			let aux = this.verificarDatosParcial();		// Extrae datos del cuerpo de la petición, los sanea y verifica
			datos = {};
			datos[idioma] = aux.contenido;
		} else {
			datos = this.verificarDatos();				// Extrae datos del cuerpo de la petición, los sanea y verifica
		}
		if ( datos ) {
			db.consulta("update contenidos set ? where id = ? limit 1", [ datos, idOriginal ] ).then( () => {
				respuestas.responder( 200, { url: urlApi + datos.id }, this.req.headers['accept-encoding'], this.res );
				global.rwCache = {};		// Purga cache
			}).catch( error => { modError.responderError( 500, this.msj.noPudoActualiConte, this.res ) } );
		}
	}

	eliminar( id ) {
		id = id.replace( /[^0-9a-z]/gi, '').substr( 0, 30 );	// Sanea
		db.consulta("delete from contenidos where id = ? limit 1", [id] ).then( () => {
			respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );
			global.rwCache = {};			// Purga cache
		}).catch( error => { modError.responderError( 500, this.msj.noPudoBorrarConte, this.res ) } );
	}

	// -----------------------------------------------------------------------------------------

	sanear( datos ) {
		datos.id = typeof datos.id !== 'undefined' ? datos.id : '';
		datos.id = datos.id.replace( /[^0-9a-z]/gi, '').substr( 0, 30 );	// Hasta 30 caracteres alfanuméricos
		datos.es = typeof datos.es !== 'undefined' ? datos.es : '';
		datos.en = typeof datos.en !== 'undefined' ? datos.en : '';
		let filtro = {
			allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
				'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'img'
			],
			allowedAttributes: {
				a: [ 'href', 'name', 'target' ],
				img: [ 'src', 'alt' ]
			},
			selfClosing: [ 'img', 'br', 'hr' ],
			allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
			allowedSchemesByTag: {},
			allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
			allowProtocolRelative: true,
			allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
		};
		datos.es = sanitizeHtml( datos.es, filtro );
		datos.en = sanitizeHtml( datos.en, filtro );
		return datos;
	}

	verificarDatos() {
		let datos = {};
		try { datos = JSON.parse( this.req.cuerpo ); }
		catch ( nn ) { modError.responderError( 400, this.msj.cuerpoNoJson, this.res ); return false; }
		datos = this.sanear( datos );
		if ( datos.id === '') { modError.responderError( 400, this.msj.faltaId, this.res ); return false; }
		if ( datos.es === '') { modError.responderError( 400, this.msj.faltaConteEs, this.res ); return false; }
		if ( datos.en === '') { modError.responderError( 400, this.msj.faltaConteEn, this.res ); return false; }
		return datos;
	}

	sanearParcial( datos ) {
		datos.contenido = typeof datos.contenido !== 'undefined' ? datos.contenido : '';
		let filtro = {
			allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
				'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'img'
			],
			allowedAttributes: {
				a: [ 'href', 'name', 'target' ],
				img: [ 'src', 'alt' ]
			},
			selfClosing: [ 'img', 'br', 'hr' ],
			allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
			allowedSchemesByTag: {},
			allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
			allowProtocolRelative: true,
			allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
		};
		datos.contenido = sanitizeHtml( datos.contenido, filtro );
		return datos;
	}

	verificarDatosParcial() {
		let datos = {};
		try { datos = JSON.parse( this.req.cuerpo ); }
		catch ( nn ) { modError.responderError( 400, this.msj.cuerpoNoJson, this.res ); return false; }
		datos = this.sanear( datos );
		if ( datos.contenido === '') { modError.responderError( 400, this.msj.faltaContenido, this.res ); return false; }
		return datos;
	}

}
