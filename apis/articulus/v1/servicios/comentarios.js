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
let respuestas = require('../../../apis-comun/respuestas')
let modError = require('../../../apis-comun/error')
let sanitizeHtml = require('sanitize-html')

module.exports = class Comentarios {
  constructor (req, res) {
    this.req = req
    this.res = res
    // Obtiene mensajes en el idioma del header
    this.msj = require('../idiomas/' + req.idioma)
  }

  procesarPeticion (aRuta) {
    if (this.req.method === 'GET') {
      this.listar(aRuta[5], aRuta[7])
    } else if (this.req.method === 'POST') {
      this.crear(aRuta[5], aRuta[7])
    } else {
      modError.responderError(405, this.msj.metodoNoValido, this.res)
    }
  }

  listar (blogBase, artiBase) {
    let consulta = `select id, idPadre, uid, autor, fecha, texto
    from blog_comentarios
    where idArti = (select id from blog_articulos where tituloUrl = ? and idBlog = (select id from blog_blogs where nombreUrl = ? limit 1) limit 1)
    order by fecha`
    db.consulta(consulta, [ artiBase, blogBase ])
      .then(res => {
        respuestas.responder(200, this.ordenarComentarios(res), this.res)
      })
      .catch(error => {
        modError.manejarError(error, this.msj.errRecupeDatos, this.res)
      })
  }

  crear (blogBase, artiBase) {
    let entrada
    try { entrada = JSON.parse(this.req.cuerpo) } catch (error) {
      modError.responderError(400, this.msj.cuerpoNoJson, this.res)
      return
    }
    let usr
    require('../../../apis-comun/usr-ok')(this.req).then(usuario => {
      usr = usuario
      // Obtiene ID de artículo
      let consulta = 'select id from blog_articulos where tituloUrl = ? and idBlog = (select id from blog_blogs where nombreUrl = ? limit 1) limit 1'
      return db.consulta(consulta, [ artiBase, blogBase ])
    })
      .then(res => {
        if (res.length === 0) throw new modError.ErrorEstado(this.msj.elArticuloNoExiste, 404)
        // Obtiene id de usuario del header
        let encoded = this.req.headers.authorization.split(' ')[1]

        let decoded = new Buffer(encoded, 'base64').toString('utf8')

        let aAux = decoded.split(':')
        let uid = parseInt(aAux[0], 10) || 0
        // Sanea
        let idPadre = parseInt(entrada.idPadre, 10) || 0
        let filtroHtml = { allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li'], allowedAttributes: [] }
        let texto = entrada.texto ? sanitizeHtml(entrada.texto, filtroHtml) : ''
        // Verifica
        if (uid === 0) throw new modError.ErrorEstado(this.msj.usrNoAutori, 403)
        if (texto === '') throw new modError.ErrorEstado(this.msj.faltaTexto, 400)
        // Guarda comentario
        let consulta = "insert into blog_comentarios set idArti = ?, idPadre = ?, uid = ?, autor = ?, email = '', texto = ?, fecha = now()"
        return db.consulta(consulta, [res[0].id, idPadre, uid, usr.nombre + ' ' + usr.apellido, texto])
      })
      .then(res => {
        // Recupera comentario guardado para respuesta
        return db.consulta('select id, uid, autor, texto, fecha from blog_comentarios where id = ? limit 1', [ res.insertId ])
      })
      .then(res => {
        // Devuelve el comentario guardado
        respuestas.responder(200, res[0], this.res)
      })
      .catch(error => {
        if (error.estado) {
          if (error.estado === 403) {
            modError.responderError(error.estado, this.msj.usrNoAutori, this.res)
          } else {
            modError.responderError(error.estado, error.message, this.res)
          }
        } else {
          modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
          modError.responderError(500, this.msj.errServidorVerLog, this.res)
        }
      })
  }

  // --------

  ordenarComentarios (aEntrada) {
    let aSalida = []
    /*
    // Procesa en orden cronológico descendente los comentarios de la rama principal
    for ( i = aEntrada.length - 1; i >= 0; i -- ) {
      if ( aEntrada[i].idPadre === 0 ) buscarHijos( aEntrada[i], 0 );
    }
    */
    // Procesa en orden cronológico ascendente los comentarios de la rama principal
    aEntrada.forEach(item => {
      if (item.idPadre === 0) buscarHijos(item, 0)
    })
    return aSalida
    //
    function buscarHijos (comen, rama) {
      comen.rama = rama
      aSalida.push(comen) // Guarda comentario en el array de salida
      aEntrada = aEntrada.filter(item => item.id !== comen.id) // Elimina comentario del array de entrada
      rama++
      aEntrada.forEach(item => { // Busca comentarios hijos
        if (item.idPadre === comen.id) buscarHijos(item, rama)
      })
    }
  }
}
