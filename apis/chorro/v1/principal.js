'use strict';

let conf = require('../../apis-comun/config'),
	BaseDatos = require('../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUser, conf.dbPass, 'cms_contenidos' ),
	crypto = require('crypto'),
	respuestas = require('../../apis-comun/respuestas'),
	modError = require('../../apis-comun/error'),
	mCache = require('../../apis-comun/cache-mem');

let leerContenidosDb = ( chorro, idioma ) => {
	return new Promise( ( resuelve, rechaza ) => {
		let valores = chorro.split(',');
		let consulta = "select id, " + idioma + " as textoHtml from contenidos where id in (" + '?,'.repeat( valores.length ).slice( 0, -1 ) + ")";
		db.consulta( consulta, valores ).then( resultado => {
			let contenidos = {};
			for ( let i = 0, tot = resultado.length; i < tot; i++ ) {							// Convierte el array resultado en el objeto contenidos
				let contenido = resultado.pop();
				contenidos[contenido.id] = contenido.textoHtml;
			}
			resuelve( contenidos );
		}).catch( error => { rechaza( error ) } );
	});
};

module.exports = ( req, res ) => {
	let chorro;
	if ( req.method == 'GET') {
		chorro = require('url').parse( req.url, true ).query.chorro;
	} else if ( req.method == 'POST') {
		chorro = JSON.parse( req.cuerpo ).chorro;
	} else {
		modError.responderError( 405, 'El método no es válido', res );
		return;
	}
	if ( !chorro ) {
		modError.responderError( 400, 'No se recibió el parámetro esperado', res );
		return;
	}
	let idioma = conf.setIdiomas.includes( req.headers['accept-language'] ) ? req.headers['accept-language'] : conf.setIdiomas[0];
	let idContenido = crypto.createHash('md5').update( idioma + chorro ).digest('hex');
	let contenido = mCache.obtener( idContenido );
	if ( contenido.disponible ) {
		//contenido.datos.cache = 1;
		respuestas.responder( 200, contenido.datos, req.headers['accept-encoding'], res );			// Responde la petición desde cache
	} else {
		leerContenidosDb( chorro, idioma ).then( contenidos => {									// Lee base de datos,
			//contenidos.cache = 0;
			respuestas.responder( 200, contenidos, req.headers['accept-encoding'], res );			// responde y
			mCache.cachear( idContenido, contenidos ).catch( error => {								// cachea
				modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
			});
		}).catch( error => { modError.manejarError( error, 'Error recuperando datos', res ) } );
	}
};