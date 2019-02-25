let conf = require('../../../apis-comun/config'),
	mysql = require('mysql'),
	rimraf = require('rimraf'),
	utiles = require('../comun/utiles'),
	mkdirp = require('mkdirp'),
	jsdom = require("jsdom"),
	{ JSDOM } = jsdom,
	fs = require('fs'),
	pool = mysql.createPool({
		connectionLimit : 100,
		host: conf.dbHost,
		user: conf.dbUserWm,
		password: conf.dbPassWm,
		database: 'cms_articulus',
		dateStrings: true
	});


// ------------------------------------------------------------------------------------------------------------------
// Opciones de contenidos

let opciones = {
	totArtis: 12,
	uid: 1,
	seccion: {
		nombre: 'Sección Demo',
		nombreUrl: 'seccion-demo',
		descripcion: 'Descripción de la sección Demo.'
	},
	categorias: [
		{
			nombre: 'Categoría Uno',
			nombreBase: 'categoria-uno',
			descripcion: 'Una descripción de la categoría Uno'
		},
		{
			nombre: 'Categoría Dos',
			nombreBase: 'categoria-dos',
			descripcion: 'Una descripción de la categoría Dos'
		},
		{
			nombre: 'Categoría Tres',
			nombreBase: 'categoria-tres',
			descripcion: 'Una descripción de la categoría Tres'
		}
	]
}

// ------------------------------------------------------------------------------------------------------------------
// Hacer todo

console.log(`Eliminando datos anteriores.`);
limpiar()
.then( () => {
	console.log(`Creando sección "${opciones.seccion.nombre}".`);
	return consultaMySql("insert into blog_blogs set nombre = ?, nombreUrl = ?, descripcion = ?", [ opciones.seccion.nombre, opciones.seccion.nombreUrl, opciones.seccion.descripcion ] );
})
.then( res => {
	console.log(`Creando ${opciones.totArtis} artículos.`);
	return crearArticulos( opciones.totArtis, res.insertId, opciones.uid );
})
.then( idSeccion => {
	console.log(`Creando ${opciones.categorias.length} categorías.`);
	return crearCategorias( idSeccion );
})
.then( idSeccion => {
	console.log(`Asignando una categoría al azar a cada artículo.`);
	return asignarCategorias( idSeccion );
})
.then( idSeccion => {
	console.log(`Creando dos sets de imágenes por cada artículo.`);
	return crearImagenes( idSeccion );
})
.then( idSeccion => {
	console.log(`Agregando imagen principal y otra en el cuerpo de cada artículo.`);
	return agregarImagenesEnArtis( idSeccion );
})
.then( idSeccion => {

// Agregar imagen principal y una en el cuerpo de cada artículo
// Crear imágenes de categorías




	process.exit( 0 );
})
.catch( error => {
	console.error( error );
	process.exit( 1 );
});

// ------------------------------------------------------------------------------------------------------------------
// Borra la sección de la base de datos y carpeta de imágenes

function limpiar () {
	return new Promise( ( resuelve, rechaza ) => {
		let idSeccion;
		consultaMySql("select id from blog_blogs where nombreUrl = ? limit 1", [ opciones.seccion.nombreUrl ] )	// Obtiene id de sección
		.then( seccion => {
			if ( seccion.length !== 1 ) {
				resuelve( false );
				return;
			}
			idSeccion = seccion[0].id;
			return consultaMySql("delete from blog_articulos where idBlog = ?", [idSeccion] );			// Borra artículos
		})
		.then( () => {
			return consultaMySql("delete from blog_categorias where idBlog = ?", [idSeccion] );			// Borra categorías
		})
		.then( () => {
			return consultaMySql("delete from blog_blogs where id = ? limit 1", [idSeccion] );			// Borra sección
		})
		.then( () => {
			rimraf( conf.dirBaseImagen + opciones.seccion.nombreUrl, () => {							// Borra carpeta de imágenes de la sección
				resuelve( true );
				return;
			});
		}).catch( error => { rechaza( error ) } );
	});
}

// ------------------------------------------------------------------------------------------------------------------

function crearArticulos( totArtis, idSeccion, uid ) {
	return new Promise( ( resuelve, rechaza ) => {
		obtenerLoremIpsum().then( parrafos => {
			let cadenaPromesas = Promise.resolve();
			let consulta = "insert into blog_articulos set idBlog = ?, uid = ?, copete = ?, tituloUrl = ?, titulo = ?, entradilla = ?, texto = ?," +
			"publicado = ?, fechaCreado = now(), fechaPublicado = ?, auxTexto = ?";
			while ( totArtis-- ) {
				let arti = [];
				arti.push( idSeccion );
				arti.push( uid );
				arti.push('');	// copete
				let titulo = hacerTitulo( parrafos[totArtis], 40, 70 );
				arti.push( utiles.cadena2url( titulo ) );
				arti.push( titulo );
				let entradilla = parrafos[totArtis];
				entradilla = entradilla.substr( 0, entradilla.indexOf('.', 160 ) + 1 )
				arti.push('<p>' + entradilla + '</p>');	// entradilla
				arti.push('<p>' + parrafos[totArtis+1] + '</p><p>' + parrafos[totArtis+2] + '</p>');	// texto
				arti.push( 1 ); // publicado
		//
				arti.push( utiles.ahoraDb() );	// fecha publicado

				arti.push('');	// auxTexto

				cadenaPromesas = cadenaPromesas.then( () => {					// Agrega promesa de agregar artículo
					return consultaMySql( consulta, arti );						// Promesa de agregar artículo
				});
			}
			return cadenaPromesas;
		})
		.then( () => {
			resuelve( idSeccion );
			return;
		})
		.catch( error => { rechaza( error ) } );
	});
}

function obtenerLoremIpsum() {
	return new Promise( ( resuelve, rechaza ) => {
		// Obtiene array de párrafos de lipsum.html
		fs.readFile('./lipsum.html', 'utf8', ( error, textoHtml ) => {
			if ( error ) {
				rechaza( error );
				return;
			}
			let dom = new JSDOM( textoHtml );
			let divLipsum = dom.window.document.getElementById('lipsum');
			let parrafos = [];
			let pTags = divLipsum.querySelectorAll('p');
			for ( let pTag of pTags ) {
				parrafos.push( pTag.textContent );
			}
			resuelve( parrafos );
			return;
		});
	});
}

function hacerTitulo( parrafo, longMin, longMax ) {
	let oraciones = parrafo.split('. ');
	oraciones[oraciones.length-1] = oraciones[oraciones.length-1].substr( 0, oraciones[oraciones.length-1].length-1 )
	let i = oraciones.length;
	while ( i -- ) {
		if ( oraciones[i].length >= longMin && oraciones[i].length <= longMax ) {
			return oraciones[i];
		}
	}
	//
	return oraciones[0].substr( 0, ( ( longMin + longMax ) / 2 ) );
}

//--------------------------------------------------------------------------------------------------------
// Crea categorías

function crearCategorias( idSeccion ) {
	return new Promise( ( resuelve, rechaza ) => {
		let cadenaPromesas = Promise.resolve();
		let consulta = "";
		opciones.categorias.forEach( cat => {
			cadenaPromesas = cadenaPromesas.then( () => {					// Agrega promesa de crear categoría
				return consultaMySql(
					"insert into blog_categorias set idBlog = ?, nombre = ?, nombreBase = ?, descripcion = ?",
					[ idSeccion, cat.nombre, cat.nombreBase, cat.descripcion ]
				);
			});
		});
		cadenaPromesas.then( () => {
			resuelve( idSeccion );
		}).catch( error => { rechaza( error ) } );
	});
}

//--------------------------------------------------------------------------------------------------------
// Asigna una categoría a cada artículo

function asignarCategorias( idSeccion ) {
	return new Promise( ( resuelve, rechaza ) => {
		let cadenaPromesas = Promise.resolve();
		let idsCat = [], idsArti = [];
		consultaMySql("select id from blog_categorias where idBlog = ?", [ idSeccion ] )				// Obtiene ids de categorías
		.then( res => {
			res.forEach( cat => { idsCat.push( cat.id ) } );
			return consultaMySql("select id from blog_articulos where idBlog = ?", [ idSeccion ] );		// Obtiene ids de artículos
		})
		.then( res => {
			res.forEach( arti => { idsArti.push( arti.id ) } );
			idsArti.forEach( idArti => {
				let idCat = idsCat[ Math.floor( Math.random() * idsCat.length ) ];						// Id de categoría al azar
				cadenaPromesas = cadenaPromesas.then( () => {
					return consultaMySql("insert into blog_arti_cat set idArti = ?, idCat = ?", [ idArti, idCat ] );
				});
			});
			return cadenaPromesas;
		})
		.then( () => {
			resuelve( idSeccion );
			return;
		}).catch( error => { rechaza( error ) } );
	});
}

//--------------------------------------------------------------------------------------------------------

function crearImagenes( idSeccion ) {
	return new Promise( ( resuelve, rechaza ) => {
		let cadenaPromesas = Promise.resolve();
		let idsArti = [];
		consultaMySql("select id from blog_articulos where idBlog = ?", [ idSeccion ] )
		.then( res => {

			fs.readdir( '/home/guillermo/Escritorio/imagenes/salida', ( error, archivos ) => {
				if ( error ) {
					rechaza( error );
					return;
				}
				let i = 0;
				res.forEach( arti => {
					//arti.id
					cadenaPromesas = cadenaPromesas.then( () => {
						let origen = `/home/guillermo/Escritorio/imagenes/salida/${archivos[i]}`;
						let destino = conf.dirBaseImagen + opciones.seccion.nombreUrl + '/articulos/id' + utiles.padIzquierdo( arti.id, '000000') + '/' + archivos[i];
						i ++;
						return crearSetImagenes( origen, destino );
					}).then( () => {
						let origen = `/home/guillermo/Escritorio/imagenes/salida/${archivos[i]}`;
						let destino = conf.dirBaseImagen + opciones.seccion.nombreUrl + '/articulos/id' + utiles.padIzquierdo( arti.id, '000000') + '/' + archivos[i];
						i ++;
						return crearSetImagenes( origen, destino );
					});
				});
				//
				cadenaPromesas.then( () => {
					resuelve( idSeccion );
				}).catch( error => { rechaza( error ) } );
			});

		}).catch( error => { rechaza( error ) } );
	});
}

function crearSetImagenes( origen, destino ) {
	return new Promise( ( resuelve, rechaza ) => {
		let carpeta = destino.substr( 0, destino.lastIndexOf('/') );
		mkdirp( carpeta, error => {													// Crea carpeta
			if ( error ) rechaza( error );
		});
		//
		destino = destino.substr( 0, destino.lastIndexOf('.') );					// Quita extención
		let banderaError = false, contador = conf.setDeImagenes.length;
		conf.setDeImagenes.forEach( infoImg => {
			imagenRedim( origen, destino + infoImg.sufijo + '.jpg', infoImg.ancho, infoImg.alto )	// Crea imagen nueva
			.then( ok => {
				banderaError = !ok ? true : banderaError;
				contador--;
				if ( contador === 0 ) {												// Ya se creó la última imagen
					if ( banderaError ) {
						resuelve( false );
					} else {
						resuelve( true );
					}
					return;
				}
			});
		});
	});
}

function imagenRedim( archivo, archivoNuevo, anchoNuevo, altoNuevo ) {
	const { exec } = require('child_process');
	const cl = `convert ${archivo} -resize ${anchoNuevo}x${altoNuevo}^ -gravity center -extent ${anchoNuevo}x${altoNuevo} ${archivoNuevo}`;
	return new Promise( ( resuelve, rechaza ) => {
		exec( cl, ( error, stdout, stderr ) => {
			if ( error ) {
				console.error( error );
				return resuelve( false );
			}
			return resuelve( true );
		});
	});
}

// ------------------------------------------------------------------------------------------------------------------

function agregarImagenesEnArtis( idSeccion ) {
	return new Promise( ( resuelve, rechaza ) => {
		let cadenaPromesas = Promise.resolve();
		consultaMySql("select id from blog_articulos where idBlog = ?", [ idSeccion ] )			// Obtiene id de artículos
		.then( res => {
			res.forEach( arti => {
				let dirImagenes = conf.dirBaseImagen + opciones.seccion.nombreUrl + '/articulos/id' + utiles.padIzquierdo( arti.id, '000000');
				let archivos = fs.readdirSync( dirImagenes );									// Obtiene nombre de archivos
				archivos = archivos.filter( archivo => {										// Descarta archivos con sufijo
					if ( archivo.substr( -8 ) !== '-480.jpg' && archivo.substr( -8 ) !== '-960.jpg' && archivo.substr( -9 ) !== '-1920.jpg' ) {
						return archivo;
					}
				});
				let srcImg1 = conf.urlBaseImagen + opciones.seccion.nombreUrl + '/articulos/id' + utiles.padIzquierdo( arti.id, '000000') + '/' + archivos[0];
				let srcImg2 = conf.urlBaseImagen + opciones.seccion.nombreUrl + '/articulos/id' + utiles.padIzquierdo( arti.id, '000000') + '/' + archivos[1];
				cadenaPromesas = cadenaPromesas.then( () => {
					return agregarImagenes( arti.id, srcImg1, srcImg2 );
				});
			});
			//
			cadenaPromesas.then( () => {
				resuelve( idSeccion );
			}).catch( error => { rechaza( error ) } );
		}).catch( error => { rechaza( error ) } );
	});
}

function agregarImagenes( idArti, src1, src2 ) {
	return new Promise( ( resuelve, rechaza ) => {
		consultaMySql("select texto from blog_articulos where id = ? limit 1", [ idArti ] )
		.then( res => {
			let parrafo1 = res[0].texto.substr( 0, res[0].texto.indexOf('</p>') + 4 );
			let parrafo2 = res[0].texto.substr( res[0].texto.indexOf('</p>') + 4 );
			let cuerpo = `${parrafo1}<img src="${src2}">${parrafo2}`;
			return consultaMySql("update blog_articulos set imgPrincipal = ?, texto = ? where id = ? limit 1", [ src1, cuerpo, idArti ])
		})
		.then( res => {
			resuelve();
			return;
		}).catch( error => { rechaza( error ) } );
	});
}

//--------------------------------------------------------------------------------------------------------

function conexion() {
	return new Promise( ( resuelve, rechaza ) => {
		pool.getConnection( ( error, conexion ) => {
			if ( error ) rechaza( error );
			else resuelve( conexion );
		});
	});
};

function consultaMySql( consulta, parametros ) {
	return new Promise( ( resuelve, rechaza ) => {
		conexion().then( con => {
			con.query( consulta, parametros, ( error, resultado ) => {
				con.release();
				if ( error ) rechaza( error );
				else resuelve( resultado );
			});
		}).catch( error => { rechaza( error ) } );
	});
};
