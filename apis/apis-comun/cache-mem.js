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

const confi = {
	longitudCache: 1048576,																						// Total maximo de contenidos en cache en bytes
	maximoCacheable: 5000,																						// El contenido que supere este valor no se cacheará
	vigenciaCache: 48																							// Tiempo (en horas) que cada contenido estará disponible
};

if ( !global.cmsCache ) global.cmsCache = {};																		// Crea la cache
// { '9f91bb88fe590ab9b0a04699149935fa': { longitud: 123, tiempo: 1531367043000, datos: { appProyectos: "Proyectos", appInicio: "Inicio" } }, ... }

module.exports = {
	obtener: idConte => {
		let contenido = {};
		if ( global.cmsCache[ idConte ] ) {
			let vigCache = 3600000 * confi.vigenciaCache;		 												// Horas a milisegundos
			contenido.disponible = global.cmsCache[ idConte ].tiempo > ( new Date().getTime() - vigCache );		// true si el contenido está vigente
			contenido.datos = global.cmsCache[ idConte ].datos;
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
			if ( global.cmsCache[ idConte ] ) {																	// Si el contenido existe lo borra
				delete global.cmsCache[ idConte ];
			}
			let longiEnCache = 0;
			for ( var idCon in global.cmsCache ) {																// Obtiene tamaño total de los contenidos en cache
				longiEnCache += global.cmsCache[ idCon ].longitud;
			}
			// Si el contenido no cabe en la cache; hace espacio 
			// para el nuevo contenido eliminando los más viejos
			if ( ( longiEnCache + longiConte ) > confi.longitudCache ) {
				// Crea un array de la cache para ordenar por tiempo
				let aTiempo = [];
				for ( var idCon in global.cmsCache ) {
					aTiempo.push({
						id: idCon,
						tiempo: global.cmsCache[ idCon ].tiempo,
						longitud: global.cmsCache[ idCon ].longitud
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
						delete global.cmsCache[ conte.id ];
					} else {
						// Si quedan contenidos caducos los borra
						if ( conte.tiempo < ( ahora - vigCache ) ) {
							delete global.cmsCache[ conte.id ];
						} else {
							return true;
						}
					}
				});
			}
			global.cmsCache[ idConte ] = { tiempo: new Date().getTime(), longitud: longiConte, datos: datos };	// Guarda en cache
/*			// Monitor de cache
			if ( process.argv.indexOf('monitorCache') > -1 ) {
				longiEnCache = 0;
				let totPeticiones = 0,
					caducas = 0,
					ahora = new Date().getTime(),
					vigencia = 3600000 * confi.vigenciaCache;
				for ( var idCon in global.cmsCache ) {
					totPeticiones ++;
					longiEnCache += global.cmsCache[ idCon ].longitud;
					if ( global.cmsCache[ idCon ].tiempo < ( ahora - vigencia ) ) {
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