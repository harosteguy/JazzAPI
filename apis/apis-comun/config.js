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

module.exports = {
	marca: 'Tu Marca',
	urlBase: 'https://tumarca.com',
	// Idiomas de contenidos (el primero es idioma por defecto)
	// Debe reflejar los campos de idioma de la tabla contenidos en la base de datos jazz_chorro
	setIdiomas: ['es', 'en'],
	// Idiomas en los que responden las apis (aviso, mensajes de error, etc.) de acuerdo 
	// con la cabecera accept-language de las peticiones
	// Debe mantener una coherencia con los archivos de idioma de las APIs
	setIdiomasApis: ['es', 'en'],
	// Host del servidor MySQL
	dbHost: 'localhost',
	// Usuario MySQL
	dbUser: 'jazz_usr',
	dbPass: 'Contraseña de usuario aquí',
	// Usuario MySQL para tareas de gestión
	dbUserWm: 'jazz_wm',
	dbPassWm: 'Contraseña de webmaster aquí',
	// Puerto donde se sirven las APIs
	puertoHttp: 6666,
	// Cantidad de artículos en las respuestas de la API Articulus
	maxArtisRespuesta: 100,
	artisResDefecto: 20,
	// Carpeta para las imágenes de la aplicación
	dirBaseImagen: require('path').join(__dirname, '../../../JazzApp/app/img/'),
	// URL para las imágenes de la aplicación
	urlBaseImagen: '/img/',
	// Set de imágenes que se crea partiendo de cada imagen subida para artículos, categorías...
	setDeImagenes: [
		{ ancho: 480, alto: 270, sufijo: '-480' },
		{ ancho: 960, alto: 540, sufijo: '-960' },
		{ ancho: 1280, alto: 720, sufijo: '-1280' },
		{ ancho: 960, alto: 540, sufijo: '' }
	],
	// Imágenes para cabeza y pie de emails. 600px de ancho.
	imgMailHtmlTop: 'https://tumarca.com/interfaz/img/imgMailHtmlCabeza.jpg',
	imgMailHtmlBottom: 'https://tumarca.com/interfaz/img/imgMailHtmlPie.jpg',
	// API Contacto y Usuarios. Ver cómo configurar gmail en https://nodemailer.com/usage/using-gmail/
	gmailEmisor: 'correo.emisor@gmail.com',
	gmailPass: 'contraseña de correo.emisor@gmail.com',
	correoReceptor: 'contacto@qwertyu.iop',
}
