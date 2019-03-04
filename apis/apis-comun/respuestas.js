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

let zlib = require('zlib');

module.exports = {
	responder: ( estado, contenido, acceptEncoding, res ) => {
		acceptEncoding = acceptEncoding || '';
		// Crea stream para responder
		let Readable = require('stream').Readable;
		let streamDatos = new Readable;
		streamDatos.push( JSON.stringify( contenido ) );
		streamDatos.push( null );				// Fin de stream
		let cabeceras = {
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

