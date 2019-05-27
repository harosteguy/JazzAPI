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
let db = new BaseDatos(conf.dbHost, conf.dbUserWm, conf.dbPassWm, 'jazz_articulus')
let utiles = require('../comun/utiles')
let respuestas = require('../../../apis-comun/respuestas')
let modError = require('../../../apis-comun/error')
let sanitizeHtml = require('sanitize-html')

module.exports = class Autor {
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
        if (aRuta[5]) { // uid
          this.obtener(aRuta[5])
        } else {
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
        this.autorActivo()
      } else {
        modError.responderError(405, this.msj.metodoNoValido, this.res)
      }
    }
  }

  autorActivo () {
    let consulta = 'select activo from blog_autores where uid = ? limit 1'
    db.consulta(consulta, [ this.usr.id ]).then(autor => {
      if (autor.length === 1 && autor[0].activo === 1) {
        respuestas.responder(200, { autorActivo: true }, this.req.headers['accept-encoding'], this.res)
      } else {
        respuestas.responder(200, { autorActivo: false }, this.req.headers['accept-encoding'], this.res)
      }
    }).catch(error => {
      modError.manejarError(error, this.msj.errServidorVerLog, this.res)
    })
  }

  listar () {
    let urlQuery = require('url').parse(this.req.url, true).query
    let blogBase = urlQuery.blogBase || ''
    //
    let consulta = `select uid, nombreAutor, autorBase, nombreUsuario, descripcion, activo,
    (select count(*) from blog_articulos where uid = blog_autores.uid) as nroArticulos
    from blog_autores
    where true `
    //
    let aParam = []
    if (blogBase !== '') {
      consulta += `and uid in (select uid from blog_autor_blogs where idBlog = (select id from blog_blogs where nombreUrl = ? limit 1) ) `
      aParam.push(blogBase)
    }
    //
    consulta += `order by nombreAutor`

    let oAutores = {}; let autor
    db.consulta(consulta, aParam).then(resultado => {
      while ((autor = resultado.shift())) { // Autores en oAutores
        oAutores['uid' + autor.uid] = {}
        oAutores['uid' + autor.uid].uid = autor.uid
        oAutores['uid' + autor.uid].nombreAutor = autor.nombreAutor
        oAutores['uid' + autor.uid].autorBase = autor.autorBase
        oAutores['uid' + autor.uid].nombreUsuario = autor.nombreUsuario
        oAutores['uid' + autor.uid].descripcion = autor.descripcion
        oAutores['uid' + autor.uid].activo = autor.activo
        oAutores['uid' + autor.uid].nroArticulos = autor.nroArticulos
      }

      let aAutores = Object.keys(oAutores).map((clave) => oAutores[ clave ]) // Convierte en array para respuesta
      respuestas.responder(200, aAutores, this.req.headers['accept-encoding'], this.res)
    }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
  }

  crear () {
    let datos
    try { datos = JSON.parse(this.req.cuerpo) } catch (error) {
      modError.responderError(400, this.msj.cuerpoNoJson, this.res)
      return
    }
    let autor, aBlogs
    this.verificarDatos(datos).then(aut => {
      autor = aut // Pone aut en autor para que sea visible en el siguiente then
      aBlogs = autor.blogs // Reserva el array aBlogs
      let { blogs, ...autorDb } = autor // y lo quita del objeto autor
      return db.consulta('insert into blog_autores set ?', autorDb) // Guarda autor
    }).then(() => {
      if (aBlogs.length > 0) { // Hay blogs del autor
        let aAutorBlog = [] // Array de registros a guardar
        for (let i = 0; i < aBlogs.length; i++) {
          aAutorBlog.push([ autor.uid, aBlogs[i] ])
        }
        db.consulta('insert into blog_autor_blogs (uid, idBlog) values ?', [aAutorBlog])
      }
      respuestas.responder(201, {}, this.req.headers['accept-encoding'], this.res)
      utiles.limpiarCache()
    }).catch(error => {
      if (error.errno === 1062) modError.responderError(409, this.msj.elAutorYaExiste, this.res)
      else modError.manejarError(error, this.msj.problemaCreandoAutor, this.res)
    })
  }

  obtener (uid) {
    uid = parseInt(uid, 10) || 0
    if (uid === 0) {
      modError.responderError(400, this.msj.errorUid, this.res)
      return
    }
    let consulta = 'select *, (select count(*) from blog_articulos where uid = blog_autores.uid) as nroArticulos from blog_autores where uid = ? limit 1'
    let oAutor
    db.consulta(consulta, [ uid ])
      .then(autor => {
        if (autor.length === 0) {
          throw new modError.ErrorEstado(this.msj.elAutorNoExiste, 404)
        }
        oAutor = {}
        oAutor.uid = autor[0].uid
        oAutor.nombreAutor = autor[0].nombreAutor
        oAutor.autorBase = autor[0].autorBase
        oAutor.nombreUsuario = autor[0].nombreUsuario
        oAutor.descripcion = autor[0].descripcion
        oAutor.activo = autor[0].activo
        oAutor.nroArticulos = autor[0].nroArticulos
        oAutor.blogs = []
        //
        return db.consulta('select idBlog from blog_autor_blogs where uid = ?', [ uid ])
      }).then(blogs => {
        let blog
        while ((blog = blogs.shift())) {
          oAutor.blogs.push(blog.idBlog)
        }
        respuestas.responder(200, oAutor, this.req.headers['accept-encoding'], this.res)
      }).catch(error => { modError.manejarError(error, this.msj.errRecupeDatos, this.res) })
  }

  actualizar (uid) {
    let datos
    try {
      datos = JSON.parse(this.req.cuerpo) // Parsea el cuerpo de la petición
    } catch (error) {
      modError.responderError(400, this.msj.cuerpoNoJson, this.res)
      return
    }
    let aBlogs
    datos.uid = uid // Se agrega el uid para sanear
    this.verificarDatos(datos).then(autor => { // Saneo y verificaciones
      aBlogs = autor.blogs // Reserva el array aBlogs
      uid = autor.uid // y el uid saneado
      delete autor.blogs // Se quita blogs y uid para la consulta
      delete autor.uid
      return db.consulta('update blog_autores set ? where uid = ? limit 1', [ autor, uid ]) // Guarda autor
    }).then(() => {
      if (aBlogs.length > 0) { // Hay blogs del autor
        let listaIds = '(' + aBlogs.join(',') + ')' // Lista de blogs para la consulta
        // Elimina blogs que no están en la lista
        return db.consulta('delete from blog_autor_blogs where uid = ? and idBlog not in ' + listaIds, [ uid ])
      } else {
        // Elimina blogs del autor
        return db.consulta('delete from blog_autor_blogs where uid = ?', [ uid ])
      }
    }).then(() => {
      if (aBlogs.length > 0) { // Hay blogs del autor
        // Agrega al autor los blogs que le faltan del array
        let aAutorBlog = [] // Array de registros a guardar
        for (let i = 0; i < aBlogs.length; i++) {
          aAutorBlog.push([ uid, aBlogs[i] ])
        }
        return db.consulta('replace into blog_autor_blogs (uid, idBlog) values ?', [aAutorBlog])
      }
    }).then(() => {
      utiles.limpiarCache()
      respuestas.responder(200, {}, this.req.headers['accept-encoding'], this.res)
    }).catch(error => { modError.manejarError(error, this.msj.problemaActualiAutor, this.res) })
  }

  borrar (uid) {
    uid = Number.isInteger(Number.parseInt(uid, 10)) ? Number.parseInt(uid, 10) : 0
    db.consulta('delete from blog_autores where uid = ? limit 1', [ uid ]).then(resultado => {
      if (resultado.affectedRows === 1) {
        utiles.limpiarCache()
        respuestas.responder(204, {}, this.req.headers['accept-encoding'], this.res)
      } else {
        throw new modError.ErrorEstado(this.msj.elAutorNoExiste, 404)
      }
    }).catch(error => { modError.manejarError(error, this.msj.problemaBorrandoAutor, this.res) })
  }

  // -----

  sanear (autor) {
    let oFiltroTexto = { // sanitizeHtml
      allowedTags: [],
      allowedAttributes: [],
      textFilter: texto => { return texto.replace(/&quot;/g, '"').replace(/&amp;/g, '&') }
    }
    let oFiltroHtml = {
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
    autor.uid = parseInt(autor.uid, 10) || 0
    autor.nombreAutor = autor.nombreAutor ? sanitizeHtml(autor.nombreAutor, oFiltroTexto) : ''
    autor.autorBase = utiles.cadena2url(autor.nombreAutor)
    autor.nombreUsuario = autor.nombreUsuario ? sanitizeHtml(autor.nombreUsuario, oFiltroTexto) : ''
    autor.descripcion = autor.descripcion ? sanitizeHtml(autor.descripcion, oFiltroHtml) : ''
    autor.activo = parseInt(autor.activo, 10) === 1 ? 1 : 0
    if (Array.isArray(autor.blogs)) {
      let i = autor.blogs.length
      while (i--) {
        let idBlog = Number.parseInt(autor.blogs[i], 10)
        if (Number.isInteger(idBlog)) {
          autor.blogs[i] = idBlog
        } else {
          autor.blogs.splice(i, 1)
        }
      }
    } else {
      autor.blogs = []
    }
    return autor
  }

  verificarDatos (datos) {
    return new Promise((resolve, reject) => {
      // Sanea
      datos = this.sanear(datos)
      // Verifica
      if (datos.uid === 0) {
        reject(new modError.ErrorEstado(this.msj.errorUid, 400)); return
      }
      if (datos.nombreAutor === '') {
        reject(new modError.ErrorEstado(this.msj.faltaFirmaAutor, 400)); return
      }
      if (datos.autorBase === '') {
        reject(new modError.ErrorEstado(this.msj.errorFirmaAutor, 400)); return
      }
      if (datos.nombreUsuario === '') {
        reject(new modError.ErrorEstado(this.msj.faltaNombreUsr, 400)); return
      }
      resolve(datos)
    })
  }
}
