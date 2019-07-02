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

'use strict'

let conf = require('../../../apis-comun/config')
let BaseDatos = require('../../../apis-comun/base-datos')
let db = new BaseDatos(conf.dbHost, conf.dbUser, conf.dbPass, conf.dbPrefijo + '_articulus')
let mCache = require('../../../apis-comun/cache-mem')
let respuestas = require('../../../apis-comun/respuestas')
let modError = require('../../../apis-comun/error')

module.exports = class Blog {
  constructor (req, res) {
    this.req = req
    this.res = res
    // Obtiene mensajes en el idioma del header
    this.msj = require('../idiomas/' + req.idioma)
  }

  procesarPeticion (aRuta) {
    if (this.req.method === 'GET') {
      // Busca respuesta de la petición en cache
      let idContenido = require('crypto').createHash('md5').update(this.req.url).digest('hex') // md5 de la URL para identificar cntenido en cache
      let contenido = mCache.obtener(idContenido)
      if (contenido.disponible) {
        // Responde petición desde cache
        // contenido.datos.cache = 1;
        respuestas.responder(200, contenido.datos, this.res)
      } else {
        this.listar().then(respuesta => {
          // respuesta.cache = 0;
          respuestas.responder(200, respuesta, this.res)
          mCache.cachear(idContenido, respuesta).catch(error => {
            modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
          })
        }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
      }
    } else {
      modError.responderError(405, this.msj.metodoNoValido, this.res)
    }
  }

  listar () {
    return new Promise((resolve, reject) => {
      let consulta = 'select nombre, nombreUrl, descripcion from blog_blogs order by nombre'
      db.consulta(consulta).then(blogs => {
        let respuesta = {}
        respuesta.blogs = blogs
        resolve(respuesta)
      }).catch(error => { reject(error) })
    })
  }
}
