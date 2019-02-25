var zlib = require('zlib');

module.exports = {
	responder: ( estado, contenido, acceptEncoding, res ) => {
		acceptEncoding = acceptEncoding || '';
		// Crea stream para responder
		var Readable = require('stream').Readable;
		var streamDatos = new Readable;
		streamDatos.push( JSON.stringify( contenido ) );
		streamDatos.push( null );				// Fin de stream
		var cabeceras = {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Pragma': 'no-cache',
// CORS
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
			'Access-Control-Allow-Headers': 'Authorization, Accept-Language, X-Accept-Charset, X-Accept, Content-Type',
			'Allow': 'GET, POST, OPTIONS, PUT, DELETE'
//
		};
		// Comprime si se indica en la cabecera de la petición y responde
		if ( acceptEncoding.match( /\bdeflate\b/ ) ) {		// PENDIENTE Trabajar el parser de accept-encoding. Ver http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
			cabeceras['Content-Encoding'] = 'deflate';
			res.writeHead( estado, cabeceras );
			streamDatos.pipe( zlib.createDeflate() ).pipe( res );
		} else if ( acceptEncoding.match( /\bgzip\b/ ) ) {
			cabeceras['Content-Encoding'] = 'gzip';
			res.writeHead( estado, cabeceras );
			streamDatos.pipe( zlib.createGzip() ).pipe( res );
		} else {
			res.writeHead( estado, cabeceras );
			streamDatos.pipe( res );
		}
	}
};

