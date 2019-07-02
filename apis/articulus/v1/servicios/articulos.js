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
const urlApi = '/apis/articulus/v1/'

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
      let respuesta = {}; let idBlog; let fecha
      utiles.obtenerIdBlog(blogBase).then(id => {
        idBlog = id
        // Obtiene artículo
        let consulta = 'select id, uid, copete, titulo, tituloUrl, entradilla, texto, publicado, fechaCreado, fechaPublicado, imgPrincipal, auxTexto, auxFecha, auxEntero, auxDecimal, ' +
        '(select nombreAutor from blog_autores where uid = blog_articulos.uid limit 1) as autor ' +
        'from blog_articulos where tituloUrl = ? and idBlog = ? and publicado = 1 and fechaPublicado < now() limit 1'
        return db.consulta(consulta, [ nombreBase, idBlog ])
      }).then(arti => {
        if (arti.length === 0) {
          throw new modError.ErrorEstado(this.msj.elArticuloNoExiste, 404)
        }
        fecha = arti[0].fechaPublicado
        respuesta = arti[0]
        // Obtiene categorías del artículo
        let consulta = `select bc.id, bc.nombre, bc.nombreBase
        from blog_arti_cat as bac,
        blog_categorias as bc
        where bac.idArti = ? 
        and bac.idCat = bc.id
        order by nombre`
        return db.consulta(consulta, [ arti[0].id ])
      }).then(artiCat => {
        respuesta.categorias = []
        for (let i = 0, tot = artiCat.length; i < tot; i++) {
          respuesta.categorias.push(artiCat[i])
        }
        // Obtiene info del artículo siguiente
        let consulta = 'select titulo, tituloUrl from blog_articulos ' +
        'where idBlog = ? and publicado = 1 and fechaPublicado > ? and fechaPublicado < now() order by fechaPublicado limit 1'
        return db.consulta(consulta, [ idBlog, fecha ])
      }).then(artiSig => {
        respuesta.siguiente = {}
        if (artiSig.length === 1) {
          respuesta.siguiente.titulo = artiSig[0].titulo
          respuesta.siguiente.url = urlApi + 'blogs/' + blogBase + '/articulos/' + artiSig[0].tituloUrl
        } else {
          respuesta.siguiente.titulo = ''
          respuesta.siguiente.url = ''
        }
        // Obtiene info del artículo anterior
        let consulta = 'select titulo, tituloUrl from blog_articulos ' +
        'where idBlog = ? and publicado = 1 and fechaPublicado < ? and fechaPublicado < now() order by fechaPublicado desc limit 1'
        return db.consulta(consulta, [ idBlog, fecha ])
      }).then(artiAnt => {
        respuesta.anterior = {}
        if (artiAnt.length === 1) {
          respuesta.anterior.titulo = artiAnt[0].titulo
          respuesta.anterior.url = urlApi + 'blogs/' + blogBase + '/articulos/' + artiAnt[0].tituloUrl
        } else {
          respuesta.anterior.titulo = ''
          respuesta.anterior.url = ''
        }
        //
        resolve(respuesta)
        //
      }).catch(error => { reject(error) })
    })
  }

  listar (blogBase) {
    return new Promise((resolve, reject) => {
      let urlQuery = require('url').parse(this.req.url, true).query
      //
      let pag = parseInt(urlQuery.pag, 10) || 1
      pag = pag < 1 ? 1 : pag
      let porPag = parseInt(urlQuery.porPag, 10) || conf.artisResDefecto
      porPag = porPag > conf.maxArtisRespuesta ? conf.maxArtisRespuesta : porPag
      porPag = porPag < 1 ? 1 : porPag
      let orden = (urlQuery.orden && ['alfa', 'crono'].indexOf(urlQuery.orden) !== -1) ? urlQuery.orden : 'crono'
      let ordenDir = (urlQuery.ordenDir && ['asc', 'desc'].indexOf(urlQuery.ordenDir) !== -1) ? urlQuery.ordenDir : 'desc'
      let categoria = urlQuery.categoria || ''
      let busqueda = urlQuery.busqueda || ''
      //
      utiles.obtenerIdBlog(blogBase).then(idBlog => {
        // Construye consulta y array de parámetros
        let aParam = [ idBlog ]
        let consulta = 'select SQL_CALC_FOUND_ROWS id, tituloUrl, copete, titulo, fechaPublicado, imgPrincipal, entradilla, valoracion, auxTexto, auxFecha, auxEntero, auxDecimal, ' +
        '(select nombreAutor from blog_autores where uid = blog_articulos.uid limit 1) as autor ' +
        'from blog_articulos where idBlog = ? and publicado = 1 and fechaPublicado < now() '
        if (categoria) {
          aParam.push(categoria)
          consulta += 'and id in (select artiCat.idArti from blog_categorias as cat, blog_arti_cat as artiCat where cat.nombreBase = ? and artiCat.idCat = cat.id) '
        }
        if (busqueda) {
          aParam.push('%' + busqueda + '%')
          consulta += 'and titulo like ? '
        }
        if (orden === 'alfa') {
          consulta += 'order by titulo '
        } else {
          consulta += 'order by fechaPublicado '
        }
        consulta += ordenDir + ' '
        let desde = (pag - 1) * porPag
        consulta += 'limit ' + porPag + ' offset ' + desde
        //
        let respuesta = {}
        db.conexion().then(con => {
          con.query(consulta, aParam, (error, resArti) => {
            if (error) {
              con.release()
              reject(error)
            } else {
              // Array de artículos para responder
              respuesta.articulos = []
              for (let i = 0, tot = resArti.length; i < tot; i++) {
                respuesta.articulos.push(resArti[i])
              }
              // Calcula total de páginas
              con.query('select found_rows() as total', (error, resArti) => {
                if (error) {
                  con.release()
                  reject(error)
                } else {
                  con.release()
                  respuesta.paginacion = {}
                  respuesta.paginacion.total = Math.ceil(resArti[0].total / porPag)
                  let filtros = ''
                  filtros += porPag === conf.artisResDefecto ? '' : '&porPag=' + porPag
                  filtros += orden === 'crono' ? '' : '&orden=' + orden
                  filtros += ordenDir === 'desc' ? '' : '&ordenDir=' + ordenDir
                  filtros += categoria === '' ? '' : '&categoria=' + categoria
                  filtros += busqueda === '' ? '' : '&busqueda=' + busqueda
                  respuesta.paginacion.anterior = pag > 1
                    ? urlApi + 'blogs/' + blogBase + '/articulos?pag=' + (pag - 1) + filtros
                    : ''
                  respuesta.paginacion.siguiente = pag < respuesta.paginacion.total
                    ? urlApi + 'blogs/' + blogBase + '/articulos?pag=' + (pag + 1) + filtros
                    : ''
                  //
                  resolve(respuesta)
                  //
                }
              })
            }
          })
        }).catch(error => { reject(error) })
      }).catch(error => { reject(error) })
    })
  }
}
