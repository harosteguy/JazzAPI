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

let fs = require('fs')
let zlib = require('zlib')

module.exports = (archivo, texto) => {
  let rutaArchivo = 'logs/' + archivo // Agrega ruta al archivo
  // Guarda informe
  fs.appendFile(rutaArchivo + '.log', texto, { 'encoding': 'utf-8', 'mode': 0o644 }, error => {
    if (error) {
      console.log(error)
      return
    }
    fs.stat(rutaArchivo + '.log', (error, estado) => {
      if (error) {
        console.log(error)
        return
      }
      if (estado.size > 500000) {
        // Nombre del archivo comprimido
        let f = new Date()
        let unixTime = f.getTime()
        let archivoComprimido = rutaArchivo + '-' + unixTime + '.log.gz'
        // Guarda el archivo comprimido
        let gzip = zlib.createGzip()
        let entrada = fs.createReadStream(rutaArchivo + '.log')
        let salida = fs.createWriteStream(archivoComprimido)
        entrada.pipe(gzip).pipe(salida)
        salida.on('close', () => {
          // Una vez guardado trunca el archivo
          fs.truncateSync(rutaArchivo + '.log', 0)
        })
        //
        // Si hay más de 5 logs archivados elimina el más viejo
        fs.readdir('logs/', (error, archivos) => { // Lee los archivos de la carpeta
          if (error) console.error(error)
          // Separa en un array los archivos .gz cuyos nombres comienzan igual al archivo .log
          let archivosComprimidos = []
          for (let i = 0, tot = archivos.length; i < tot; i++) {
            if (archivos[i].substr(0, archivo.length) === archivo && archivos[i].substr(-3) === '.gz') {
              archivosComprimidos.push(archivos[i])
            }
          }
          if (archivosComprimidos.length > 5) {
            // Ordena el array y elimina el archivo más viejo
            archivosComprimidos.sort()
            fs.unlink('logs/' + archivosComprimidos.shift(), () => { })
          }
        })
      }
    })
  })
}
