'use strict';

let conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUser, conf.dbPass, 'cms_articulus' ),
	modError = require('../../../apis-comun/error');

module.exports = {
	obtenerIdBlog( blogBase ) {
		return new Promise( ( resuelve, rechaza ) => {
			db.consulta("select id from blog_blogs where nombreUrl = ? limit 1", [ blogBase ] ).then( resultado => {
				if ( resultado.length === 1 ) resuelve( resultado[0].id );
				else rechaza( new Error('Error en utiles.js obtenerIdBlog( blogBase ): El blog no existe.') );
			}).catch( error => { rechaza( error ) } );
		});
	},
	padIzquierdo: ( cadena, relleno ) => {
		return String( relleno + cadena ).slice( - relleno.length );
	}
};
