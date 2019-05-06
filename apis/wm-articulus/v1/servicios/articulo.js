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
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'jazz_articulus' ),
	utiles = require('../comun/utiles'),
	respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error'),
	sanitizeHtml = require('sanitize-html');

const urlApi = '/apis/wm-articulus/v1/';

module.exports = class Articulo {

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
		this.obtenerAutor( this.usr.id ).then( autor => {
			if ( ( autor && autor.activo === 1 ) || this.usr.esAdmin === 1 ) {		// Verifica que el usuario sea un autor activo de blog o admin
				if ( this.req.method == 'GET' ) {
					if ( aRuta[7] ) {								// Nombre base del artículo
						this.obtener( aRuta[5], aRuta[7] );
					} else {
						this.listar( aRuta[5] );					// Nombre base del blog
					}
				} else if ( this.req.method == 'POST' ) {
					this.crear( aRuta[5], autor );
				} else if ( this.req.method == 'PUT' ) {
					this.actualizar( aRuta[5], aRuta[7], autor );
				} else if ( this.req.method == 'DELETE' ) {
					this.borrar( aRuta[5], aRuta[7], autor );
				} else {
					throw new modError.ErrorEstado( this.msj.metodoNoValido, 405 );
				}
			} else {
				throw new modError.ErrorEstado( this.msj.usrNoAutori, 403 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.usrNoAutori, this.res ) } );
	}

	obtener( blogBase, nombreBase ) {
		let respuesta, idBlog, uidArti;
		utiles.obtenerIdBlog( blogBase ).then( id => {
			idBlog = id;
			// Obtiene artículo
			let consulta = "select id, uid, copete, titulo, tituloUrl, entradilla, texto, publicado, fechaCreado, fechaPublicado, imgPrincipal, auxTexto, auxFecha, auxEntero, auxDecimal " +
			"from blog_articulos where tituloUrl = ? and idBlog = ? limit 1";
			return db.consulta( consulta, [ nombreBase, idBlog ] );
		}).then( resArti => {
			if ( this.usr.esAdmin === 1 || resArti[0].uid == this.usr.id ) {
				if ( resArti.length == 0 ) {
					throw new modError.ErrorEstado( this.msj.elArticuloNoExiste, 404 );
				}
				uidArti = resArti[0].uid;
				respuesta = resArti[0];
				// Obtiene categorías del artículo
				let consulta = "select idCat as id, (select nombre from blog_categorias where id = idCat limit 1) as nombre from blog_arti_cat where idArti = ? order by nombre";
				return db.consulta( consulta, [ resArti[0].id ] );
			} else {
				throw new modError.ErrorEstado( this.msj.usrNoAutori, 403 );
			}
		}).then( resArtiCat => {
			respuesta.categorias = [];
			for ( let i = 0, tot = resArtiCat.length; i < tot; i++ ) {
				respuesta.categorias.push( resArtiCat[i] );
			}
			// Obtiene blogs del autor del artículo
			let consulta = "select nombre, nombreUrl from blog_blogs where id in (select idBlog from blog_autor_blogs where uid = ?) order by nombre";
			return db.consulta( consulta, [ uidArti ] );
		}).then( resListaBlog => {
			respuesta.aux = {};
			respuesta.aux.blogs = [];
			for ( let i = 0, tot = resListaBlog.length; i < tot; i++ ) {
				respuesta.aux.blogs.push( resListaBlog[i] );
			}
			// Obtiene las categorías del blog del artículo
			let consulta = "select id, nombre from blog_categorias where idBlog = ? order by nombre";
			return db.consulta( consulta, [ idBlog ] );
		}).then( resListaCat => {
			respuesta.aux.categorias = [];
			for ( let i = 0, tot = resListaCat.length; i < tot; i++ ) {
				respuesta.aux.categorias.push( resListaCat[i] );
			}
			//
			respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
			//
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	listar( blogBase ) {
		utiles.obtenerIdBlog( blogBase ).then( idBlog => {
			// Procesa parámetros de entrada para la consulta 
			let urlQuery = url.parse( this.req.url, true ).query;
			let pag = parseInt( urlQuery.pag, 10 ) || 1;
			let porPag = parseInt( urlQuery.porPag, 10 ) || conf.artisResDefecto;
			porPag = porPag <= conf.maxArtisRespuesta ? porPag : conf.maxArtisRespuesta;
			let orden = urlQuery.orden && urlQuery.orden === 'alfa' ? 'alfa' : 'crono';
			let ordenDir = urlQuery.ordenDir && urlQuery.ordenDir === 'asc' ? 'asc' : 'desc';
			let idCat = parseInt( urlQuery.idCat, 10 ) || 0;
			let desde = urlQuery.desde && utiles.esFechaHora( urlQuery.desde ) ? urlQuery.desde : '';
			let hasta = urlQuery.hasta && utiles.esFechaHora( urlQuery.hasta ) ? urlQuery.hasta : '';
			let idAutor = parseInt( urlQuery.idAutor, 10 ) || 0;
			let estado = ( urlQuery.estado && ['todos','publicados','borradores'].indexOf( urlQuery.estado ) !== -1 )
				? urlQuery.estado
				: 'todos';
			let busqueda = urlQuery.busqueda ? urlQuery.busqueda : '';
			// Crea la consulta
			let consulta = "select SQL_CALC_FOUND_ROWS id, tituloUrl, titulo, fechaPublicado, imgPrincipal, uid, " +
			"(select nombreAutor from blog_autores where uid = blog_articulos.uid limit 1) as autor, entradilla " +
			"from blog_articulos " +
			"where idBlog = ? ";
			let aParam = [ idBlog ];										// Array de parámetros para la consulta
			if ( this.usr.esAdmin === 1 ) {
				if ( idAutor > 0 ) {
					consulta += "and uid = ? ";								// Si es admin devuelve artículos del autor solicitado o todos
					aParam.push( idAutor );
				}
			} else {
				consulta += "and uid = ? ";									// Si no es admin devuelve artículos del usuario
				aParam.push( this.usr.id );
			}
			if ( idCat > 0 ) {
				consulta += "and id in (select idArti from blog_arti_cat where idCat = ?) ";
				aParam.push( idCat );
			}
			if ( desde !== '' ) {
				consulta +=  "and fechaPublicado > ? ";
				aParam.push( desde );
			}
			if ( hasta !== '' ) {
				consulta +=  "and fechaPublicado < ? ";
				aParam.push( hasta );
			}
			if ( estado === 'publicados' ) {
				consulta +=  "and publicado = 1 ";
			} else if ( estado === 'borradores' ) {
				consulta +=  "and publicado = 0 ";
			}
			if ( busqueda != '' ) {
				consulta += "and titulo like ? ";
				aParam.push('%' + busqueda + '%');
			}
			consulta += orden == 'alfa' ? "order by titulo " : "order by fechaPublicado ";
			consulta += ordenDir + " ";
			consulta += "limit " + porPag + " offset " + (( pag - 1 ) * porPag);
			// Ejecuta la consulta
			let respuesta = {};
			db.conexion().then( con => {
				con.query( consulta, aParam, ( error, resArti ) => {
					if ( error ) {
						con.release();
						modError.manejarError( error, this.msj.errRecupeDatos, this.res );
					} else {
						// Array de artículos para responder
						respuesta.articulos = [];
						for ( let i = 0, tot = resArti.length; i < tot; i++ ) {
							respuesta.articulos.push( resArti[i] );
						}
						// Calcula total de páginas
						con.query("select found_rows() as total", ( error, resArti ) => {
							if ( error ) {
								con.release();
								modError.manejarError( error, this.msj.errRecupeDatos, this.res );
							} else {
								con.release();
								respuesta.paginacion = {};
								respuesta.paginacion.articulos = resArti[0].total;
								respuesta.paginacion.paginas = Math.ceil( resArti[0].total / porPag );
								let filtros = '';
								filtros += porPag == conf.artisResDefecto ? '' : '&porPag=' + porPag;
								filtros += orden == 'crono' ? '' : '&orden=' + orden;
								filtros += ordenDir == 'desc' ? '' : '&ordenDir=' + ordenDir;
								filtros += idCat > 0 ? '&idCat=' + idCat : '';
								filtros += desde !== '' ? '&desde=' + desde : '';
								filtros += hasta !== '' ? '&hasta=' + hasta : '';
								filtros += idAutor > 0 ? '&idAutor=' + idAutor : '';
								filtros += estado !== 'todos' ? '&estado=' + estado : '';
								filtros += busqueda == '' ? '' : '&busqueda=' + busqueda;
								respuesta.paginacion.anterior = pag > 1
									? urlApi + 'blogs/' + blogBase + '/articulos?pag=' + ( pag - 1 ) + filtros
									: '';
								respuesta.paginacion.siguiente = pag < respuesta.paginacion.paginas
									? urlApi + 'blogs/' + blogBase + '/articulos?pag=' + ( pag + 1 ) + filtros
									: '';
								//
								respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
							}
						});
					}
				});
			}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	crear( blogBase, autor ) {
		let entrada;
		try { entrada = JSON.parse( this.req.cuerpo ) }
		catch ( error ) { 
			modError.responderError( 400, this.msj.cuerpoNoJson, this.res );
			return;
		}
		if ( autor && autor.activo ) {
			let tituloUrl, idsCat;
			utiles.obtenerIdBlog( blogBase ).then( idBlog => {
				if ( autor.idsBlog.indexOf( idBlog ) === -1 ) {
					throw new modError.ErrorEstado( this.msj.usrNoAutori, 403 );
				} else {
					entrada.idBlog = idBlog;
					entrada.uid = this.usr.id;
					return this.verificarDatos( entrada );
				}
			}).then( arti => {
				let valores = [ arti.idBlog, arti.uid, arti.copete, arti.titulo, arti.tituloUrl, arti.entradilla, arti.texto, arti.publicado, arti.fechaPublicado, arti.imgPrincipal, arti.auxTexto, arti.auxFecha, arti.auxEntero, arti.auxDecimal ];
				tituloUrl = arti.tituloUrl;
				idsCat = arti.idsCat;
				let consulta = "insert into blog_articulos set idBlog = ?, uid = ?, copete = ?, titulo = ?, tituloUrl = ?, entradilla = ?, texto = ?," +
				"publicado = ?, fechaCreado = now(), fechaPublicado = ?, imgPrincipal = ?, auxTexto = ?, auxFecha = ?, auxEntero = ?, auxDecimal = ?";
				return db.consulta( consulta, valores );
			}).then( res => {
				return this.guardarCategorias( idsCat, res.insertId );
			}).then( () => {
				utiles.limpiarCache();
				let urlArti = urlApi + 'blogs/' + blogBase + '/articulos/' + tituloUrl;
				respuestas.responder( 200, { url: urlArti }, this.req.headers['accept-encoding'], this.res );
			}).catch( error => {
				if ( error.errno == 1062 ) modError.responderError( 409, this.msj.elArticuloYaExiste, this.res );
				else modError.manejarError( error, this.msj.errorCreandoArticulo, this.res );
			});
		} else {
			modError.responderError( 403, this.msj.usrNoAutori, this.res );
		}
	}

	actualizar( blogBase, artiBase, autor ) {
		let entrada, idBlog, idArti, consulta, tituloUrl, idsCat;
		try { entrada = JSON.parse( this.req.cuerpo ) }
		catch ( error ) { 
			modError.responderError( 400, this.msj.cuerpoNoJson, this.res );
			return;
		}
		utiles.obtenerIdBlog( blogBase ).then( id => {
			idBlog = id;
			return db.consulta( "select id, uid from blog_articulos where tituloUrl = ? and idBlog = ? limit 1", [ artiBase, idBlog ] );	// Obtiene id de artículo
		}).then( resArti => {
			if ( resArti.length == 0 ) {
				throw new modError.ErrorEstado( this.msj.elArticuloNoExiste, 404 );
			}
			idArti = resArti[0].id;
			if ( ( autor && autor.activo === 1 && autor.uid === resArti[0].uid ) || this.usr.esAdmin === 1 ) {
				entrada.idBlog = idBlog;
				return this.verificarDatos( entrada );
			} else {
				throw new modError.ErrorEstado( this.msj.usrNoAutori, 403 );
			}
		}).then( arti => {
			let valores = [ arti.copete, arti.titulo, arti.tituloUrl, arti.entradilla, arti.texto, arti.publicado, arti.fechaPublicado, arti.imgPrincipal, arti.auxTexto, arti.auxFecha, arti.auxEntero, arti.auxDecimal, idArti ];
			tituloUrl = arti.tituloUrl;
			idsCat = arti.idsCat;
			consulta = "update blog_articulos set copete = ?, titulo = ?, tituloUrl = ?, entradilla = ?, texto = ?, publicado = ?, fechaPublicado = ?, imgPrincipal = ?, auxTexto = ?, auxFecha = ?, auxEntero = ?, auxDecimal = ? " +
			"where id = ? limit 1";
			return db.consulta( consulta, valores );
		}).then( () => {
			return this.guardarCategorias( idsCat, idArti );
		}).then( () => {
			utiles.limpiarCache();
			let urlArti = urlApi + 'blogs/' + blogBase + '/articulos/' + tituloUrl;
			respuestas.responder( 200, { url: urlArti }, this.req.headers['accept-encoding'], this.res );
		}).catch( error => { modError.manejarError( error, this.msj.errorActualiArticulo, this.res ) } );
	}

	borrar( blogBase, artiBase, autor ) {
		let idBlog, idArti;
		utiles.obtenerIdBlog( blogBase ).then( id => {
			idBlog = id;
			return db.consulta( "select id, uid from blog_articulos where tituloUrl = ? and idBlog = ? limit 1", [ artiBase, idBlog ] );	// Obtiene id de artículo
		}).then( resArti => {
			if ( resArti.length == 0 ) {
				throw new modError.ErrorEstado( this.msj.elArticuloNoExiste, 404 );
			}
			idArti = resArti[0].id;
			if ( ( autor && autor.activo === 1 && autor.uid === resArti[0].uid ) || this.usr.esAdmin === 1 ) {		// Autor del artículo o admin
				return db.consulta("delete from blog_articulos where id = ? limit 1", [ idArti ] );
			} else {
				throw new modError.ErrorEstado( this.msj.usrNoAutori, 403 );
			}
		}).then( resDelete => {
			utiles.limpiarCache();
			this.borrarImagenes( blogBase, idArti ).catch( error => { modError.logError( error ) });
			respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );
		}).catch( error => { modError.manejarError( error, this.msj.errorBorrandoArticulo, this.res ) } );
	}

	//-----

	obtenerAutor( uid ) {
		return new Promise( ( resuelve, rechaza ) => {
			let autor;
			let consulta = "select nombreAutor, activo from blog_autores where uid = ? limit 1";
			db.consulta( consulta, [ uid ] ).then( resAutor => {
				if ( autor = resAutor[0] ) {
					return db.consulta( "select idBlog from blog_autor_blogs where uid = ?", [ uid ] );		// Blogs del autor
				} else {
					resuelve( false );
				}
			}).then( blogs => {
				autor.idsBlog = [];
				blogs.forEach( blog => { autor.idsBlog.push( blog.idBlog ) });
				resuelve( autor );
			}).catch( error => { rechaza( error ) } );
		});
	}

	sanear( datos ) {
		return new Promise( ( resuelve, rechaza ) => {
			let oFiltroTexto = {	// sanitizeHtml
				allowedTags: [],
				allowedAttributes: [],
				textFilter: texto => { return texto.replace( /&quot;/g, '"').replace( /&amp;/g, '&') }
			};
			let oFiltroHtml = {
				allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
					'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
					'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'oembed', 'figure', 'img'
				],
				allowedAttributes: {
					a: [ 'href', 'name', 'target' ],
					img: [ 'src', 'alt' ],
					figure: [ 'class' ],
					div: [ 'data-oembed-url', 'style' ],
					oembed: [ 'url' ],
					iframe: [ 'src', 'style', 'frameborder', 'allow', 'allowfullscreen' ]
				},
				selfClosing: [ 'img', 'br', 'hr' ],
				allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
				allowedSchemesByTag: {},
				allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
				allowProtocolRelative: true
				//allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
			};
			datos.idBlog = parseInt( datos.idBlog, 10 ) || 0;
			datos.uid = parseInt( datos.uid, 10 ) || 0;
			datos.copete = datos.copete ? sanitizeHtml( datos.copete, oFiltroTexto ) : '';
			datos.titulo = datos.titulo ? sanitizeHtml( datos.titulo, oFiltroTexto ) : '';
			datos.tituloUrl = datos.tituloUrl ? utiles.cadena2url( datos.tituloUrl ) : utiles.cadena2url( datos.titulo );
			datos.entradilla = datos.entradilla ? sanitizeHtml( datos.entradilla, oFiltroHtml ) : '';
			datos.texto = datos.texto ? sanitizeHtml( datos.texto, oFiltroHtml ) : '';
			datos.publicado = parseInt( datos.publicado, 10 ) || 0;
			datos.publicado = datos.publicado == 1 ? 1 : 0;
			datos.fechaPublicado = datos.fechaPublicado || null;
			datos.imgPrincipal = datos.imgPrincipal ? datos.imgPrincipal : '';
			datos.auxTexto = datos.auxTexto ? sanitizeHtml( datos.auxTexto, oFiltroTexto ) : '';
			datos.auxFecha = datos.auxFecha || null;
			datos.auxEntero = parseInt( datos.auxEntero, 10 ) || 0;
			datos.auxDecimal = parseFloat( datos.auxDecimal ) || 0;
			// Sanea array de categorías
			if ( Array.isArray( datos.idsCat ) ) {
				let i = datos.idsCat.length,
					idCat;
				while ( i-- ) {
					idCat = parseInt( datos.idsCat[i], 10 ) || 0;

					if ( idCat == 0 || datos.idsCat.indexOf( idCat, datos.idsCat.indexOf( idCat ) + 1 ) !== -1 ) {	// Si es 0 o está repetido
						datos.idsCat.splice( i, 1 );																// elimina del array
					}
				}
				if ( datos.idsCat.length > 0 ) {																	// Si queda algún id en el array
					// Regenera el array datos.idsCat dejando las categorías que pertenecen al blog
					let listaIds = '(' + datos.idsCat.join() + ')',
						consulta = "select id from blog_categorias where idBlog = ? and id in " + listaIds;
					db.consulta( consulta, [ datos.idBlog ] ).then( resCat => {
						datos.idsCat = [];
						resCat.forEach( cat => {
							datos.idsCat.push( cat.id );
						});
						resuelve( datos );
					}).catch( error => { rechaza( error ) } );
				} else {
					resuelve( datos );
				}
			} else {
				datos.idsCat = [];
				resuelve( datos );
			}
		});
	}

	verificarDatos( datos ) {
		return new Promise( ( resuelve, rechaza ) => {
			this.sanear( datos ).then( sanos => {												// Primero sanea
				if ( sanos.titulo == '' ) {
					rechaza( new modError.ErrorEstado( this.msj.faltaTitulo, 400 ) ); return;
				}
				if ( sanos.fechaPublicado ) {
					if ( !utiles.esFechaHora( sanos.fechaPublicado ) ) {						// La fecha es incorrecta
						rechaza( new modError.ErrorEstado( this.msj.errorFechaPublicado, 400 ) ); return;
					}
				} else {																		// No hay fecha
					sanos.fechaPublicado = utiles.ahoraDb();									// Valor por defecto
				}
				if ( sanos.auxFecha ) {
					if ( !utiles.esFechaHora( sanos.auxFecha ) ) {
						rechaza( new modError.ErrorEstado( this.msj.errorAuxFecha, 400 ) ); return;
					}
				}
				resuelve( sanos );
			}).catch( error => { rechaza( error ) } )
		});
	}

	guardarCategorias( idsCat, idArti ) {
		return new Promise( ( resuelve, rechaza ) => {
			if ( idsCat.length > 0 ) {
				let listaIds = '(' + idsCat.join() + ')';
				// Elimina del artículo las categorías que no están en el array
				let consulta = "delete from blog_arti_cat where idArti = ? and idCat not in " + listaIds;
				db.consulta( consulta, [ idArti ] ).then( () => {
					// Agrega al artículo las categorías que le falten del array
					let artiCat = [];
					idsCat.forEach( idCat => { artiCat.push( [ idArti, idCat ] ) } );
					return db.consulta( "replace into blog_arti_cat (idArti, idCat) values ?", [ artiCat ] );
				}).then( () => {
					resuelve( true ); return;
				}).catch( error => { rechaza( error ) } );
			} else {
				// Elimina todas las categorías del artículo
				db.consulta( "delete from blog_arti_cat where idArti = ?", [ idArti ] ).then( () => {
					resuelve( true ); return;
				}).catch( error => { rechaza( error ) } );
			}
		});
	}

	borrarImagenes( blogBase, idArti ) {
		return new Promise( ( resuelve, rechaza ) => {
			let carpetaImagenes = conf.dirBaseImagen + blogBase + '/articulos/id' + utiles.padIzquierdo( idArti, '000000' ) + '/';
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
