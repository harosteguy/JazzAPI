'use strict';

let url = require('url'),
	modError = require('../../apis-comun/error');

// Función única que rutea a los servicios de la API
module.exports = ( req, res ) => {

	let msj = require('./idiomas/' + req.idioma );

	require('../../apis-comun/usr-ok')( req ).then( usuario => {
		let ruta = url.parse( req.url ).pathname,
			aRuta = ruta.split('/');

		if ( aRuta[4] === 'blogs') {
			if ( !aRuta[6]) {
				// /apis/wm-articulus/v1/blogs
				// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>
				let Blog = require('./servicios/blog'),
					blog = new Blog( req, res, usuario );
				blog.procesarPeticion( aRuta );
			} else if ( aRuta[6] === 'articulos') {
				if ( !aRuta[8]) {
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>
					let Articulos = require('./servicios/articulo'),
						articulos = new Articulos( req, res, usuario );
					articulos.procesarPeticion( aRuta );
				} else if ( aRuta[8] === 'comentarios') {
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios/<idComentario>

					// PENDIENTE

				} else if ( aRuta[8] === 'imagenes') {
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/imagenes
					let Imagenes = require('./servicios/imagen'),
						imagenes = new Imagenes( req, res, usuario );
					imagenes.procesarPeticion( aRuta );
				} else {
					// El servicio no existe
					modError.responderError( 400, msj.servicioNoValido, res );
				}
			} else if ( aRuta[6] === 'categorias') {
				if ( !aRuta[8]) {
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>
					let Categorias = require('./servicios/categoria'),
						categorias = new Categorias( req, res, usuario );
					categorias.procesarPeticion( aRuta );
				} else if ( aRuta[8] === 'imagenes') {
					// /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>/imagenes
					let Imagenes = require('./servicios/imagen'),
						imagenes = new Imagenes( req, res, usuario );
					imagenes.procesarPeticion( aRuta );
				} else {
					modError.responderError( 400, msj.servicioNoValido, res );
				}
			} else {
				modError.responderError( 400, msj.servicioNoValido, res );
			}
		} else if ( aRuta[4] === 'autores') {
			// /apis/wm-articulus/v1/autores
			let Autores = require('./servicios/autor'),
				autores = new Autores( req, res, usuario );
			autores.procesarPeticion( aRuta );
		} else {
			modError.responderError( 400, msj.servicioNoValido, res );
		}
	})
	.catch( error => {
		if ( error.estado ) {
			if ( error.estado == 403 ) {
				modError.responderError( error.estado, msj.usrNoAutori, res );
			} else {
				modError.responderError( error.estado, error.message, res );
			}
		} else {
			modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
			modError.responderError( 500, msj.errServidorVerLog, res );
		}
	});
};