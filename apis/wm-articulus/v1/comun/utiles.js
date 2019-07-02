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
let db = new BaseDatos(conf.dbHost, conf.dbUserWm, conf.dbPassWm, conf.dbPrefijo + '_articulus')

module.exports = {
  cadena2url: (cadena) => {
    let cambiaesto = ' ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøüùúûýýþÿ'
    let poresto = '-aaaaaaaceeeeiiiidnoooooouuuuybsaaaaaaaceeeeiiiidnoooooouuuuyyby'
    let temp = cadena.replace(/[\sÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøüùúûýýþÿ]/g, function (coincidencia) {
      return poresto[ cambiaesto.indexOf(coincidencia) ]
    })
    return temp.toLowerCase().replace(/[^-a-z0-9]/g, '')
  },
  ahoraDb () {
    let d = new Date()
    return d.getFullYear() + '-' + module.exports.padIzquierdo(d.getMonth() + 1, '00') + '-' + module.exports.padIzquierdo(d.getDate(), '00') + ' ' +
    module.exports.padIzquierdo(d.getHours(), '00') + ':' + module.exports.padIzquierdo(d.getMinutes(), '00') + ':' + module.exports.padIzquierdo(d.getSeconds(), '00')
  },
  esFecha: (fecha) => { // 2017-12-31
    let f = fecha.split('-')
    if (f.length !== 3) {
      return false
    }
    let ani = parseInt(f[0], 10) || 0
    let mes = parseInt(f[1], 10) || 0
    let dia = parseInt(f[2], 10) || 0
    if (dia && mes && ani) {
      let meses31 = [ 1, 3, 5, 7, 8, 10, 12 ] // Meses con 31 días
      let meses30 = [ 4, 6, 9, 11 ] // con 30
      let meses28 = [ 2 ] // con 28 o 29 si es bisiesto
      let bisiesto = ((ani % 4 === 0) && (ani % 100 !== 0)) || (ani % 400 === 0)
      return (meses31.indexOf(mes) !== -1 && dia <= 31) ||
        (meses30.indexOf(mes) !== -1 && dia <= 30) ||
        (meses28.indexOf(mes) !== -1 && dia <= 28) ||
        (meses28.indexOf(mes) !== -1 && dia <= 29 && bisiesto)
    } else {
      return false
    }
  },
  esHora: (hora) => { // 04:20:44
    let h = hora.split(':')
    if (h.length !== 3) {
      return false
    }
    let hor = parseInt(h[0], 10) || 0
    let min = parseInt(h[1], 10) || 0
    let seg = parseInt(h[2], 10) || 0
    if (h[0] == hor && h[1] == min && h[2] == seg) { // Verifica que la conversión a entero no haya modificado valores. ** NO USAR ===
      return hor >= 0 && hor < 24 && min >= 0 && min < 60 && seg >= 0 && seg < 60
    } else {
      return false
    }
  },
  esFechaHora: (fechaHora) => { // 2017-12-31 04:20:44
    if (fechaHora) {
      let fh = fechaHora.split(' ')
      return fh[0] && module.exports.esFecha(fh[0]) && fh[1] && module.exports.esHora(fh[1])
    } else {
      return false
    }
  },
  limpiarCache: () => {
    global.cmsCache = {} // Purga cache
  },
  padIzquierdo: (cadena, relleno) => {
    return String(relleno + cadena).slice(-relleno.length)
  },
  obtenerIdBlog (blogBase) {
    return new Promise((resolve, reject) => {
      db.consulta('select id from blog_blogs where nombreUrl = ? limit 1', [ blogBase ]).then(resultado => {
        if (resultado.length === 1) resolve(resultado[0].id)
        else reject(new Error('Error en utiles.js obtenerIdBlog( blogBase ): El blog no existe.'))
      }).catch(error => { reject(error) })
    })
  }
}
