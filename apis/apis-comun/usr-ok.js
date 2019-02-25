let http = require('http'),
	modError = require('./error');

module.exports = req => {
	// Verifica credenciales con la API de usuario
	return new Promise( ( resuelve, rechaza ) => {
		if ( req.headers.authorization ) {
			const opciones = {
				hostname: 'localhost',
				port: 6666,
				path: '/apis/usuarios/v1/autorizacion',
				method: 'GET',
				headers: {
					'Authorization': req.headers.authorization,
					'User-Agent': 'API WM-Articulus'
				}
			};
			http.get( opciones, respuesta  => {
				let cuerpo = '';
				respuesta.on('data', ( fragmento ) => { cuerpo += fragmento; });
				respuesta.on('end', () => {
					try {
						const usuario = JSON.parse( cuerpo );
						if ( usuario.error ) {
							rechaza( new modError.ErrorEstado( 'Usuario no autorizado.', 403 ) );
						} else {
							resuelve( usuario );
						}
					} catch ( error ) {
						rechaza( new modError.ErrorEstado( 'Usuario no autorizado.', 403 ) );
					}
				});
			}).on('error', error => {
  				rechaza( new modError.ErrorEstado( 'Usuario no autorizado.', 403 ) );
			});
		} else {
			rechaza( new modError.ErrorEstado( 'Usuario no autorizado.', 403 ) );
		}
	});
}