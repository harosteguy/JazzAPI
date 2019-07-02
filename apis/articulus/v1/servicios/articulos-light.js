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
let db = new BaseDatos(conf.dbHost, conf.dbUser, conf.dbPass, 'jazz_articulus')
let mCache = require('../../../apis-comun/cache-mem')
let utiles = require('../comun/utiles')
let respuestas = require('../../../apis-comun/respuestas')
let modError = require('../../../apis-comun/error')

module.exports = class Articulo {
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
        contenido.datos.cache = 1
        respuestas.responder(200, contenido.datos, this.res)
      } else {
        // Responde petición desde base de datos
        if (aRuta[7]) { // aRuta[7] Nombre base del artículo
          this.obtener(aRuta[5], aRuta[7]).then(respuesta => { // aRuta[5] Nombre base del blog
            respuesta.cache = 0
            respuestas.responder(200, respuesta, this.res)
            mCache.cachear(idContenido, respuesta).catch(error => { // Cachea la respuesta
              modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
            })
          }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
        } else {
          this.listar(aRuta[5]).then(respuesta => {
            respuesta.cache = 0
            respuestas.responder(200, respuesta, this.res)
            mCache.cachear(idContenido, respuesta).catch(error => {
              modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
            })
          }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
        }
      }
    } else {
      modError.responderError(405, this.msj.metodoNoValido, this.res)
    }
  }

  obtener (blogBase, nombreBase) {
    return new Promise((resolve, reject) => {
      utiles.obtenerIdBlog(blogBase).then(idBlog => {
        let consulta = 'select id, uid, copete, titulo, tituloUrl, entradilla, texto, publicado, fechaCreado, fechaPublicado, imgPrincipal, auxTexto, auxFecha, auxEntero, auxDecimal ' +
        'from blog_articulos where tituloUrl = ? and idBlog = ? and publicado = 1 and fechaPublicado < now() limit 1'
        return db.consulta(consulta, [ nombreBase, idBlog ])
      }).then(arti => {
        if (arti.length === 0) {
          throw new modError.ErrorEstado(this.msj.elArticuloNoExiste, 404)
        }
        resolve(arti[0])
      }).catch(error => { reject(error) })
    })
  }

  listar (blogBase) {
    return new Promise((resolve, reject) => {
      let urlQuery = require('url').parse(this.req.url, true).query
      //
      let orden = (urlQuery.orden && ['alfa', 'crono'].indexOf(urlQuery.orden) !== -1) ? urlQuery.orden : 'crono'
      let ordenDir = (urlQuery.ordenDir && ['asc', 'desc'].indexOf(urlQuery.ordenDir) !== -1) ? urlQuery.ordenDir : 'desc'
      let maxArticulos = parseInt(urlQuery.maxArticulos, 10) || conf.artisResDefecto
      maxArticulos = maxArticulos > conf.maxArtisRespuesta ? conf.maxArtisRespuesta : maxArticulos
      maxArticulos = maxArticulos < 1 ? 1 : maxArticulos
      //
      utiles.obtenerIdBlog(blogBase).then(idBlog => {
        // Construye y ejecuta la consulta
        let consulta = 'select id, tituloUrl, copete, titulo, fechaPublicado, imgPrincipal, entradilla, auxTexto, auxFecha, auxEntero, auxDecimal ' +
        'from blog_articulos where idBlog = ? and publicado = 1 and fechaPublicado < now() '
        consulta += orden === 'alfa' ? 'order by titulo ' : 'order by fechaPublicado '
        consulta += ordenDir
        consulta += ' limit ' + maxArticulos
        return db.consulta(consulta, [ idBlog ])
      }).then(resArti => {
        resolve({ articulos: resArti })
      }).catch(error => { reject(error) })
    })
  }
}
