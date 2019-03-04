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

let conf = require('../../apis-comun/config'),
	respuestas = require('../../apis-comun/respuestas'),
	modError = require('../../apis-comun/error'),
	nodemailer = require('nodemailer');

module.exports = ( req, res ) => {
	// Idioma para avisos
	let msj = require('./idiomas/' + req.idioma );
	// Verifica método
	if ( req.method != 'POST') {
		modError.responderError( 405, msj.metodoNoValido, res );
		return;
	}
	// Verifica datos de entrada
	let aviso = '', mensaje;
	try {
		mensaje = JSON.parse( req.cuerpo );
	} catch ( error ) {
		modError.responderError( 400, msj.cuerpoNoJson, res );
		return;
	}
	if ( !mensaje.nombre || mensaje.nombre == '' ) {
		aviso += msj.faltaNombre;
	}
	if ( !mensaje.email || mensaje.email == '' ) {
		aviso += msj.faltaCorreo;
	}
	mensaje.telefono = mensaje.telefono || '';
	if ( !mensaje.mensaje || mensaje.mensaje == '' ) {
		aviso += msj.faltaMensaje;
	}
	if ( aviso !== '' ) {
		modError.responderError( 400, aviso, res );
		return;
	}
	// Crea objeto transporte reusable usando SMTP transport por defecto
/*	let transporte = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: 'ruj2aqaczpqva5du@ethereal.email',
			pass: 'Ch6BuHGN256Al8PNNq'
		}
	});
*/
	let transporte = nodemailer.createTransport({
		service: 'gmail',
		port: 443,
		options: {
			debug: true,
		},
		auth: {
			user: conf.gmailEmisor,
			pass: conf.gmailPass
		}
	});
/*
	// verify connection configuration
	transporte.verify(function(error, success) {
		if (error) {
			console.log(error);
		} else {
			console.log('Server is ready to take our messages');
		}
	});
*/
	// Datos del correo
	let correo = {
		from: '"Contacto Web - ' + mensaje.nombre + '" <' + conf.gmailEmisor + '>',
		to: conf.correoReceptor,
		replyTo: mensaje.email,
		subject: 'Contacto Web - ' + mensaje.nombre,
		text: mensaje.mensaje + '\n\n' + mensaje.nombre + '\n' + mensaje.email + '\n' + mensaje.telefono
	};
	// Envía correo con el objeto transporte
	transporte.sendMail( correo ).then( info => {
		respuestas.responder( 200, { respuesta: msj.mensajeEnviado }, req.headers['accept-encoding'], res );
		// Vista previa disponible cuando se envía a travéz de una cuenta Ethereal
		//console.log('URL de vista previa: %s', nodemailer.getTestMessageUrl(info));
	}).catch( error => {
		modError.responderError( 500, msj.errorEnviandoCorreo, res );
		modError.logError( error.name + ' ' + error.message + '\n' + error.stack );
	});
};
