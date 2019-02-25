'use strict';

let conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUser, conf.dbPass, 'cms_articulus' ),
	mCache = require('../../../apis-comun/cache-mem'),
	respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error');

module.exports = class Blog {

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
				this.listar().then( respuesta => {
					//respuesta.cache = 0;
					respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
					mCache.cachear( idContenido, respuesta ).catch( error => {
						modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
					});
				}).catch( error => { modError.manejarError( error, this.msj.errRecupeDatos, this.res ) } );
			}
		} else {
			modError.responderError( 405, this.msj.metodoNoValido, this.res );
		}
	}

	listar() {
		return new Promise( ( resuelve, rechaza ) => {
			let consulta = "select nombre, nombreUrl, descripcion from blog_blogs order by nombre";
			db.consulta( consulta ).then( blogs => {
				let respuesta = {};
				respuesta.blogs = blogs;
				resuelve( respuesta );
			}).catch( error => { rechaza( error ) } );
		});
	}

}