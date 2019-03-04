# JazzAPI

JazzAPI es un grupo de APIs RESTful desarrolladas en Node.js para servir y manejar contenidos de aplicaciones.

- **API WM-Chorro:** Gestiona contenidos en diferentes idiomas.
- **API Chorro:** Sirve contenidos en un idioma específico. Usa cache en memoria para la entrega de contenidos.
- **API Usuarios:** Gestiona usuarios. Registro, login, imagen, autorización, contraseñas.
- **API WM-Articulus:** Gestiona contenidos indexados estilo blog. Secciones, artículos, categorías, autores, imágenes.
- **API Articulus:** Sirve contenidos indexados estilo blog. Usa cache en memoria para la entrega de contenidos. Incluye sistema de comentarios para usuarios registrados.
- **API Contacto:** Envía correo electrónico con mensaje de un usuario.

## Tabla de contenidos

- [Pre requisitos](#pre-requisitos)
- [Instalación](#instalación)
	- [Bases de datos](#bases-de-datos)
	- [APIs](#apis)
- [Configuración](#configuración)
- [Uso](#uso)
	- [API WM Chorro](#api-wm-chorro)
	- [API Chorro](#api-chorro)
	- [API Usuarios](#api-usuarios)
	- [API WM Articulus](#api-wm-articulus)
	- [API Articulus](#api-articulus)
	- [API Contacto](#api-contacto)
- [Licencia](#licencia)

---
## Pre requisitos

- Servidor MySQL instalado con acceso root para instalar las bases de datos y crear los usuarios. <https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/>
- Node.js instalado para ejecutar el servidor de las APIs. <https://nodejs.org>
- NPM para la instalación de las dependencias en package.json. <https://www.npmjs.com/get-npm>
- ImageMagick instalado para el manejo de imágenes por parte de las APIs. <https://www.imagemagick.org>

---
## Instalación

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

### APIs

Si tiene instalado git <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git> abra un terminal en la carpeta donde desea hacer la instalación y clone el repositorio con el siguiente comando:
`git clone https://github.com/harosteguy/JazzAPI.git`

También puede descargar JazzAPI en <https://github.com/harosteguy/JazzAPI/archive/master.zip> y descomprimir el archivo en la carpeta deseada.

Para instalar las dependencias abra un terminal en la carpeta JazzAPI, donde se encuentra el archivo package.json y ejecute el siguiente comando:
`npm install`

**[Ir arriba](#tabla-de-contenidos)**

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

**[Ir arriba](#tabla-de-contenidos)**

---
## Uso

#### Cabeceras

"Authorization"
Para los casos que el usuario necesite acreditarse se usa la cabecera "Authorization" con el ID de usuario y el token.
El ID y el token de usuario se obtienen usando el servicio "token" de la API Usuarios pasando en la cabecera "Authorization" el correo electrónico y la contraseña del usuario. El token será válido hasta que se obtenga uno nuevo.

"Accept-Language"
El idioma que se use en la cabecera "Accept-Language" se usará para mensajes en las respuestas, textos en correos y donde la API lo requiera.

"Accept-Encoding"
Para comprimir la respuesta se puede usar gzip o deflate en "Accept-Encoding".

#### Respuestas

El formato de las respuestas es JSON con un código de estado apropiado.

**A continuación se da un ejemplo de petición para cada servicio de cada API.
Reemplce según convenga id_de_usuario, token_de_usuario, correo_de_usuario y contraseña_de_usuario.**

### API WM Chorro

Lista IDs de contenido
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-chorro/v1`

Crea contenido
`curl -u id_de_usuario:token_de_usuario -X POST -d '{"id":"appGatoNegro","es":"Gato <b>negro</b>","en":"<b>Black</b> cat"}' http://localhost:6666/apis/wm-chorro/v1`

Obtiene contenido en todos sus idiomas
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-chorro/v1/appGatoNegro`

Actualiza contenido
`curl -u id_de_usuario:token_de_usuario -X PUT -d '{"id":"appGatoBlanco","es":"Gato blanco","en":"White cat"}' http://localhost:6666/apis/wm-chorro/v1/appGatoNegro`

Borra contenido
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco`

### API Chorro

Obtiene contenidos en un idioma
`curl -H 'Accept-Language: en' http://localhost:6666/apis/chorro/v1/?chorro=appGatoNegro,appGatoBlanco`

### API Usuarios

Crea token de usuario
`curl -u correo_de_usuario:contraseña_de_usuario http://localhost:6666/apis/usuarios/v1/token`

Verifica validez del token
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/usuarios/v1/autorizacion`

Como admin se puede obtener un usuario por su email
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/usuarios/v1/?email=abc@def.ghi`

Pre-registro. Se envía email con token para confirmación.
`curl -X POST -d '{"nombre":"Juan Carlos", "apellido":"Rodriguez", "email":"abc@def.ghi", "clave1":"contraseña", "clave2":"contraseña"}' http://localhost:6666/apis/usuarios/v1/preRegistro`

Registro
`curl -X POST -d '{"token":"0123456789abcdef0123456789abcdef"}' http://localhost:6666/apis/usuarios/v1`

Sube imagen de usuario
`curl -u id_de_usuario:token_de_usuario -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/imagen.jpg" \
	http://localhost:6666/apis/usuarios/v1/imagen`

Envía email con token para reiniciar la contraseña
`curl -X POST -d '{"email":"abc@def.ghi"}' http://localhost:6666/apis/usuarios/v1/emailClave`

Actualiza contraseña
`curl -X PUT -d '{"token":"0123456789abcdef0123456789abcdef", "clave1":"qwe", "clave2":"qwe"}' http://localhost:6666/apis/usuarios/v1/nuevaClave`

### API WM Articulus

##### Blogs

Obtiene blogs del autor o todos para el admin con la opción de recuperar también la cantidad de artículos de cada blog
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs`
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs?incNumArticulos=1`

Obtiene un blog
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo`

Crea un blog
`curl -u id_de_usuario:token_de_usuario -X POST -d '{"nombre":"Sección Demo", "descripcion":"Esta es la Sección Demo"}' http://localhost:6666/apis/wm-articulus/v1/blogs`

Actualiza un blog
`curl -u id_de_usuario:token_de_usuario -X PUT -d '{"nombre":"Sección Demo", "descripcion":"Lorem ipsum"}' http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo`

Borra un blog
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo`

##### Autores

Lista todos los autores con toda la info de cada uno si es admin o retorna un objeto con la propiedad autorActivo a true o false
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/autores`

Obtiene un autor por uid
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/autores/33`

Crea un autor
`curl -u id_de_usuario:token_de_usuario -X POST \
	-d '{"uid": "22", "nombreAutor": "El Loco", "nombreUsuario": "Alejandro"}' \
	http://localhost:6666/apis/wm-articulus/v1/autores`

`curl -u id_de_usuario:token_de_usuario -X POST \
-d '{"uid": "33", "nombreAutor": "Calacachumba", "nombreUsuario": "Mariana", "descripcion": "Bla, bla...", "activo": "1", "blogs": [1,9,17]}' \
http://localhost:6666/apis/wm-articulus/v1/autores`

Actualiza un autor
`curl -u id_de_usuario:token_de_usuario -X PUT \
	-d '{"nombreAutor": "Cala Cachimba", "nombreUsuario": "Mariana", "descripcion": "Bla, bla, bla...", "activo": "0", "blogs": [17,9]}' \
	http://localhost:6666/apis/wm-articulus/v1/autores/33`

Borra un autor
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/autores/33`

##### Categorías

Obtiene lista de categorías del blog
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias`
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias?incNumArticulos=1`

Obtiene una categoría del blog
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde?incNumArticulos=1`
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde`

Crea una categoría
`curl -u id_de_usuario:token_de_usuario -X POST \
	-d '{"nombre": "Verde"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias`

Actualiza una categoría
`curl -u id_de_usuario:token_de_usuario -X PUT \
	-d '{"nombre": "Verde", "descripcion": "Como las plantas"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde`

Borra una categoría
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde`

##### Imágenes

Para las imágenes de artículos, los privilegios son del admin y del autor del artículo.
Para las imágenes de categorías los privilegios son del admin.

Obtiene array con URL de imágenes
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes`
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes`

Crea set de imágenes
`curl -u id_de_usuario:token_de_usuario -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/tierra.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes`

`curl -u id_de_usuario:token_de_usuario -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/tierra.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes`

Borra set de imágenes
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes/tierra`
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes/tierra`

##### Artículos

Obtiene lista de artículos

El admin obtiene todos los artículos
El autor obtiene sus artículos
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos`
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?busqueda=ipsum`
`curl -u id_de_usuario:token_de_usuario 'http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=5&orden=alfa&ordenDir=asc&idCat=2&desde=2019-01-22%2002%3A48%3A18&hasta=2019-01-25%2002%3A48%3A18&idAutor=1&estado=publicado'`

Obtiene un artículo

Además de los datos del artículo obtiene las categorías del blog y los blogs del autor del artículo
`curl -u id_de_usuario:token_de_usuario http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum`

Crea un artículo

Solo los autores pueden crear artículos.
La fecha de publicación por defecto es la fecha actual.
`{ "copete": "", "titulo": "Lorem Ipsum", "entradilla": "", "texto": "", "publicado": "0", "fechaPublicado": "", "auxTexto": "", "auxFecha": "", "auxEntero": "0", "auxDecimal": "0", "idsCat": [10,11,12,13] }`

`curl -u id_de_usuario:token_de_usuario -X POST \
	-d '{"titulo": "Lorem Ipsum"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos`

Actualiza un artículo

Autores y admin pueden modificar artículos
`curl -u id_de_usuario:token_de_usuario -X PUT \
	-d '{"titulo": "Lorem Ipsum", "entradilla": "Qwert y uiop", "texto": "Asdfgh Jkl", "idsCat": [1,3]}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum`

Borra un artículo

Autores y admin pueden borrar artículos
`curl -u id_de_usuario:token_de_usuario -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum`

### API Articulus

Obtiene lista de secciones
`http://localhost:6666/apis/articulus/v1/blogs`

Obtiene lista de artículos
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos`
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-full`
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-light`
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=20&orden=crono&ordenDir=desc&categoria=nombre-base&busqueda=algo`

Obtiene un artículo
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum`

Obtiene lista de categorías de una sección
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/categorias`

Obtiene una categoría de una sección
`http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/categorias/categoria-uno`

Comenta un artículo
`curl -u id_de_usuario:token_de_usuario -X POST \
	-d '{"idPadre": "1", "texto": "Hola, qué tal?"}' \
	http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/comentarios/`

Obtiene comentarios de un artículo
`curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/comentarios/`

### API Contacto

`curl -H 'Accept-Language: en' -X POST http://localhost:6666/apis/contacto/v1/ -d '{"nombre": "Ricardo Rubén", "email": "abc@def.ghi", "mensaje": "Hola"}'`

**[Ir arriba](#tabla-de-contenidos)**

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