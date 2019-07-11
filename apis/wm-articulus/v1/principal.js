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
let modError = require('../../apis-comun/error')

// Función única que rutea a los servicios de la API
module.exports = (req, res) => {
  let msj = require('./idiomas/' + req.idioma)
  let ruta = url.parse(req.url).pathname
  let aRuta = ruta.split('/')

  require('../../apis-comun/usr-ok')(req).then(usuario => {
    if (aRuta[4] === 'blogs') {
      if (!aRuta[6]) {
        // /apis/wm-articulus/v1/blogs
        // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>
        let Blog = require('./servicios/blog')

        let blog = new Blog(req, res, usuario)
        blog.procesarPeticion(aRuta)
      } else if (aRuta[6] === 'articulos') {
        if (!aRuta[8]) {
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>
          let Articulos = require('./servicios/articulo')

          let articulos = new Articulos(req, res, usuario)
          articulos.procesarPeticion(aRuta)
        } else if (aRuta[8] === 'comentarios') {
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/comentarios/<idComentario>

          // PENDIENTE

        } else if (aRuta[8] === 'imagenes') {
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/articulos/<nombreBaseArticulo>/imagenes
          let Imagenes = require('./servicios/imagen')

          let imagenes = new Imagenes(req, res, usuario)
          imagenes.procesarPeticion(aRuta)
        } else {
          // El servicio no existe
          modError.responderError(400, msj.servicioNoValido, res)
        }
      } else if (aRuta[6] === 'categorias') {
        if (!aRuta[8]) {
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>
          let Categorias = require('./servicios/categoria')

          let categorias = new Categorias(req, res, usuario)
          categorias.procesarPeticion(aRuta)
        } else if (aRuta[8] === 'imagenes') {
          // /apis/wm-articulus/v1/blogs/<nombreBaseBlog>/categorias/<nombreBaseCategoria>/imagenes
          let Imagenes = require('./servicios/imagen')

          let imagenes = new Imagenes(req, res, usuario)
          imagenes.procesarPeticion(aRuta)
        } else {
          modError.responderError(400, msj.servicioNoValido, res)
        }
      } else {
        modError.responderError(400, msj.servicioNoValido, res)
      }
    } else if (aRuta[4] === 'autores') {
      // /apis/wm-articulus/v1/autores
      let Autores = require('./servicios/autor')

      let autores = new Autores(req, res, usuario)
      autores.procesarPeticion(aRuta)
    } else {
      modError.responderError(400, msj.servicioNoValido, res)
    }
  })
    .catch(error => {
      // Elimina imagen temporal si se usó el servicio imagenes
      if (aRuta[8] === 'imagenes') {
        let cuerpo
        try {
          cuerpo = JSON.parse(req.cuerpo) // Obtiene info del archivo
        } catch (err) { cuerpo = false }
        if (cuerpo) {
          require('fs').unlink('tmp/' + cuerpo.archivo.nombreTmp, error => {
            if (error) modError.logError(error)
          })
        }
      }
      //
      if (error.estado) {
        if (error.estado === 403) {
          modError.responderError(error.estado, msj.usrNoAutori, res)
        } else {
          modError.responderError(error.estado, error.message, res)
        }
      } else {
        modError.logError(error.name + ' ' + error.message + '\n' + error.stack)
        modError.responderError(500, msj.errServidorVerLog, res)
      }
    })
}
