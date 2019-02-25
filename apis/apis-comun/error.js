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

var manejarError = ( error, textoAlt, res ) => {
	if ( error.estado ) {
		responderError( error.estado, error.message, res );
	} else {
		responderError( 500, textoAlt, res );
		logError( error.name + ' ' + error.message + '\n' + error.stack );
	}
}

var responderError = ( estado, texto, res ) => {
	estado = estado || 500;

// 
	respuestas.responder( estado, { error: texto }, '', res );
/*
	res.writeHead( estado, { 'Content-Type': 'application/json' } );
	res.write( JSON.stringify( { error: texto } ) );
	res.end();
*/



}

var logError = ( texto ) => {
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
