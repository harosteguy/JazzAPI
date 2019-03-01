'use strict';

let respuestas = require('../../../apis-comun/respuestas'),
	modError = require('../../../apis-comun/error'),
	conf = require('../../../apis-comun/config'),
	BaseDatos = require('../../../apis-comun/base-datos'),
	db = new BaseDatos( conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'cms_notificaciones' ),
	webpush = require('web-push'),
	sanitizeHtml = require('sanitize-html');



module.exports = class Suscriptores {

	constructor( req, res, usr ) {
		this.req = req;
		this.res = res;
		this.usr = usr;
		// Obtiene mensajes en el idioma del header
		this.msj = require('../idiomas/' + req.idioma );
	}

	procesarPeticion( aRuta ) {
		if ( this.usr.esAdmin === 1 ) {
			if ( this.req.method == 'GET' ) {
				if ( aRuta[5] === 'totales' ) {
					this.totales();
				} else {
					this.listar();
				}
			} else {
				modError.responderError( 405, this.msj.metodoNoValido, this.res );
			}
		} else {
			modError.responderError( 403, this.msj.usrNoAutori, this.res );
		}
	}

	listar() {
		respuestas.responder( 200, { abc: "def"}, this.req.headers['accept-encoding'], this.res );
////
/*		let respuesta = {};
		db.consulta("select * from usuarios order by fecha").then( resUsr => {
			respuesta.usuarios = [];
			for ( var i = 0, tot = resUsr.length; i < tot; i++ ) {
				respuesta.usuarios.push( resUsr[i] );
			}
			respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			modError.manejarError( error, this.msj.errorRecupeDatos, this.res );
		});
*/
	}

	totales() {

////
		let consulta = `select (select count(*) from usuarios where idioma = 'es') as esp,
		(select count(*) from usuarios where idioma = 'en') as eng`;
		db.consulta( consulta ).then( resUsr => {
			let respuesta = {
				idioma: {
					es: resUsr[0].esp,
					en: resUsr[0].eng
				}
			};
			respuestas.responder( 200, respuesta, this.req.headers['accept-encoding'], this.res );
		}).catch( error => {
			modError.manejarError( error, this.msj.errorRecupeDatos, this.res );
		});

	}

}
