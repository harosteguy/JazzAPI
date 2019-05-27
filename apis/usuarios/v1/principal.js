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
  let Usuario = require('./servicios')
  let usuario = new Usuario(req, res)
  let ruta = url.parse(req.url).pathname
  let aRuta = ruta.split('/')

  if (req.method === 'GET') {
    if (aRuta[4] === 'token') {
      usuario.token(req, res)
    } else if (aRuta[4] === 'autorizacion') {
      usuario.autorizacion(req, res)
    } else {
      usuario.obtener(req, res)
    }
  } else if (req.method === 'POST') {
    if (aRuta[4] === 'emailClave') {
      usuario.emailClave(req, res)
    } else if (aRuta[4] === 'preRegistro') {
      usuario.preRegistro(req, res)
    } else if (aRuta[4] === 'imagen') {
      usuario.imagen(req, res)
    } else {
      usuario.registro(req, res)
    }
  } else if (req.method === 'PUT') {
    if (aRuta[4] === 'nuevaClave') {
      usuario.nuevaClave(req, res)
    } else {
      usuario.actualizar(req, res)
    }
  } else if (req.method === 'DELETE') {
    usuario.eliminar(req, res)
  } else {
    modError.responderError(405, msj.metodoNoValido, res)
  }
}
