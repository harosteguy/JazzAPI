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

let http = require('http')

let modError = require('./error')

module.exports = req => {
  // Verifica credenciales con la API de usuario
  return new Promise((resolve, reject) => {
    if (req.headers.authorization) {
      const opciones = {
        hostname: 'localhost',
        port: 6666,
        path: '/apis/usuarios/v1/autorizacion',
        method: 'GET',
        headers: {
          'Authorization': req.headers.authorization,
          'User-Agent': 'API WM-Articulus'
        }
      }
      http.get(opciones, respuesta => {
        let cuerpo = ''
        respuesta.on('data', (fragmento) => { cuerpo += fragmento })
        respuesta.on('end', () => {
          try {
            const usuario = JSON.parse(cuerpo)
            if (usuario.error) {
              reject(new modError.ErrorEstado('Usuario no autorizado.', 403))
            } else {
              resolve(usuario)
            }
          } catch (error) {
            reject(new modError.ErrorEstado('Usuario no autorizado.', 403))
          }
        })
      }).on('error', error => {
        reject(new modError.ErrorEstado('Usuario no autorizado.', 403))
      })
    } else {
      reject(new modError.ErrorEstado('Usuario no autorizado.', 403))
    }
  })
}
