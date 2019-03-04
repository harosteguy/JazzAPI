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

let respuestas = require('./respuestas');

// Extensión de la clase Error agregando el parámetro estado en su constructor
// para manejar las respuestas de las peticiones
class ErrorEstado extends Error {
	constructor( mensaje, estado ) {
		super( mensaje );
		this.estado = estado;
		Error.captureStackTrace( this, ErrorEstado )
	}
}

let manejarError = ( error, textoAlt, res ) => {
	if ( error.estado ) {
		responderError( error.estado, error.message, res );
	} else {
		responderError( 500, textoAlt, res );
		logError( error.name + ' ' + error.message + '\n' + error.stack );
	}
}

let responderError = ( estado, texto, res ) => {
	estado = estado || 500;
	respuestas.responder( estado, { error: texto }, '', res );
}

let logError = ( texto ) => {
	// Obtiene fecha universal
	let f = new Date();
	let fechaHora = f.toUTCString();
	// Obtine archivo, línea y función donde se produjo el el error
	let original = Error.prepareStackTrace;
	Error.prepareStackTrace = ( _, pila ) => pila;
	let error = new Error;
	Error.captureStackTrace( error, arguments.called );
	let pila = error.stack;
	Error.prepareStackTrace = original;
	//
	let cadenaLog = fechaHora + ' ' + texto + '\n' + pila[2].getFileName() + ' ' + pila[2].getLineNumber() + ' ' + pila[2].getFunctionName() + '\n';
	require('./guardar-log')('error', cadenaLog );
};

exports.ErrorEstado = ErrorEstado;
exports.manejarError = manejarError;
exports.responderError = responderError;
exports.logError = logError;
