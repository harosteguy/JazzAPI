'use strict';

var fs = require('fs');
var zlib = require('zlib');

module.exports = ( archivo, texto ) => {
	var rutaArchivo = 'logs/' + archivo;	// Agrega ruta al archivo
	// Guarda informe
	fs.appendFile( rutaArchivo + '.log', texto, { 'encoding': 'utf-8', 'mode': 0o644 }, error => {
		if ( error ) {
			console.log( error );
			return;
		}
		fs.stat( rutaArchivo + '.log', ( error, estado ) => {
			if ( error ) {
				console.log( error );
				return;
			}
			if ( estado.size > 500000 ) {
				// Nombre del archivo comprimido
				var f = new Date();
				var unixTime = f.getTime();
				var archivoComprimido = rutaArchivo + '-' + unixTime + '.log.gz';
				// Guarda el archivo comprimido
				var gzip = zlib.createGzip();
				var entrada = fs.createReadStream( rutaArchivo + '.log');
				var salida = fs.createWriteStream( archivoComprimido );
				entrada.pipe(gzip).pipe(salida);
				salida.on('close', () => {
					// Una vez guardado trunca el archivo
					fs.truncateSync( rutaArchivo + '.log', 0 );
				});
				//
				// Si hay más de 5 logs archivados elimina el más viejo
				fs.readdir('logs/', ( error, archivos ) => {				// Lee los archivos de la carpeta
					// Separa en un array los archivos .gz cuyos nombres comienzan igual al archivo .log
					var archivosComprimidos = [];
					for ( var i = 0, tot = archivos.length; i < tot; i++ ) {
						if ( archivos[i].substr( 0, archivo.length ) == archivo && archivos[i].substr( -3 ) == '.gz')
						{
							archivosComprimidos.push( archivos[i] );
						}
					}
					if ( archivosComprimidos.length > 5 ) {
						// Ordena el array y elimina el archivo más viejo
						archivosComprimidos.sort();
						fs.unlink('logs/' + archivosComprimidos.shift(), () => { } );
					}
				});
			}
		});
	});
};
