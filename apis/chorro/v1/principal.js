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

let conf = require('../../apis-comun/config')
let BaseDatos = require('../../apis-comun/base-datos')
let db = new BaseDatos(conf.dbHost, conf.dbUser, conf.dbPass, conf.dbPrefijo + '_chorro')
let crypto = require('crypto')
let respuestas = require('../../apis-comun/respuestas')
let modError = require('../../apis-comun/error')
let mCache = require('../../apis-comun/cache-mem')

let leerContenidosDb = (chorro, idioma) => {
  return new Promise((resolve, reject) => {
    let valores = chorro.split(',')
    let consulta = 'select id, ' + idioma + ' as textoHtml from contenidos where id in (' + '?,'.repeat(valores.length).slice(0, -1) + ')'
    db.consulta(consulta, valores).then(resultado => {
      let contenidos = {}
      for (let i = 0, tot = resultado.length; i < tot; i++) { // Convierte el array resultado en el objeto contenidos
        let contenido = resultado.pop()
        contenidos[contenido.id] = contenido.textoHtml
      }
      resolve(contenidos)
    }).catch(error => { reject(error) })
  })
}

module.exports = (req, res) => {
  let chorro
  if (req.method === 'GET') {
    chorro = require('url').parse(req.url, true).query.chorro
  } else if (req.method === 'POST') {
    chorro = JSON.parse(req.cuerpo).chorro
  } else {
    modError.responderError(405, 'El método no es válido', res)
    return
  }
  if (!chorro) {
    modError.responderError(400, 'No se recibió el parámetro esperado', res)
    return
  }
  let idioma = conf.setIdiomas.includes(req.headers['accept-language']) ? req.headers['accept-language'] : conf.setIdiomas[0]
  let idContenido = crypto.createHash('md5').update(idioma + chorro).digest('hex')
  let contenido = mCache.obtener(idContenido)
  if (contenido.disponible) {
    // contenido.datos.cache = 1;
    respuestas.responder(200, contenido.datos, res) // Responde la petición desde cache
  } else {
    leerContenidosDb(chorro, idioma).then(contenidos => { // Lee base de datos,
      // contenidos.cache = 0;
      respuestas.responder(200, contenidos, res) // responde y
      mCache.cachear(idContenido, contenidos).catch(error => { // cachea
        modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
      })
    }).catch(error => { modError.manejarError(error, 'Error recuperando datos', res) })
  }
}
