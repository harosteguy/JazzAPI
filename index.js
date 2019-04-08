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

let http = require('http'),
	url = require('url'),
	conf = require('./apis/apis-comun/config'),
	multipart = require('./apis/apis-comun/multipart'),
	fs = require('fs'),
	modError = require('./apis/apis-comun/error');

let logAcceso = ( req ) => {
	return new Promise( ( resuelve, rechaza ) => {
		let ip = req.headers['x-forwarded-for'] || 
			req.connection.remoteAddress || 
			req.socket.remoteAddress ||
			( req.connection.socket ? req.connection.socket.remoteAddress : '' );
		let f = new Date();
		let fecha = f.toUTCString();
		let logAcceso = ip + ' ' + fecha + ' ' + req.method + ' ' + req.url + ' HTTP/' + req.httpVersion + ' ' + req.headers.host + ' ' + req.headers['user-agent'] + '\n';
		require('./apis/apis-comun/guardar-log')('acceso', logAcceso );
		resuelve( true );
	});
}

// Rutea la petición a la API correspondiente
let rutearPeticion = ( req, res ) => {
	let ruta = url.parse( req.url ).pathname;
	let aRuta = ruta.split('/');
	if ( aRuta[1] == 'apis') {

//// 
		if ( ['chorro','wm-chorro','articulus','wm-articulus','usuarios','contacto','wm-imagen'].indexOf( aRuta[2] ) !== -1 ) {

			if ( req.method == 'OPTIONS') {		// Responde peticiones preflight
				res.writeHead( 200, {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
					'Access-Control-Allow-Headers': 'Authorization, Accept-Language, X-Accept-Charset, X-Accept, Content-Type',
					'Allow': 'GET, POST, OPTIONS, PUT, DELETE'
				});
				res.end();
				return;
			}

			require('./apis/' + aRuta[2] + '/v1/principal')( req, res );
		} else {
			modError.responderError( 404, 'La API no existe', res );
		}
	} else {
		modError.responderError( 404, 'La API no existe', res );
	}
};

let esMultipartFormData = req => {
	if ( !req.headers['content-type'] ) return false;
	let items = req.headers['content-type'].split(';');
	if ( !items ) return false;
	for ( let i = 0; i < items.length; i++ ) {
		let item = String( items[i] ).trim();
		if ( item.indexOf( 'multipart/form-data' ) >= 0 ) return true;
	}
	return false;
};

http.createServer( ( req, res ) => {

	logAcceso( req );

	req.on('error', error => {
		modError.logError( JSON.stringify( error ) );
	});

	let mfdBuffer,								// Buffer para el cuerpo multipart/form-data
		cuerpo = '',
		esMFD = esMultipartFormData( req ),		// True si content-type de la petición es multipart/form-data
		mfdBufferIndex = 0;

	if ( esMFD ) {
		req.setEncoding('binary');
		mfdBuffer = Buffer.alloc( ( 2*1024*1024 ), 0, 'binary' );			// Crea buffer de 2 Mb
		req.on('data', fragmento => {
			if ( ( mfdBufferIndex + fragmento.length ) < ( 2*1024*1024 ) ) {
				mfdBuffer.write( fragmento, mfdBufferIndex, fragmento.length, 'binary' );
			}


			mfdBufferIndex += fragmento.length;
		});
	} else {
		req.setEncoding('utf-8');
		req.on('data', fragmento => {
			//cuerpo += fragmento.toString();
			cuerpo += fragmento;
////
			// PENDIENTE
			// Controlar tamaño máximo del cuerpo de la petición.
			// Va a memoria así que se puede agotar.
			// De éste control se puede encargar un proxy inverso
		});
	}

	req.on('end', () => {
		// Agrega idioma saneado de la cabecera accept-language para usar en los servicios
		req.idioma = conf.setIdiomasApis.includes( req.headers['accept-language'] ) ? req.headers['accept-language'] : conf.setIdiomasApis[0];
		//
		if ( esMFD ) {												// La cabecera content-type de la petición es multipart/form-data
			let mfd = mfdBuffer.slice( 0, mfdBufferIndex );			// Obtiene porción con datos del buffer
			if ( mfdBufferIndex < ( 2*1024*1024 ) ) {				// Verifica exceso de tamaño del cuerpo
				let boundary = multipart.getBoundary( req.headers['content-type'] );
				if ( boundary ) {
					let partes = multipart.Parse( mfd, boundary );	// Parsea las partes
					let archivo = {
						nombre: partes[0].filename,
						nombreTmp: require('crypto').randomBytes( 16 ).toString('hex'),
						tipo: partes[0].type
					};

					let writeStream = fs.createWriteStream( './tmp/' + archivo.nombreTmp, { flags : 'w' } );

					// Initiate the source
					let bufferStream = new require('stream').PassThrough();
					// Write your buffer
					bufferStream.end( partes[0].data );
					// Pipe it to something else  (i.e. stdout)
					bufferStream.pipe( writeStream );
					writeStream.on('close', () => {
						mfdBuffer = null; mfd = null;
						req.cuerpo = JSON.stringify( { archivo: archivo } );
						rutearPeticion( req, res );
					});
				} else {
					mfdBuffer = null; mfd = null;
					modError.responderError( 400, 'Falta boundary en la cabecera content-type', res );
					modError.logError('Falta boundary en la cabecera content-type.')
				}
			} else {
				mfdBuffer = null; mfd = null;
				modError.responderError( 400, 'El cuerpo de la petición supera los dos megas.', res );
				modError.logError('El cuerpo de la petición supera los dos megas.');
			}
		} else {				// Si el cuerpo no es multipart se espera json
			req.cuerpo = cuerpo;
			rutearPeticion( req, res );
		}
	});

}).listen( conf.puertoHttp );

console.log('Servidor JazzAPI iniciado en el puerto ' + conf.puertoHttp + '\n' + new Date().toISOString() + '\n\n');
