'use strict';

const confi = {
	longitudCache: 1048576,																						// Total maximo de contenidos en cache en bytes
	maximoCacheable: 5000,																						// El contenido que supere este valor no se cacheará
	vigenciaCache: 48																							// Tiempo (en horas) que cada contenido estará disponible
};

if ( !global.rwCache ) global.rwCache = {};																		// Crea la cache
// { '9f91bb88fe590ab9b0a04699149935fa': { longitud: 123, tiempo: 1531367043000, datos: { appProyectos: "Proyectos", appInicio: "Inicio" } }, ... }

module.exports = {
	obtener: idConte => {
		let contenido = {};
		if ( global.rwCache[ idConte ] ) {
			let vigCache = 3600000 * confi.vigenciaCache;		 												// Horas a milisegundos
			contenido.disponible = global.rwCache[ idConte ].tiempo > ( new Date().getTime() - vigCache );		// true si el contenido está vigente
			contenido.datos = global.rwCache[ idConte ].datos;
		} else {
			contenido.disponible = false;
		}
		return contenido;
	},
	cachear: ( idConte, datos ) => {
		return new Promise( ( resuelve, rechaza ) => {
			let longiConte = JSON.stringify( datos ).length;													// Tamaño del contenido nuevo
			if ( longiConte > confi.maximoCacheable ) {															// Si supera el tamaño máximo permitido no cachea
				resuelve( false );
				return;
			}
			if ( global.rwCache[ idConte ] ) {																	// Si el contenido existe lo borra
				delete global.rwCache[ idConte ];
			}
			let longiEnCache = 0;
			for ( var idCon in global.rwCache ) {																// Obtiene tamaño total de los contenidos en cache
				longiEnCache += global.rwCache[ idCon ].longitud;
			}
			// Si el contenido no cabe en la cache; hace espacio 
			// para el nuevo contenido eliminando los más viejos
			if ( ( longiEnCache + longiConte ) > confi.longitudCache ) {
				// Crea un array de la cache para ordenar por tiempo
				let aTiempo = [];
				for ( var idCon in global.rwCache ) {
					aTiempo.push({
						id: idCon,
						tiempo: global.rwCache[ idCon ].tiempo,
						longitud: global.rwCache[ idCon ].longitud
					});
				}
				aTiempo.sort( ( a, b ) => { return a.tiempo - b.tiempo } );										// Ordena, los más viejos primero
				//
				let espacioALiberar = longiConte - ( confi.longitudCache - longiEnCache ),
					liberado = 0,
					vigCache = 3600000 * confi.vigenciaCache,
					ahora = new Date().getTime();
				//
				aTiempo.some( conte => {
					if ( espacioALiberar > liberado ) {
						// Borra hasta tener espacio para el contenido
						liberado += conte.longitud;
						delete global.rwCache[ conte.id ];
					} else {
						// Si quedan contenidos caducos los borra
						if ( conte.tiempo < ( ahora - vigCache ) ) {
							delete global.rwCache[ conte.id ];
						} else {
							return true;
						}
					}
				});
			}
			global.rwCache[ idConte ] = { tiempo: new Date().getTime(), longitud: longiConte, datos: datos };	// Guarda en cache
/*			// Monitor de cache
			if ( process.argv.indexOf('monitorCache') > -1 ) {
				longiEnCache = 0;
				let totPeticiones = 0,
					caducas = 0,
					ahora = new Date().getTime(),
					vigencia = 3600000 * confi.vigenciaCache;
				for ( var idCon in global.rwCache ) {
					totPeticiones ++;
					longiEnCache += global.rwCache[ idCon ].longitud;
					if ( global.rwCache[ idCon ].tiempo < ( ahora - vigencia ) ) {
						caducas ++;
					}
				}
				let porCienEnCache = Math.ceil( longiEnCache * 100 / confi.longitudCache );
				let salida = 'Configuración\n' +
				'Tamaño de la cache: ' + confi.longitudCache + 'B\n' +
				'Tamaño máximo cacheable: ' + confi.maximoCacheable + 'B por petición\n' +
				'Vigencia: ' + confi.vigenciaCache + ' Horas\n\n' +
				'Info\n' +
				'Peticiones en cache: ' + totPeticiones + '\n' +
				'Contenido en cache: ' + longiEnCache + 'B ' + porCienEnCache + '%\n' +
				'Espacio libre: ' + ( confi.longitudCache - longiEnCache ) + 'B ' + ( 100 - porCienEnCache ) + '%\n' +
				'Peticiones caducas: ' + caducas + '%\n\n';
				console.clear();
				console.log( salida );
			}
*/			//
			resuelve( true );
		});
	}
};