# JazzAPI

![GitHub package.json version](https://img.shields.io/github/package-json/v/harosteguy/JazzAPI.svg)&nbsp;![GitHub top language](https://img.shields.io/github/languages/top/harosteguy/JazzAPI.svg?color=green)&nbsp;![David](https://img.shields.io/david/harosteguy/JazzAPI.svg)&nbsp;![GitHub last commit](https://img.shields.io/github/last-commit/harosteguy/JazzAPI.svg)&nbsp;[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

JazzAPI es un grupo de APIs RESTful desarrolladas en Node.js para servir y manejar contenidos de aplicaciones.

- **API Usuarios:** Gestiona usuarios. Registro, login, imagen, autorización, contraseñas.
- **API WM-Chorro:** Gestiona contenidos en diferentes idiomas.
- **API Chorro:** Sirve contenidos en un idioma específico. Usa cache en memoria para la entrega de contenidos.
- **API WM-Articulus:** Gestiona contenidos indexados estilo blog. Secciones, artículos, categorías, autores, imágenes.
- **API Articulus:** Sirve contenidos indexados estilo blog. Usa cache en memoria para la entrega de contenidos. Incluye sistema de comentarios para usuarios registrados.
- **API Contacto:** Envía correo electrónico con mensaje de un usuario.

## Tabla de contenidos

- [Pre requisitos](#pre-requisitos)
- [Instalación](#instalación)
	- [APIs](#apis)
	- [Bases de datos](#bases-de-datos)
- [Configuración](#configuración)
- [Uso](#uso)
- [Licencia](#licencia)

---
## Pre requisitos

- Servidor MySQL instalado con acceso root para instalar las bases de datos y crear los usuarios. <https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/>
- Node.js instalado para ejecutar el servidor de las APIs. <https://nodejs.org>
- NPM para la instalación de las dependencias en package.json. <https://www.npmjs.com/get-npm>
- ImageMagick instalado para el manejo de imágenes por parte de las APIs. <https://www.imagemagick.org>

---
## Instalación

### APIs

Si tiene instalado git <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git> abra un terminal en la carpeta donde desea hacer la instalación y clone el repositorio con el siguiente comando:
`git clone https://github.com/harosteguy/JazzAPI.git`

También puede descargar JazzAPI en <https://github.com/harosteguy/JazzAPI/archive/master.zip> y descomprimir el archivo en la carpeta deseada.

Para instalar las dependencias abra un terminal en la carpeta JazzAPI, donde se encuentra el archivo package.json y ejecute el siguiente comando:
`npm install`

Durante la instalación se crea la carpeta "logs" donde se creará acceso.log y error.log; también se crea la carpeta "tmp" para almacenar temporalmente los archivos subidos.

### Bases de datos
En la carpeta JazzAPI/db se encuentran los siguientes archivos para crear las bases de datos y usuarios en el servidor MySQL:

- **cms_articulus.sql**
Base de datos para la API Articulus.
- **cms_chorro.sql**
Base de datos para la API Chorro.
- **cms_chorro_data.sql (opcional)**
Datos para la API Chorro.
- **cms_usuarios.sql**
Base de datos para la API Usuarios.
- **cms_usuarios_data.sql**
En cms_usuarios_data.sql se encuentra el registro del usuario administrador de las APIs.
Se debe poner un correo electrónico real para uso posterior.
La contraseña por defecto es 'qwerty'. Se puede cambiar en cualquier momento usando la [API Usuarios](#api-usuarios)
- **usuarios.sql**
En usuarios.sql se crean dos usuarios para las bases de datos y se les otorga los privilegios necesarios.
- **usuarios_claves.sql**
En usuarios_claves.sql se crean las contraseñas para los dos usuarios de las bases de datos.
Se deben poner dos contraseñas seguras. Las mismas contraseñas se deben poner luego en el archivo de configuración de las APIs.

Luego de editar los archivos, para hacer la instalación, use en un terminal el siguiente comando con cada archivo.
`mysql -u root -p < cms_articulus.sql`

---
## Configuración

En la carpeta JazzAPI/apis/apis-comun se encuentra el archivo config.js donde se pueden setear todos los valores configurables del sistema.

```javascript
module.exports = {
	marca: 'Tu Marca',
	urlBase: 'https://tumarca.com',
	// Idiomas de contenidos (el primero es idioma por defecto)
	// Debe reflejar los campos de idioma de la tabla contenidos en la base de datos cms_chorro
	setIdiomas: ['es', 'en'],
	// Idiomas en los que responden las apis (aviso, mensajes de error, etc.) de acuerdo 
	// con la cabecera accept-language de las peticiones
	// Debe mantener una coherencia con los archivos de idioma de las APIs
	setIdiomasApis: ['es', 'en'],
	// Host del servidor MySQL
	dbHost: 'localhost',
	// Usuario MySQL
	dbUser: 'cms_usr',
	dbPass: 'Contraseña de usuario aquí',
	// Usuario MySQL para tareas de gestión
	dbUserWm: 'cms_wm',
	dbPassWm: 'Contraseña de webmaster aquí',
	// Puerto donde se sirven las APIs
	puertoHttp: 6666,
	// Cantidad de artículos en las respuestas de la API Articulus
	maxArtisRespuesta: 100,
	artisResDefecto: 20,
	// Carpeta para las imágenes de la aplicación
	dirBaseImagen: require('path').join(__dirname, '../../../JazzApp/app/publico/img/'),
	// URL para las imágenes de la aplicación
	urlBaseImagen: '/img/',
	// Set de imágenes que se crea partiendo de cada imagen subida para artículos, categorías...
	setDeImagenes: [
		{ ancho: 480, alto: 270, sufijo: '-480' },
		{ ancho: 960, alto: 540, sufijo: '-960' },
		{ ancho: 1280, alto: 720, sufijo: '-1280' },
		{ ancho: 1920, alto: 1080, sufijo: '-1920' },
		{ ancho: 960, alto: 540, sufijo: '' }
	],
	// Imágenes para cabeza y pie de emails. 600px de ancho.
	imgMailHtmlTop: 'https://tumarca.com/interfaz/img/imgMailHtmlCabeza.jpg',
	imgMailHtmlBottom: 'https://tumarca.com/interfaz/img/imgMailHtmlPie.jpg',
	// API Contacto y Usuarios. Ver cómo configurar gmail en https://nodemailer.com/usage/using-gmail/
	gmailEmisor: 'correo.emisor@gmail.com',
	gmailPass: 'contraseña de correo.emisor@gmail.com',
	correoReceptor: 'contacto@qwertyu.iop',
}
```

---
## Uso

Abrir un terminal en la carpeta JazzAPI y ejecutar:
```
node index.js
```

En el archivo [EJEMPLOS.md](EJEMPLOS.md) se pueden ver todos los ejemplos de uso.

---
## Licencia

JazzAPI es un conjunto de APIs RESTful desarrolladas en Node.js para servir y manejar contenidos de aplicaciones.
Copyright (C) 2019 by Guillermo Harosteguy <harosteguy@gmail.com>

Este programa es software libre: puede redistribuirlo y/o modificarlo bajo
los términos de la Licencia General Pública de GNU publicada por la Free
Software Foundation, ya sea la versión 3 de la Licencia, o (a su elección)
cualquier versión posterior.

Este programa se distribuye con la esperanza de que sea útil pero SIN
NINGUNA GARANTÍA; incluso sin la garantía implícita de MERCANTIBILIDAD o
CALIFICADA PARA UN PROPÓSITO EN PARTICULAR. Vea la Licencia General Pública
de GNU para más detalles.

Usted ha debido de recibir una copia de la Licencia General Pública
de GNU junto con este programa. Si no, vea <http://www.gnu.org/licenses/>.

---