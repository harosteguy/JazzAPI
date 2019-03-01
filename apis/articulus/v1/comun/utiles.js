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
