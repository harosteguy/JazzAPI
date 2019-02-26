JazzAPIs es un grupo de APIs RESTful desarrolladas en Node.js para servir y manejar contenidos de aplicaciones.

API WM-Chorro
	Gestiona contenidos en diferentes idiomas.
API Chorro
	Sirve contenidos en un idioma específico.
API Usuarios
	Gestiona usuarios. Registro, login, etc.
API WM-Articulus
	Gestiona contenidos indexados estilo blog.
API Articulus
	Sirve contenidos indexados estilo blog con sistema de comentarios para usuarios registrados.
API Contacto
	Envía correo electrónico con mensaje de un usuario

Bases de datos
--------------
En la carpeta servidor_apis/db se encuentran los archivos para crear las bases de datos y usuarios en un servidor MySQL.
En el archivo usuarios_claves.sql de deben poner las contraseñas para las bases de datos. Las mismas contraseñas se deben poner en el archivo de configuración de las APIs.

Configuración
-------------
En la carpeta servidor_apis/apis/apis-comun se encuentra el archivo config.js donde se pueden setear todos los valores configurables del sistema.


Requiere NPM para la instalación de las dependencias en package.json

Requiere ImageMagick instalado para el manejo de imágenes.
https://www.imagemagick.org


-------------------------------------------------------------------------------------------------------------------------------------
API WM-Chorro
Gestiona contenidos en diferentes idiomas.

-- Lista IDs de contenido

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-chorro/v1

-- Crea contenido

curl -u 1:0123456789abcdef0123456789abcdef -X POST -d '{"id":"appGatoNegro","es":"Gato negro","en":"Black cat"}' http://localhost:6666/apis/wm-chorro/v1

-- Obtiene contenido en todos sus idiomas

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-chorro/v1/appGatoNegro

-- Actualiza contenido

curl -u 1:0123456789abcdef0123456789abcdef -X PUT -d '{"id":"appGatoBlanco","es":"Gato blanco","en":"White cat"}' http://localhost:6666/apis/wm-chorro/v1/appGatoNegro

-- Borra contenido

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco

-------------------------------------------------------------------------------------------------------------------------------------
API Chorro
Sirve contenidos en un idioma específico.

-- Obtiene contenidos en un idioma

curl -H 'Accept-Language: en' http://localhost:6666/apis/chorro/v1/?chorro=titleInicio,appTelefono,appNosotros

-------------------------------------------------------------------------------------------------------------------------------------
API Usuarios
Gestiona usuarios. Registro, login, etc.

-- Crea token de usuario

curl -u correo@electronico.com:password http://localhost:6666/apis/usuarios/v1/token

-- Verifica validez del token

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/usuarios/v1/autorizacion

-- Como admin se puede obtener un usuario por su email

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/usuarios/v1/?email=correo@electronico.com

-- Pre-registro. Se envía email con token para confirmación.

curl -X POST -d '{"nombre":"Juan Carlos", "apellido":"Rodriguez", "email":"correo@electronico.com", "clave1":"contraseña", "clave2":"contraseña"}' http://localhost:6666/apis/usuarios/v1/preRegistro

-- Registro

curl -X POST -d '{"token":"0123456789abcdef0123456789abcdef"}' http://localhost:6666/apis/usuarios/v1

-- Sube imagen

curl -u 1:0123456789abcdef0123456789abcdef -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/imagen.jpg" \
	http://localhost:6666/apis/usuarios/v1/imagen

-- Envía email de recuperación de contraseña

curl -X POST -d '{"email":"correo@electronico.com"}' http://localhost:6666/apis/usuarios/v1/emailClave

-- Actualiza contraseña

curl -X PUT -d '{"token":"0123456789abcdef0123456789abcdef", "clave1":"qwe", "clave2":"qwe"}' http://localhost:6666/apis/usuarios/v1/nuevaClave

-------------------------------------------------------------------------------------------------------------------------------------
API WM-Articulus
Gestiona contenidos indexados estilo blog.

Blogs
=====

-- Obtiene blogs del autor o todos para el admin con la opción de recuperar también la cantidad de artículos de cada blog

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs
curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs?incNumArticulos=1

-- Obtiene un blog

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo

-- Crea un blog

curl -u 1:0123456789abcdef0123456789abcdef -X POST -d '{"nombre":"Sección Demo", "descripcion":"Esta es la Sección Demo"}' http://localhost:6666/apis/wm-articulus/v1/blogs

-- Actualiza un blog

curl -u 1:0123456789abcdef0123456789abcdef -X PUT -d '{"nombre":"Sección Demo", "descripcion":"Lorem ipsum"}' http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo

-- Borra un blog

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo


Autores
=======

-- Lista todos los autores con toda la info de cada uno si es admin o retorna un objeto con la propiedad autorActivo a true o false

curl -u 3:5926f7b5b29dc692513558b176d2d982 http://localhost:6666/apis/wm-articulus/v1/autores

-- Obtiene un autor por uid

curl -u 3:5926f7b5b29dc692513558b176d2d982 http://localhost:6666/apis/wm-articulus/v1/autores/33

-- Crea un autor

curl -u 1:0123456789abcdef0123456789abcdef -X POST \
-d '{"uid": "22", "nombreAutor": "El Loco", "nombreUsuario": "Alejandro", "descripcion": "Nada", "activo": "1", "blogs": [17,9]}' \
http://localhost:6666/apis/wm-articulus/v1/autores

curl -u 1:0123456789abcdef0123456789abcdef -X POST \
-d '{"uid": "22", "nombreAutor": "El Loco", "nombreUsuario": "Alejandro"}' \
http://localhost:6666/apis/wm-articulus/v1/autores

curl -u 1:0123456789abcdef0123456789abcdef -X POST \
-d '{"uid": "33", "nombreAutor": "Calacachumba", "nombreUsuario": "Mariana", "descripcion": "Bla, bla...", "activo": "1", "blogs": [1,9,17]}' \
http://localhost:6666/apis/wm-articulus/v1/autores

-- Actualiza un autor

curl -u 1:0123456789abcdef0123456789abcdef -X PUT \
-d '{"nombreAutor": "Cala Cachimba", "nombreUsuario": "Mariana", "descripcion": "Bla, bla, bla...", "activo": "0", "blogs": [17,9]}' \
http://localhost:6666/apis/wm-articulus/v1/autores/33

-- Borra un autor

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/autores/33


Categorías
==========

-- Obtiene lista de categorías del blog

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias
curl -u 2:c716a9479dfdd6287045ca9d9a6f8ea0 http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias?incNumArticulos=1

-- Obtiene una categoría del blog

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde?incNumArticulos=1
curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde

-- Crea una categoría

curl -u 1:0123456789abcdef0123456789abcdef -X POST \
	-d '{"nombre": "Verde"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias

-- Actualiza una categoría

curl -u 1:0123456789abcdef0123456789abcdef -X PUT \
	-d '{"nombre": "Verde", "descripcion": "Como las plantas"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde

-- Borra una categoría

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde


Imagenes
========

Para las imágenes de artículos, los privilegios son del admin y del autor del artículo
Para las imágenes de categorías los privilegios son del admin

-- Obtiene array con URL de imágenes

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes

-- Crea set de imágenes

curl -u 1:0123456789abcdef0123456789abcdef -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/carpeta/imagenes/tierra.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes

curl -u 1:0123456789abcdef0123456789abcdef -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/carpeta/imagenes/tierra.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes

-- Borra set de imágenes

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/imagenes/tierra

curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes/tierra

Artículos
=========

-- Obtiene lista de artículos

El admin obtiene todos los artículos
El autor obtiene sus artículos

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos
curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?busqueda=ipsum
curl -u 1:0123456789abcdef0123456789abcdef 'http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=5&orden=alfa&ordenDir=asc&idCat=2&desde=2019-01-22%2002%3A48%3A18&hasta=2019-01-25%2002%3A48%3A18&idAutor=1&estado=publicado'

-- Obtiene un artículo

curl -u 1:0123456789abcdef0123456789abcdef http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum
	Además de los datos del artículo obtiene las categorías del blog y los blogs del autor del artículo

-- Crea un artículo

Solo los autores pueden crear artículos
titulo obligatorio
fechaPublicado por defecto; fecha actual
{ "copete": "", "titulo": "Lorem Ipsum", "entradilla": "", "texto": "", "publicado": "0", "fechaPublicado": "", "auxTexto": "", "auxFecha": "", "auxEntero": "0", "auxDecimal": "0", "idsCat": [10,11,12,13] }

curl -u 1:0123456789abcdef0123456789abcdef -X POST \
	-d '{"titulo": "Lorem Ipsum"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos

-- Actualiza un artículo

Autores y admin pueden modificar artículos
curl -u 1:0123456789abcdef0123456789abcdef -X PUT \
	-d '{"titulo": "Lorem Ipsum", "entradilla": "Qwert y uiop", "texto": "Asdfgh Jkl", "idsCat": [1,3]}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum

-- Borra un artículo

Autores y admin pueden borrar artículos
curl -u 1:0123456789abcdef0123456789abcdef -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum

-------------------------------------------------------------------------------------------------------------------------------------
API Articulus
Sirve contenidos indexados estilo blog con sistema de comentarios para usuarios registrados.

-- Obtiene lista de secciones

http://localhost:6666/apis/articulus/v1/blogs

-- Obtiene lista de artículos

http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos
http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-full
http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-light

http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=20&orden=crono&ordenDir=desc&categoria=nombre-base&busqueda=algo

-- Obtiene un artículo

http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum

-- Obtiene lista de categorías de una sección

http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/categorias

-- Obtiene una categoría de una sección

http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/categorias/categoria-uno

-- Comenta un artículo

curl -u 3:92975afe0de103284afe97a477420dd4 -X POST \
	-d '{"idPadre": "1", "texto": "Hola, qué tal?"}' \
	http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/comentarios/

-- Obtiene comentarios de un artículo

curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/lorem-ipsum/comentarios/

-------------------------------------------------------------------------------------------------------------------------------------
API Contacto
Envía correo electrónico con mensaje de un usuario

curl -H 'Accept-Language: en' -X POST http://localhost:6666/apis/contacto/v1/ -d '{"nombre": "Ricardo Rubén", "email": "correo@electronico.con", "mensaje": "Hola"}'

-------------------------------------------------------------------------------------------------------------------------------------

