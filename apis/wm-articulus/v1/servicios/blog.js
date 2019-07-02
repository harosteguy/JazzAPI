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

let url = require('url')
let conf = require('../../../apis-comun/config')
let BaseDatos = require('../../../apis-comun/base-datos')
let db = new BaseDatos(conf.dbHost, conf.dbUserWm, conf.dbPassWm, conf.dbPrefijo + '_articulus')
let utiles = require('../comun/utiles')
let respuestas = require('../../../apis-comun/respuestas')
let modError = require('../../../apis-comun/error')
let sanitizeHtml = require('sanitize-html')
const urlApi = '/apis/wm-articulus/v1/'

module.exports = class Blog {
  constructor (req, res, usr) {
    this.req = req
    this.res = res
    this.usr = usr
    // Obtiene id de usuario del header
    let encoded = req.headers.authorization.split(' ')[1]
    let decoded = new Buffer(encoded, 'base64').toString('utf8')
    let aAux = decoded.split(':')
    this.usr.id = parseInt(aAux[0], 10)
    // Obtiene mensajes en el idioma del header
    this.msj = require('../idiomas/' + req.idioma)
  }

  procesarPeticion (aRuta) {
    if (this.usr.esAdmin === 1) {
      if (this.req.method === 'GET') {
        if (aRuta[5]) { // Nombre base del blog
          this.obtener(aRuta[5])
        } else {
          // Si la petición la hace el admin, listar() devolverá todos los blogs
          // sino devolverá los blogs del autor logueado
          this.listar()
        }
      } else if (this.req.method === 'POST') {
        this.crear()
      } else if (this.req.method === 'PUT') {
        this.actualizar(aRuta[5])
      } else if (this.req.method === 'DELETE') {
        this.borrar(aRuta[5])
      } else {
        modError.responderError(405, this.msj.metodoNoValido, this.res)
      }
    } else {
      if (this.req.method === 'GET') {
        this.listar()
      } else {
        modError.responderError(403, this.msj.usrNoAutori, this.res)
      }
    }
  }

  listar () {
    let incNumArticulos = url.parse(this.req.url, true).query.incNumArticulos
    let parametros = [] // Parámetros de la consulta
    let consulta = 'select id, nombre, nombreUrl'
    consulta += (incNumArticulos && parseInt(incNumArticulos, 10) === 1)
      ? ', (select count(*) from blog_articulos where idBlog = blog_blogs.id) as numArticulos ' // Incluye cantidad de artículos
      : ' '
    consulta += 'from blog_blogs '
    if (!this.usr.esAdmin) {
      consulta += 'where id in (select idBlog from blog_autor_blogs where uid = ?) ' // Blogs del autor
      parametros.push(this.usr.id)
    } else {
      consulta += ' ' // Todo para el admin
    }
    consulta += 'order by nombre'
    db.consulta(consulta, parametros).then(resultado => {
      let blogs = []
      for (let i = 0, tot = resultado.length; i < tot; i++) {
        blogs.push(resultado[i])
      }
      respuestas.responder(200, blogs, this.res)
    }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
  }

  obtener (nombreBase) {
    let incNumArticulos = url.parse(this.req.url, true).query.incNumArticulos
    let consulta = 'select id, nombre, nombreUrl, descripcion'
    consulta += (incNumArticulos && parseInt(incNumArticulos, 10) === 1)
      ? ', (select count(*) from blog_articulos where idBlog = blog_blogs.id) as numArticulos ' // Incluye cantidad de artículos
      : ' '
    consulta += 'from blog_blogs where nombreUrl = ? limit 1'
    db.consulta(consulta, [nombreBase]).then(resultado => {
      if (resultado.length === 1) {
        respuestas.responder(200, resultado[0], this.res)
      } else {
        throw new modError.ErrorEstado(this.msj.elBlogNoExiste, 404)
      }
    }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
  }

  crear () {
    let datos
    this.verificarDatos().then(dat => { // Extrae datos del cuerpo de la petición, los sanea y verifica
      datos = dat
      return db.consulta('insert into blog_blogs set ?', datos)
    }).then(() => {
      utiles.limpiarCache()
      respuestas.responder(200, { url: urlApi + 'blogs/' + datos.nombreUrl }, this.res)
    }).catch(error => {
      if (error.errno === 1062) modError.responderError(409, this.msj.elBlogYaExiste, this.res)
      else modError.manejarError(error, this.msj.problemaCreandoBlog, this.res)
    })
  }

  actualizar (nombreUrl) {
    let datos
    this.verificarDatos().then(dat => { // Extrae datos del cuerpo de la petición, los sanea y verifica
      datos = dat
      return db.consulta('update blog_blogs set ? where nombreUrl = ? limit 1', [ datos, nombreUrl ])
    }).then(resUpdate => {
      if (resUpdate.affectedRows === 1) {
        utiles.limpiarCache()
        respuestas.responder(200, { url: urlApi + 'blogs/' + datos.nombreUrl }, this.res)
      } else {
        throw new modError.ErrorEstado(this.msj.elBlogNoExiste, 404)
      }
    }).catch(error => { modError.manejarError(error, this.msj.problemaActualiBlog, this.res) })
  }

  borrar (nombreUrl) {
    nombreUrl = utiles.cadena2url(nombreUrl).toLowerCase() // Sanea
    db.consulta('delete from blog_blogs where nombreUrl = ? limit 1', [nombreUrl]).then(resultado => {
      if (resultado.affectedRows === 1) {
        utiles.limpiarCache()
        respuestas.responder(204, {}, this.res)
      } else {
        throw new modError.ErrorEstado(this.msj.elBlogNoExiste, 404)
      }
    }).catch(error => { modError.manejarError(error, this.msj.problemaBorrandoBlog, this.res) })
  }

  // -----

  sanear (datos) {
    datos.nombre = datos.nombre || ''
    datos.descripcion = datos.descripcion || ''
    datos.nombre = sanitizeHtml(
      datos.nombre,
      {
        allowedTags: [],
        allowedAttributes: [],
        textFilter: texto => {
          return texto.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
        }
      }
    )
    datos.nombreUrl = utiles.cadena2url(datos.nombre)
    datos.descripcion = sanitizeHtml(
      datos.descripcion,
      {
        allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
          'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
          'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'oembed', 'figure', 'img'
        ],
        allowedAttributes: {
          a: [ 'href', 'name', 'target' ],
          img: [ 'src', 'alt' ],
          figure: [ 'class' ],
          div: [ 'data-oembed-url', 'style' ],
          oembed: [ 'url' ],
          iframe: [ 'src', 'style', 'frameborder', 'allow', 'allowfullscreen' ]
        },
        selfClosing: [ 'img', 'br', 'hr' ],
        allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
        allowProtocolRelative: true
      }
    )
    return datos
  }

  verificarDatos () {
    return new Promise((resolve, reject) => {
      let datos = {}
      try { datos = JSON.parse(this.req.cuerpo) } catch (error) {
        reject(new modError.ErrorEstado(this.msj.cuerpoNoJson, 400))
        return
      }
      datos = this.sanear(datos)
      if (datos.nombre === '' || datos.nombreUrl === '') {
        reject(new modError.ErrorEstado(this.msj.errorNombreBlog, 400))
        return
      }
      resolve(datos)
    })
  }
}
