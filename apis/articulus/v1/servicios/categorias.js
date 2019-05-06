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

var conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUser, conf.dbPass, 'jazz_articulus' ),
	mCache = require('../../../apis-comun/cache-mem'),
	utiles = require('../comun/utiles'),
	respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error');

module.exports = class Categoria {

	constructor( req, res ) {
		this.req = req;
		this.res = res;
		// Obtiene mensajes en el idioma del header
		this.msj = require('../idiomas/' + req.idioma );
	}

	procesarPeticion( aRuta ) {
		if ( this.req.method == 'GET' ) {
			// Busca respuesta de la petición en cache
			let idContenido = require('crypto').createHash('md5').update( this.req.url ).digest('hex');				// md5 de la URL para identificar cntenido en cache
			let contenido = mCache.obtener( idContenido );
			if ( contenido.disponible ) {
				// Responde petición desde cache
				//contenido.datos.cache = 1;
				respuestas.responder( 200, contenido.datos, this.req.headers['accept-encoding'], this.res );
			} else {
				// Responde petición desde base de datos
				if ( aRuta[7] ) {																					// aRuta[7] Nombre base de la categoría
					this.obtener( aRuta[5], aRuta[7] ).then( respuesta => {											// aRuta[5] Nombre base del blog
						//respuesta.cache = 0;
						respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
						mCache.cachear( idContenido, respuesta ).catch( error => {									// Cachea la respuesta
							modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
						});
					}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
				} else {
					this.listar( aRuta[5] ).then( respuesta => {
						//respuesta.cache = 0;
						respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
						mCache.cachear( idContenido, respuesta ).catch( error => {
							modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
						});
					}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
				}
			}
		} else {
			modError.responderError( 405, this.msj.metodoNoValido, this.res );
		}
	}

	obtener( blogBase, nombreBase ) {
		return new Promise( ( resuelve, rechaza ) => {
			utiles.obtenerIdBlog( blogBase ).then( idBlog => {
				let consulta = "select id, nombre, nombreBase, descripcion, imgPrincipal, " +
				"(select count(*) from blog_arti_cat where idCat = blog_categorias.id " +
				"and idArti = (select id from blog_articulos where id = idArti and publicado = 1 limit 1)) as numArticulos " +
				"from blog_categorias where idBlog = ? and nombreBase = ? limit 1";
				return db.consulta( consulta, [ idBlog, nombreBase ] );
			}).then( cat => {
				if ( cat.length == 0 ) {
					throw new modError.ErrorEstado( this.msj.laCatNoExiste, 404 );
				}
				resuelve( cat[0] );
			}).catch( error => { rechaza( error ) } );
		});
	}

	listar( blogBase ) {
		return new Promise( ( resuelve, rechaza ) => {
			utiles.obtenerIdBlog( blogBase ).then( idBlog => {
				let consulta = "select id, nombre, nombreBase, descripcion, imgPrincipal, " +
				"(select count(*) from blog_arti_cat where idCat = blog_categorias.id " +
				"and idArti = (select id from blog_articulos where id = idArti and publicado = 1 limit 1)) as numArticulos " +
				"from blog_categorias where idBlog = ? order by nombre";
				return db.consulta( consulta, [ idBlog ] );
			}).then( categorias => {
				let respuesta = {};
				respuesta.categorias = categorias;
				resuelve( respuesta );
			}).catch( error => { rechaza( error ) } );
		});
	}

}