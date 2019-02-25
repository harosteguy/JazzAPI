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

module.exports = class Blog {

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
				if ( aRuta[5] ) {	// Nombre base del blog
					this.obtener( aRuta[5] );
				} else {
					// Si la petición la hace el admin, listar() devolverá todos los blogs
					// sino devolverá los blogs del autor logueado
					this.listar();
				}
			} else if ( this.req.method == 'POST' ) {
				this.crear();
			} else if ( this.req.method == 'PUT' ) {
				this.actualizar( aRuta[5] );
			} else if ( this.req.method == 'DELETE' ) {
				this.borrar( aRuta[5] );
			} else {
				modError.responderError( 405, this.msj.metodoNoValido, this.res );
			}
		} else {
			if ( this.req.method == 'GET' ) {
				this.listar();
			} else {
				modError.responderError( 403, this.msj.usrNoAutori, this.res );
			}
		}
	}

	listar() {
		let incNumArticulos = url.parse( this.req.url, true ).query.incNumArticulos;
		let parametros = [];																			// Parámetros de la consulta
		let consulta = "select id, nombre, nombreUrl";
		consulta += ( incNumArticulos && parseInt( incNumArticulos, 10 ) === 1 )
			? ", (select count(*) from blog_articulos where idBlog = blog_blogs.id) as numArticulos "	// Incluye cantidad de artículos
			: " ";
		consulta += "from blog_blogs ";
		if ( !this.usr.esAdmin ) {
			consulta += "where id in (select idBlog from blog_autor_blogs where uid = ?) ";				// Blogs del autor
			parametros.push( this.usr.id );
		} else {
			consulta += " ";																			// Todo para el admin
		}
		consulta += "order by nombre";
		db.consulta( consulta, parametros ).then( resultado => {
			let blogs = [];
			for ( let i = 0, tot = resultado.length; i < tot; i++ ) {
				blogs.push( resultado[i] );
			}
			respuestas.responder( 200, blogs, this.req.headers['accept-encoding'], this.res );
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	obtener( nombreBase ) {
		let incNumArticulos = url.parse( this.req.url, true ).query.incNumArticulos;
		let consulta = "select id, nombre, nombreUrl, descripcion";
		consulta += ( incNumArticulos && parseInt( incNumArticulos, 10 ) === 1 )
			? ", (select count(*) from blog_articulos where idBlog = blog_blogs.id) as numArticulos "	// Incluye cantidad de artículos
			: " ";
		consulta += "from blog_blogs where nombreUrl = ? limit 1";
		db.consulta( consulta, [nombreBase] ).then( resultado => {
			if ( resultado.length === 1 ) {
				respuestas.responder( 200, resultado[0], this.req.headers['accept-encoding'], this.res );
			} else {
				throw new modError.ErrorEstado( this.msj.elBlogNoExiste, 404 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
	}

	crear() {
		let datos;
		this.verificarDatos().then( dat => {		// Extrae datos del cuerpo de la petición, los sanea y verifica
			datos = dat;
			return db.consulta("insert into blog_blogs set ?", datos );
		}).then( () => {
			utiles.limpiarCache();
			respuestas.responder( 200, { url: urlApi + 'blogs/' + datos.nombreUrl }, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			if ( error.errno == 1062 ) modError.responderError( 409, this.msj.elBlogYaExiste, this.res );
			else modError.manejarError( error, this.msj.problemaCreandoBlog, this.res );
		});
	}

	actualizar( nombreUrl ) {
		let datos;
		this.verificarDatos().then( dat => {		// Extrae datos del cuerpo de la petición, los sanea y verifica
			datos = dat;
			return db.consulta("update blog_blogs set ? where nombreUrl = ? limit 1", [ datos, nombreUrl ] );
		}).then( resUpdate => {
			if ( resUpdate.affectedRows === 1 ) {
				utiles.limpiarCache();
				respuestas.responder( 200, { url: urlApi + 'blogs/' + datos.nombreUrl }, this.req.headers['accept-encoding'], this.res );
			} else {
				throw new modError.ErrorEstado( this.msj.elBlogNoExiste, 404 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.problemaActualiBlog, this.res ) } );
	}

	borrar( nombreUrl ) {
		nombreUrl = utiles.cadena2url( nombreUrl ).toLowerCase(); // Sanea
		db.consulta("delete from blog_blogs where nombreUrl = ? limit 1", [nombreUrl] ).then( resultado => {
			if ( resultado.affectedRows === 1 ) {
				utiles.limpiarCache();
				respuestas.responder( 204, {}, this.req.headers['accept-encoding'], this.res );
			} else {
				throw new modError.ErrorEstado( this.msj.elBlogNoExiste, 404 );
			}
		}).catch( error => { modError.manejarError( error, this.msj.problemaBorrandoBlog, this.res ) } );
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
		datos.nombreUrl = utiles.cadena2url( datos.nombre );
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
			try { datos = JSON.parse( this.req.cuerpo ); }
			catch ( error ) {
				rechaza( modError.ErrorEstado( this.msj.cuerpoNoJson, 400 ) );
				return;
			}
			datos = this.sanear( datos );
			if ( datos.nombre === '' || datos.nombreUrl === '' ) {
				rechaza( modError.ErrorEstado( this.msj.errorNombreBlog, 400 ) );
				return;
			}
			resuelve( datos );
		});
	}

}