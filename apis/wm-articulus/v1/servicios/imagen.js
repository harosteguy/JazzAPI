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

let conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'jazz_articulus' ),
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	utiles = require('../comun/utiles'),
	respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error'),
	imgsPermitidas = [ {ext: 'jpg', mime: 'image/jpeg'}, {ext: 'png', mime: 'image/png'} ];

module.exports = class Imagen {

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
		let ejecutarServicio = () => {
			if ( this.req.method == 'GET' ) this.listar( aRuta );
			else if ( this.req.method == 'POST' ) this.crear( aRuta );
			else if ( this.req.method == 'DELETE' ) this.borrar( aRuta );
			else modError.responderError( 405, this.msj.metodoNoValido, this.res );
		};
		if ( aRuta[6] === 'articulos' ) {
			// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/imagenes
			// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/imagenes/<nombreBaseImagen>
			// Verifica si el usuario es autor del artículo
			this.esAutor( aRuta[7] ).then( ok => {					// aRuta[7] = titulo base del artículo
				ok = this.usr.esAdmin === 1 ? true : ok;			// Si es admin es ok
				if ( ok ) ejecutarServicio();
				else modError.responderError( 403, this.msj.usrNoAutori, this.res );
			});
		} else if ( aRuta[6] === 'categorias' ) {
			// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>/imagenes
			// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>/imagenes/<nombreBaseImagen>
			if ( this.usr.esAdmin === 1 ) ejecutarServicio();
			else modError.responderError( 403, this.msj.usrNoAutori, this.res );
		} else {
			modError.responderError( 400, this.msj.servicioNoValido, this.res );
		}
	}

	listar( aRuta ) {
		let urlBase, carpetaImg;
		this.obtenerRutaImagen( aRuta ).then( ( carpeta, url ) => {
			urlBase = carpeta.url;
			carpetaImg = carpeta.dir;
			return new Promise( ( resuelve, rechaza ) => {
				fs.readdir( carpeta.dir, ( error, archivos ) => {
					if ( error ) rechaza( error );
					else resuelve( archivos );
				});
			});
		}).then( archivos => {
			// Filtra extensiones permitidas
			let imgOk;
			let i = archivos.length;
			while ( i-- ) {
				for ( let img of imgsPermitidas ) {
					imgOk = archivos[i].substr( -3 ) === img.ext;
					if ( imgOk ) break;
				}
				if ( !imgOk ) archivos.splice( i, 1 );
			}
			// Ordena archivos por fecha y hora
			archivos = archivos.map( archivo => {
				return {
					name: archivo,
					time: fs.statSync( carpetaImg +  archivo ).mtime.getTime()
				};
			})
			.sort( ( a, b ) => b.time - a.time )
			.map( v => v.name );
			// Agrega protocolo, dominio y ruta
			archivos.forEach( ( archivo, i, array ) => {
				array[i] = urlBase + archivo;
			});
			//
			respuestas.responder( 200, archivos, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			if ( error.code === 'ENOENT' ) respuestas.responder( 200, [], this.req.headers['accept-encoding'], this.res );	// No hay carpeta con imágenes
			else modError.manejarError( error, this.msj.errRecupeDatos, this.res );
		});
	}

	crear( aRuta ) {
		let archivo, oRuta, cuerpo, nombreArchivo, extArchivo;
		this.obtenerRutaImagen( aRuta ).then( ( ruta ) => {											// Obtiene ruta completa donde se guardará la imagen y URL
			oRuta = ruta;
			return new Promise( ( resuelve, rechaza ) => {
				mkdirp( oRuta.dir, error => {												// Crea carpetas necesarias
					if ( error ) rechaza( error );
					else resuelve( true );
				});
			});
		}).then( () => {
			try { cuerpo = JSON.parse( this.req.cuerpo ) }											// Obtiene info del archivo
			catch ( error ) { throw new modError.ErrorEstado( this.msj.cuerpoNoJson, 400 ) }
			archivo = cuerpo.archivo;
			// Verifica tipo de archivo
			// NOTA: La cadena en archivo.tipo no "garantiza" que el contenido del archivo sea del tipo
			let imgOk;
			for ( let img of imgsPermitidas ) {
				imgOk = archivo.tipo === img.mime;
				if ( imgOk ) {
					extArchivo = img.ext;
					break;
				}
			}
			if ( imgOk ) {
				let posPunto = archivo.nombre.lastIndexOf('.');
				nombreArchivo = archivo.nombre.substr( 0, posPunto );
				nombreArchivo = utiles.cadena2url( nombreArchivo );									// Obtien nombre de archivo saneado y sin extención
				if ( posPunto > 0 && nombreArchivo !== '' ) {										// Si queda algo del nombre después del saneo
					// Crea set de imágenes
					return new Promise( ( resuelve, rechaza ) => {
						this.crearSetImagenes('tmp/' + archivo.nombreTmp, oRuta.dir + nombreArchivo, extArchivo, ok => {
							if ( ok ) resuelve( true );
							else rechaza( new modError.ErrorEstado( this.msj.errorCreandoSetImg, 500 ) );
						});
					});
				} else {
					throw new modError.ErrorEstado( this.msj.errorNombreArchivo, 400 );
				}
			} else {
				throw new modError.ErrorEstado( this.msj.debeSerJpgPng, 400 );
			}
		}).then( () => {
			respuestas.responder( 200, { url: oRuta.url + nombreArchivo + '.' + extArchivo }, this.req.headers['accept-encoding'], this.res );
			// Elimina archivo temporal
			fs.unlink('tmp/' + archivo.nombreTmp, ( error ) => {
				if ( error ) modError.logError( JSON.stringify( error ) );
			});
		}).catch( error => {
			modError.manejarError( error, this.msj.errorCreandoSetImg, this.res );
			// Elimina archivo temporal
			fs.unlink('tmp/' + archivo.nombreTmp, ( error ) => {
				if ( error ) modError.logError( JSON.stringify( error ) );
			});
		});
	}

	borrar( aRuta ) {
		let oRuta,
			archivo = aRuta[9] || '';
		if ( archivo === '' ) {
			modError.responderError( 400, this.msj.errorNombreArchivo, this.res );
			return;
		}
		let nomArchivo = archivo.substr( 0, archivo.length -4 );
		let extArchivo = archivo.substr( -4 );

		this.obtenerRutaImagen( aRuta ).then( ( ruta ) => {
			oRuta = ruta;
			return new Promise( ( resuelve, rechaza ) => {
				fs.readdir( oRuta.dir, ( error, archivos ) => {
					if ( error ) rechaza( error );
					else resuelve( archivos );
				});
			});
		}).then( archivos => {
			// Elimina los archivos cuyo nombre empiece con nomArchivo y tengan misma extensión que extArchivo
			archivos.filter( nombre => nomArchivo === nombre.substr( 0, nomArchivo.length ) && extArchivo === nombre.substr( -4 ) )
			.forEach( archivo => {
				fs.unlink( oRuta.dir + archivo, error => {
					if ( error ) modError.logError( JSON.stringify( error ) );
				});
			});
			respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			if ( error.code === 'ENOENT' ) {													// Si la carpeta no existe
				respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );	// se dan por borrados los archivos
			} else {
				modError.manejarError( error, this.msj.errorBorrandoSetImg, this.res )
			}
		});
	}

	//-----

	esAutor( artiTitBase ) {
		return new Promise( ( resuelve, rechaza ) => {
			// Obtiene uid del autor del artículos si está activo
			let consulta = `select art.uid from blog_articulos as art, blog_autores as aut
			where art.uid = aut.uid and art.tituloUrl = ? and aut.activo = 1 limit 1`;
			db.consulta( consulta, [ artiTitBase ] )
			.then( resultado => { resuelve( resultado.length === 1 && this.usr.id === resultado[0].uid ) } )	// El usuario es autor del artículo
			.catch( error => { resuelve( false ) } );
		});
	}

	obtenerRutaImagen( aRuta ) {
		// Obtiene de forma segura la ruta a las imágenes
		return new Promise( ( resuelve, rechaza ) => {
			// Verifica existencia del blog
			let consulta = "select id from blog_blogs where nombreUrl = ? limit 1";
			db.consulta( consulta, [ aRuta[5] ] )
			.then( resBlog => {
				if ( resBlog.length === 1 ) {
					// aRuta[5] es el nombreUrl de un blog existente
					// Obtiene id de artículo o categoría
					if ( aRuta[6] === 'articulos' ) {
						let consulta = "select id from blog_articulos where tituloUrl = ? and idBlog = ? limit 1";
						return db.consulta( consulta, [ aRuta[7], resBlog[0].id ] );
					} else if ( aRuta[6] === 'categorias' ) {
						let consulta = "select id from blog_categorias where nombreBase = ? and idBlog = ? limit 1";
						return db.consulta( consulta, [ aRuta[7], resBlog[0].id ] );
					} else {
						rechaza( new modError.ErrorEstado( this.msj.errorFormatoPeticion, 400 ) );
						return;
					}
				} else {
					rechaza( new modError.ErrorEstado( this.msj.noExisteBlogParaImg, 404 ) );
					return;
				}
			}).then( resIdItem => {
				if ( resIdItem.length === 1 ) {
					let idItem = utiles.padIzquierdo( resIdItem[0].id, '000000' );
					let ruta = aRuta[5] + '/' + aRuta[6] + '/id' + idItem + '/';
					resuelve( { dir: conf.dirBaseImagen + ruta, url: conf.urlBaseImagen + ruta } );
				} else {
					rechaza( new modError.ErrorEstado( this.msj.elArtiOCatNoExiste, 404 ) );
					return;
				}
			}).catch( error => {
				rechaza( new modError.ErrorEstado( this.msj.errRecupeDatos, 500 ) );
				return;
			});
		});
	}

	crearSetImagenes( origen, destino, extension, callback ) {
		let banderaError = false, contador = conf.setDeImagenes.length;
		let imagenRedim = ( archivo, archivoNuevo, anchoNuevo, altoNuevo ) => {
			const { exec } = require('child_process');
			const cl = `convert -background none ${archivo} -resize ${anchoNuevo}x${altoNuevo}^ -gravity center -extent ${anchoNuevo}x${altoNuevo} ${archivoNuevo}`;
			return new Promise( ( resuelve, rechaza ) => {
				exec( cl, ( error, stdout, stderr ) => {
					if ( error ) {
						modError.logError( JSON.stringify( error ) );
						return resuelve( false );
					}
					return resuelve( true );
				});
			});
		}
		conf.setDeImagenes.forEach( infoImg => {
			imagenRedim( origen, destino + infoImg.sufijo + '.' + extension, infoImg.ancho, infoImg.alto )	// Crea imagen nueva
			.then( ok => {
				banderaError = !ok ? true : banderaError;
				contador--;
				if ( contador === 0 ) {											// Ya se creó la última imagen
					if ( banderaError ) {
						if (typeof callback == 'function') callback( false );
					} else {
						if (typeof callback == 'function') callback( true );
					}
				}
			});
		});
	}

}
