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

let mysql = require('mysql')

module.exports = class BaseDatos {
  constructor (dbHost, dbUser, dbPass, dbDatabase) {
    this.pool = mysql.createPool({
      connectionLimit: 100,
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbDatabase,
      dateStrings: true
    })
  }

  conexion () {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((error, conexion) => {
        if (error) reject(error)
        else resolve(conexion)
      })
    })
  }

  consulta (consulta, parametros) {
    return new Promise((resolve, reject) => {
      this.conexion().then(con => {
        con.query(consulta, parametros, (error, resultado) => {
          con.release()
          if (error) reject(error)
          else resolve(resultado)
        })
      }).catch(error => { reject(error) })
    })
  }
}
