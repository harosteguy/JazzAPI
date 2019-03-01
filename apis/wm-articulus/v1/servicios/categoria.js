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
	conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'cms_articulus' ),
	utiles = require('../comun/utiles'),
	respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error'),
	sanitizeHtml = require('sanitize-html');

const urlApi = '/apis/wm-articulus/v1/';

module.exports = class Categoria {

	constructor( req, res, usr ) {
		this.req = req;
		this.res = res;
		this.usr = usr;
		// Obtiene id de usuario del header
		let encoded = req.headers.authorization.split(' ')[1],
			decoded = new Buffer( encoded, 'base64').toString('utf8'),
			aAux = decoded.split(':');
		this.usr.id = parseInt( aAux[0], 10 );
		// Obtiene mensajes en el idioma del header
		this.msj = require('../idiomas/' + req.idioma );
	}

	procesarPeticion( aRuta ) {
		if ( this.usr.esAdmin === 1 ) {
			if ( this.req.method == 'GET' ) {
				if ( aRuta[7] ) {								// Nombre base de la categoría
					this.obtener( aRuta[5], aRuta[7] );
				} else {
					this.listar( aRuta[5] );					// Nombre base del blog
				}
			} else if ( this.req.method == 'POST' ) {
				this.crear( aRuta[5] );
			} else if ( this.req.method == 'PUT' ) {
				this.actualizar( aRuta[5], aRuta[7] );
			} else if ( this.req.method == 'DELETE' ) {
				this.borrar( aRuta[5], aRuta[7] );
			} else {
				modError.responderError( 405, this.msj.metodoNoValido, this.res );
			}
		} else {
			if ( this.req.method == 'GET' && !aRuta[7] ) {
				this.listar( aRuta[5] );
			} else {
				modError.responderError( 403, this.msj.usrNoAutori, this.res );
			}
		}
	}

	listar( blogBase ) {
		utiles.obtenerIdBlog( blogBase ).then( idBlog => {
			let incNumArticulos = url.parse( this.req.url, true ).query.incNumArticulos;
			let consulta = "select id, nombre, nombreBase";
			consulta += ( incNumArticulos && parseInt( incNumArticulos, 10 ) === 1 )
				? ", (select count(*) from blog_arti_cat where idCat = blog_categorias.id) as numArticulos "	// Incluye cantidad de artículos
				: " ";
			consulta += "from blog_categorias where idBlog = ? order by nombre";
			return db.consulta( consulta, [ idBlog ] );
		}).then( resCat => {
			let categorias = [];
			for ( let i = 0, tot = resCat.length; i < tot; i++ ) {
				categorias.push( resCat[i] );
			}
			respuestas.responder( 200, categorias, this.req.headers['accept-encoding'], this.res );
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	obtener( blogBase, catBase ) {
		utiles.obtenerIdBlog( blogBase ).then( idBlog => {
			let incNumArticulos = url.parse( this.req.url, true ).query.incNumArticulos;
			let consulta = "select id, nombre, nombreBase, descripcion";
			consulta += ( incNumArticulos && parseInt( incNumArticulos, 10 ) === 1 )
				? ", (select count(*) from blog_arti_cat where idCat = blog_categorias.id) as numArticulos "	// Incluye cantidad de artículos
				: " ";
			consulta += "from blog_categorias where idBlog = ? and nombreBase = ? limit 1";
			return db.consulta( consulta, [ idBlog, catBase ] );
		}).then( resCat => {
			if ( resCat.length === 1 ) respuestas.responder( 200, resCat[0], this.req.headers['accept-encoding'], this.res );
			else throw new modError.ErrorEstado( this.msj.laCatNoExiste, 404 );
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	crear( blogBase ) {
		let idBlog, oCat;
		utiles.obtenerIdBlog( blogBase ).then( id => {
			idBlog = id;
			return this.verificarDatos();
		}).then( cat => {
			cat.idBlog = idBlog;
			oCat = cat;
			return db.consulta("insert into blog_categorias set ?", cat );
		}).then( () => {
			utiles.limpiarCache();
			let urlCat = urlApi + 'blogs/' + blogBase + '/categorias/' + oCat.nombreBase;
			respuestas.responder( 200, { url: urlCat }, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			if ( error.errno == 1062 ) modError.responderError( 409, this.msj.laCatYaExiste, this.res );
			else modError.manejarError( error, this.msj.problemaCreandoCat, this.res );
		});
	}

	actualizar( blogBase, catBase ) {
		let idBlog, oCat;
		utiles.obtenerIdBlog( blogBase ).then( id => {
			idBlog = id;
			return this.verificarDatos();
		}).then( cat => {
			oCat = cat;
			return db.consulta("update blog_categorias set ? where idBlog = ? and nombreBase = ? limit 1", [ cat, idBlog, catBase ] );
		}).then( resUpdate => {
			if ( resUpdate.affectedRows === 1 ) {
				utiles.limpiarCache();
				let urlCat = urlApi + 'blogs/' + blogBase + '/categorias/' + oCat.nombreBase;
				respuestas.responder( 200, { url: urlCat }, this.req.headers['accept-encoding'], this.res );
			} else {
				throw new modError.ErrorEstado( this.msj.laCatNoExiste, 404 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.problemaActualiCat, this.res ) } );
	}

	borrar( blogBase, catBase ) {
		let idBlog, idCat;
		utiles.obtenerIdBlog( blogBase ).then( ib => {
			idBlog = ib;
			// Obtiene id de categoría antes de borrarla para después borrar la carpeta de imágenes
			return db.consulta("select id from blog_categorias where idBlog = ? and nombreBase = ? limit 1", [ idBlog, catBase ] );
		}).then( resCat => {
			if ( resCat.length != 1 ) throw new modError.ErrorEstado( this.msj.laCatNoExiste, 404 );
			idCat = resCat[0].id;
			// Elimina la categoría
			return db.consulta("delete from blog_categorias where idBlog = ? and nombreBase = ? limit 1", [ idBlog, catBase ] );
		}).then( resDelete => {
			if ( resDelete.affectedRows === 1 ) {
				utiles.limpiarCache();
				this.borrarImagenes( blogBase, idCat ).catch( error => { modError.logError( error ) });
				respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );
			} else {
				throw new modError.ErrorEstado( this.msj.laCatNoExiste, 404 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.problemaBorrandoCat, this.res ) } );
	}

	//-----

	sanear( datos ) {
		datos.nombre = datos.nombre || '';
		datos.descripcion = datos.descripcion || '';
		datos.nombre = sanitizeHtml(
			datos.nombre,
			{
				allowedTags: [],
				allowedAttributes: [],
				textFilter: texto => {
					return texto.replace( /&quot;/g, '"').replace( /&amp;/g, '&');
				}
			}
		);
		datos.nombreBase = utiles.cadena2url( datos.nombre );
		datos.descripcion = sanitizeHtml(
			datos.descripcion,
			{
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
			}
		);
		return datos;
	}

	verificarDatos() {
		return new Promise( ( resuelve, rechaza ) => {
			let datos = {};
			try { datos = JSON.parse( this.req.cuerpo ) }	// Parsea el cuerpo de la petición
			catch ( error ) {
				rechaza( new modError.ErrorEstado( this.msj.cuerpoNoJson, 400 ) ); return;
			}
			// Sanea
			datos = this.sanear( datos );
			// Verifica
			if ( datos.nombre == '' || datos.nombreBase == '' ) {
				rechaza( new modError.ErrorEstado( this.msj.errorNombreCat, 400 ) ); return;
			}
			resuelve( datos );
		});
	}

	borrarImagenes( blogBase, idCat ) {
		return new Promise( ( resuelve, rechaza ) => {
			let carpetaImagenes = conf.dirBaseImagen + blogBase + '/categorias/id' + utiles.padIzquierdo( idCat, '000000' ) + '/';
			let fs = require('fs');
			fs.readdir( carpetaImagenes, ( error, archivos ) => {
				if ( error ) {
					if ( error.code === 'ENOENT' ) resuelve( true );	// La carpeta no existe, nada que borrar
					else rechaza( error );
					return;
				}
				let contador = archivos.length;
				archivos.forEach( archivo => {
					fs.unlink( carpetaImagenes + archivo, error => {
						if ( error ) modError.logError( JSON.stringify( error ) );
						contador--;
						if ( contador === 0 ) {							// Si se eliminó la última imagen
							fs.rmdir( carpetaImagenes, error => {		// se elimina la carpeta
								if ( error ) modError.logError( JSON.stringify( error ) );
							});
							resuelve( true );
						}
					});
				});
			});
		});
	}

}
