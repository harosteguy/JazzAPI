module.exports = {
	marca: 'JazzAPI',
	urlBase: 'https://cms.local',
	//
	setIdiomas: ['es', 'en', 'fr'],		// Campos de idioma de contenidos (el primero es idioma por defecto)
	setIdiomasApis: ['es', 'en'],		// Archivos de idioma de las APIs
	//
	dbHost: 'localhost',
	//
	dbUser: 'cms_usr',
	dbPass: 'Cl4v3dEu5U4r10',
	//
	dbUserWm: 'cms_wm',
	dbPassWm: 'c1AVeD3w3Bma5t3R',
	//
	puertoHttp: 6666,
	//
	maxArtisRespuesta: 100,
	artisResDefecto: 20,
	//
	dirBaseImagen: require('path').join(__dirname, '../../../servidor_app/app/publico/img/'),
	urlBaseImagen: '/img/',
	setDeImagenes: [
		{ ancho: 480, alto: 270, sufijo: '-480' },
		{ ancho: 960, alto: 540, sufijo: '-960' },
		//{ ancho: 1280, alto: 720, sufijo: '-1280' },
		{ ancho: 1920, alto: 1080, sufijo: '-1920' },
		{ ancho: 960, alto: 540, sufijo: '' }
	],
	// Imágenes para cabeza y pie de emails. 600px de ancho.
	imgMailHtmlTop: 'https://cms.local/interfaz/img/imgMailHtmlCabeza.jpg',
	imgMailHtmlBottom: 'https://cms.local/interfaz/img/imgMailHtmlPie.jpg',
	// API contacto y usuarios
	gmailEmisor: 'correo-emisor@gmail.com',
	gmailPass: 'contraseña de correo-emisor@gmail.com',
	correoReceptor: 'contacto@qwertyu.iop', 	// Se pueden agregar varios separados con comas
	// API notificaciones
	maxSuscrisRespuesta: 100,
	suscrisResDefecto: 20,
	gcmApiKey: 'AAAAsxU2Zzo:APA91bG9SlQk-Knn0eOh9yVRUuq6kixeVH-V2JfpglP3eCB9VBoTOzpvp4k7B_5pZ6gdmjm6h4pipGHXbl3ZKK0yV9USMW9JMOA3O26ngalcfWmQIlk6bLLqGKze6uFbjLNxusz9jGYr',
	vapidPublicKey: 'BFD7ifxBqlqZmOS40d7uNx80HOb5zDtRo8CfwYrk6pB46BquLUMfbTsiGDchxjDvCm3AHw1l2GmSYt_0cqBlvMU',
	vapidPrivateKey: 'a55OQT-pAflEBL6JfPAElWZf0N7-5pppuJexnkyf9vE'
}