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
	modError = require('../../apis-comun/error');

// Función única que rutea a los servicios de la API

module.exports = ( req, res ) => {

	let msj = require('./idiomas/' + req.idioma );

	let ruta = url.parse( req.url ).pathname,
		aRuta = ruta.split('/');

	if ( aRuta[4] === 'blogs') {
		if ( !aRuta[5]) {
			// /apis/articulus/v1/blogs
			let Blog = require('./servicios/blogs'),
				blog = new Blog( req, res );
			blog.procesarPeticion( aRuta );
		} else if ( ['articulos', 'articulos-light', 'articulos-full'].indexOf( aRuta[6] ) !== -1 ) {
			if ( !aRuta[8]) {
				// /apis/articulus/v1/blogs/<nombreBaseBlog>/articulos
				// /apis/articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>
				let Articulos = require('./servicios/' + aRuta[6] ),
					articulos = new Articulos( req, res );
				articulos.procesarPeticion( aRuta );
			} else if ( aRuta[8] === 'comentarios') {
				// /apis/articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios
				// /apis/articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios/<idComentario>
				let Comentarios = require('./servicios/comentarios'),
					comentarios = new Comentarios( req, res );
				comentarios.procesarPeticion( aRuta );
			} else {
				// El servicio no existe
				modError.responderError( 400, msj.servicioNoValido, res );
			}
		} else if ( aRuta[6] === 'categorias') {
			// /apis/articulus/v1/blogs/<nombreBaseBlog>/categorias
			// /apis/articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>
			let Categorias = require('./servicios/categorias'),
				categorias = new Categorias( req, res );
			categorias.procesarPeticion( aRuta );
		} else {
			modError.responderError( 400, msj.servicioNoValido, res );
		}
	} else if ( aRuta[4] === 'autores') {
		// /apis/articulus/v1/autores
		let Autores = require('./servicios/autor'),
			autores = new Autores( req, res, usuario );
		autores.procesarPeticion( aRuta );
	} else {
		modError.responderError( 400, msj.servicioNoValido, res );
	}

};
