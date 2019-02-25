let mysql = require('mysql');

module.exports = class BaseDatos {

	constructor( dbHost, dbUser, dbPass, dbDatabase ) {
		this.pool = mysql.createPool({
			connectionLimit : 100,
			host: dbHost,
			user: dbUser,
			password: dbPass,
			database: dbDatabase,
			dateStrings: true
		});
	}

	conexion() {
		return new Promise( ( resuelve, rechaza ) => {
			this.pool.getConnection( ( error, conexion ) => {
				if ( error ) rechaza( error );
				else resuelve( conexion );
			});
		});
	}

	consulta( consulta, parametros ) {
		return new Promise( ( resuelve, rechaza ) => {
			this.conexion().then( con => {
				con.query( consulta, parametros, ( error, resultado ) => {
					con.release();
					if ( error ) rechaza( error );
					else resuelve( resultado );
				});
			}).catch( error => { rechaza( error ) } );
		});
	}

};
