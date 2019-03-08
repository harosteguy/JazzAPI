# JazzAPI

En este archivo se puede ver un ejemplo de uso para cada servicio de cada API.
Las peticiones son ejecutadas en un terminal usando curl.

## APIs

- [API Usuarios](#api-usuarios) Gestión de usuarios.
- [API WM Chorro](#api-wm-chorro) Gestión de contenidos multilingües.
- [API Chorro](#api-chorro) Entrega de contenidos mutilingües.
- [API WM Articulus](#api-wm-articulus) Gestión de contenidos indexados.
	- [Blogs](#blogs)
	- [Autores](#autores)
	- [Categorías](#categorías)
	- [Artículos](#artículos)
	- [Imágenes](#imágenes)
- [API Articulus](#api-articulus) Entrega de contenidos indexados.
- [API Contacto](#api-contacto) Envío de correo a una dirección determinada.

---
## Cabeceras

"Authorization"
Para los casos que el usuario necesite acreditarse se usa la cabecera "Authorization" con el ID de usuario y el token.
El ID y el token de usuario se obtienen usando el servicio "token" de la API Usuarios pasando en la cabecera "Authorization" el correo electrónico y la contraseña del usuario. El token será válido hasta que se obtenga uno nuevo.

"Accept-Language"
El idioma que se use en la cabecera "Accept-Language" se usará para mensajes en las respuestas, textos en correos y donde la API lo requiera.

"Accept-Encoding"
Para comprimir la respuesta se puede usar gzip o deflate en "Accept-Encoding".

---
## API Usuarios

Obtener un token de usuario para identificarse en las peticiones.
```
curl -u admin@abc.def:qwerty http://localhost:6666/apis/usuarios/v1/token
```
```javascript
{
	"id": 1,
	"token": "a339875fa309813a051799f150753f5d",
	"nombre": "Admin",
	"apellido": "",
	"esAdmin": 1
}
```

Verificar validez del token.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/usuarios/v1/autorizacion
```
```javascript
{
	"id": 1,
	"nombre": "Admin",
	"apellido": "",
	"esAdmin": 1
}
```

```
curl -u 1:00000000000000000000000000000000 http://localhost:6666/apis/usuarios/v1/autorizacion
```
```javascript
{
	"error": "Usuario no autorizado."
}
```

Como admin se puede obtener un usuario por su email.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/usuarios/v1/?email=admin@abc.def
```
```javascript
{
	"id": 1,
	"nombre": "Admin",
	"apellido": "",
	"email": "admin@abc.def"
}
```

Pre-registro. Se envía correo con token para confirmación. Debe estar configurado el correo en config.js
```
curl -X POST \
	-d '{"nombre":"Juan Carlos", "apellido":"Rodriguez", "email":"juan@car.los", "clave1":"contraseña", "clave2":"contraseña"}' \
	http://localhost:6666/apis/usuarios/v1/preRegistro
```
```javascript
{
	"nombre": "Juan Carlos",
	"apellido": "Rodriguez",
	"email": "juan@car.los"
}
```

Registro del usuario.
```
curl -X POST -d '{"token":"e413dfbc095da46b569c35e5d409d2b9"}' http://localhost:6666/apis/usuarios/v1
```
```javascript
{
	"uid": 2,
	"token": "2b386944de2a166534ee4a9bd0daa122",
	"nombre": "Juan Carlos",
	"apellido": "Rodriguez"
}
```

Subir imagen de usuario.
```
curl -u 2:2b386944de2a166534ee4a9bd0daa122 -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/foto.jpg" \
	http://localhost:6666/apis/usuarios/v1/imagen
```
```javascript
{
	"url": "/img/usuarios/000002.jpg"
}
```

Envíar email con token para reiniciar la contraseña. Debe estar configurado el correo en config.js
```
curl -X POST -d '{"email":"juan@car.los"}' http://localhost:6666/apis/usuarios/v1/emailClave
```
```javascript
{
	"mensaje": "Te enviamos un email con instrucciones para recuperar tu contraseña, si no lo encuentras busca en correo no deseado."
}
```

Actualizar contraseña.
```
curl -X PUT -d '{"token":"13a916e294905417b900587c972c7b0f", "clave1":"nueva contraseña", "clave2":"nueva contraseña"}' \
	http://localhost:6666/apis/usuarios/v1/nuevaClave
```
```javascript
{
	"id": 2,
	"nombre": "Juan Carlos",
	"apellido": "Rodriguez",
	"esAdmin": 0,
	"token": "45464d1e9b6a860ad135f98d0f7ebdab"
}
```

---
## API WM Chorro

Listar IDs de contenido.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-chorro/v1
```
```javascript
[
	"appAnterior",
	"appArticulos",
	"appBuscar",
	"appCancelar",
	...
]
```

Crear contenido.
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST \
	-d '{"id":"appGatoNegro","es":"Gato <b>negro</b>","en":"<b>Black</b> cat"}' \
	http://localhost:6666/apis/wm-chorro/v1
```
```javascript
{
	"url":"/apis/wm-chorro/v1/appGatoNegro"
}
```

Obtener contenido en todos sus idiomas.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-chorro/v1/appGatoNegro
```
```javascript
{
	"id": "appGatoNegro",
	"en": "<b>Black</b> cat",
	"es": "Gato <b>negro</b>"
}
```

Actualizar contenido.
```
curl -u 1:a339875fa309813a051799f150753f5d -X PUT \
	-d '{"id":"appGatoBlanco","es":"Gato blanco","en":"White cat"}' \
	http://localhost:6666/apis/wm-chorro/v1/appGatoNegro
```
```javascript
{
	"url": "/apis/wm-chorro/v1/appGatoBlanco"
}
```

Verificar la actualización.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco
```
```javascript
{
	"id": "appGatoBlanco",
	"en": "White cat",
	"es": "Gato blanco"
}
```

Borrar contenido.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE \
	http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco
```
Verificar el borrado.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco
```
```javascript
{
	"error": "El contenido no existe."
}
```
Con cabecera Accept-Language
```
curl -u 1:a339875fa309813a051799f150753f5d -H 'Accept-Language: en' \
	http://localhost:6666/apis/wm-chorro/v1/appGatoBlanco
```
```javascript
{
	"error": "The content does not exist."
}
```

---
## API Chorro

Obtener contenidos en un idioma.
```
curl -H 'Accept-Language: es' \
	http://localhost:6666/apis/chorro/v1/?chorro=appAnterior,appArticulos,appBuscar,appCancelar
```
```javascript
{
	"appCancelar":"Cancelar",
	"appBuscar":"Buscar",
	"appArticulos":"Artículos",
	"appAnterior":"Anterior"
}
```

Obtener contenidos en otro idioma.
```
curl -H 'Accept-Language: en' \
	http://localhost:6666/apis/chorro/v1/?chorro=appAnterior,appArticulos,appBuscar,appCancelar
```
```javascript
{
	"appCancelar": "Cancel",
	"appBuscar":" Search",
	"appArticulos": "Articles",
	"appAnterior": "Previous"
}
```

---
## API WM Articulus

### Blogs

Crear un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST \
	-d '{"nombre":"Sección Demo", "descripcion":"Esta es la Sección Demo"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo"
}
```

Obtener un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo
```
```javascript
{
	"id": 2,
	"nombre": "Sección Demo",
	"nombreUrl": "seccion-demo",
	"descripcion": "Esta es la Sección Demo"
}
```

Obtener blogs del autor o todos para el admin con la opción de obtener también la cantidad de artículos de cada blog.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs
```
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs?incNumArticulos=1
```
```javascript
[
	{
		"id": 2,
		"nombre": "Sección Demo",
		"nombreUrl": "seccion-demo",
		"numArticulos": 0
		}
]
```

Actualizar un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d -X PUT \
	-d '{"nombre":"Sección Demo", "descripcion":"Esta es la descripción de la <i>Sección Demo</i>"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo"
}
```

Borrar un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo
```
Respuesta vacía con código de estado 204 para caso de éxito o mensaje de error.

### Autores

Crear un autor.
"blog" es un array de IDs de blog
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST \
	-d '{"uid": "2", "nombreAutor": "El Juanca", "nombreUsuario": "Juan Carlos Rodriguez", "descripcion": "", "activo": "1", "blogs": [2]}' \
	http://localhost:6666/apis/wm-articulus/v1/autores
```
Respuesta vacía con código de estado 201 para caso de éxito o mensaje de error.

Obtener un autor por el ID de usuario.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/autores/2
```
```javascript
{
	"uid": 2,
	"nombreAutor": "El Juanca",
	"autorBase": "el-juanca",
	"nombreUsuario": "Juan Carlos Rodriguez",
	"descripcion": "",
	"activo": 1,
	"nroArticulos": 0,
	"blogs": [2]
}
```

Lista todos los autores con toda la info de cada uno si es admin o retorna un objeto con la propiedad autorActivo a true o false
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/autores
```
```javascript
[
	{
		"uid": 2,
		"nombreAutor": "El Juanca",
		"autorBase": "el-juanca",
		"nombreUsuario": "Juan Carlos Rodriguez",
		"descripcion": "",
		"activo": 1,
		"nroArticulos": 0
	}
]
```

Actualizar un autor.
```
curl -u 1:a339875fa309813a051799f150753f5d -X PUT \
	-d '{"nombreAutor": "El Juanca", "nombreUsuario": "Juan Carlos Rodriguez", "descripcion": "Descripción del Juanca.", "activo": "1", "blogs": [2]}' \
	http://localhost:6666/apis/wm-articulus/v1/autores/2
```
Respuesta vacía con código de estado 200 para caso de éxito o mensaje de error.

Borrar un autor.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE http://localhost:6666/apis/wm-articulus/v1/autores/2
```
Respuesta vacía con código de estado 204 para caso de éxito o mensaje de error.

### Categorías

Crear una categoría para un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST \
	-d '{"nombre": "Verde"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde"
}
```

Obtener una categoría de un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde
```
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde?incNumArticulos=1
```
```javascript
{
	"id": 1,
	"nombre": "Verde",
	"nombreBase": "verde",
	"descripcion": "",
	"numArticulos": 0
}
```

Obtener lista de categorías de un blog.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias
```
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias?incNumArticulos=1
```
```javascript
[
	{
		"id": 1,
		"nombre": "Verde",
		"nombreBase": "verde",
		"numArticulos": 0
	}
]
```

Actualizar una categoría.
```
curl -u 1:a339875fa309813a051799f150753f5d -X PUT \
	-d '{"nombre": "Verde", "descripcion": "Como las plantas"}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde"
}
```

Borrar una categoría.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde
```
Respuesta vacía con código de estado 204 para caso de éxito o mensaje de error.

### Artículos

Crear un artículo.

Solo los autores pueden crear artículos. Obtener ID de usuario y token del autor creado previamente. `curl -u juan@car.los:"nueva contraseña" http://localhost:6666/apis/usuarios/v1/token`
La fecha de publicación por defecto es la fecha actual.
```
curl -u 2:a16fd33cf1877feb824ed2017b6c581d -X POST \
	-d '{ "copete": "", "titulo": "Título obligatorio", "entradilla": "", "texto": "", "publicado": "0", "fechaPublicado": "", "auxTexto": "", "auxFecha": "", "auxEntero": "0", "auxDecimal": "0", "idsCat": [2] }' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-obligatorio"
}
```

Obtener un artículo.

Además de los datos del artículo obtiene las categorías del blog y los blogs del autor del artículo.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-obligatorio
```
```javascript
{
	"id": 1,
	"uid": 2,
	"copete": "",
	"titulo": "Título obligatorio",
	"tituloUrl": "titulo-obligatorio",
	"entradilla": "",
	"texto": "",
	"publicado": 0,
	"fechaCreado": "2019-03-06 02:01:11",
	"fechaPublicado": "2019-03-06 02:01:11",
	"imgPrincipal": "",
	"auxTexto": "",
	"auxFecha": null,
	"auxEntero": 0,
	"auxDecimal": 0,
	"categorias": [
		{
			"id": 2,
			"nombre": "Verde"
		}
	],
	"aux": {
		"blogs": [
			{
				"nombre": "Sección Demo",
				"nombreUrl": "seccion-demo"
			}
		],
		"categorias": [
			{
				"id": 2,
				"nombre": "Verde"
			}
		]
	}
}
```

Obtener lista de artículos.

El admin obtiene todos los artículos.
El autor obtiene sus artículos.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?busqueda=obligatorio
```
```
curl -u 1:a339875fa309813a051799f150753f5d 'http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=5&orden=alfa&ordenDir=asc&idCat=2&desde=2019-01-22%2002%3A48%3A18&hasta=2019-03-25%2002%3A48%3A18&idAutor=1&estado=publicado'
```
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos
```
```javascript
{
	"articulos": [
		{
			"id": 1,
			"tituloUrl": "titulo-obligatorio",
			"titulo": "Título obligatorio",
			"fechaPublicado": "2019-03-06 02:01:11",
			"imgPrincipal": "",
			"uid": 2,
			"autor": "El Juanca",
			"entradilla": ""
		}
	],
	"paginacion": {
		"articulos": 1,
		"paginas": 1,
		"anterior": "",
		"siguiente": ""
	}
}
```

Actualizar un artículo.

Autores y admin pueden modificar artículos. La fecha de publicación se actualiza si no se indica en la petición.
```
curl -u 1:a339875fa309813a051799f150753f5d -X PUT \
	-d '{"titulo": "Título real", "entradilla": "<b>Texto introductorio</b>", "texto": "Cuerpo del artículo", "publicado": 1, "idsCat": [2]}' \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-obligatorio
```
```javascript
{
	"url": "/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-real"
}
```

Borrar un artículo.

Autores y admin pueden borrar artículos.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-real
```
Respuesta vacía con código de estado 204 para caso de éxito o mensaje de error.

### Imágenes

Para las imágenes de artículos, los privilegios son del admin y del autor del artículo.
Para las imágenes de categorías los privilegios son del admin.

Crear set de imágenes para una categoría.
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/img11.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes
```
```javascript
{
	"url": "/img/seccion-demo/categorias/id000002/img11.jpg"
}
```

Crear set de imágenes para un artículo.
```
curl -u 1:a339875fa309813a051799f150753f5d -X POST -H "Content-Type: multipart/form-data" \
	-F "imagen=@/home/usuario/Escritorio/imagenes/img11.jpg" \
	http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-real/imagenes
```
```javascript
{
	"url": "/img/seccion-demo/articulos/id000002/img11.jpg"
}
```

Obtener lista de URLs de imagen de una categoría.
```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes
```
```javascript
[
	"/img/seccion-demo/categorias/id000002/img11-1280.jpg",
	"/img/seccion-demo/categorias/id000002/img11-1920.jpg",
	"/img/seccion-demo/categorias/id000002/img11-480.jpg",
	"/img/seccion-demo/categorias/id000002/img11-960.jpg",
	"/img/seccion-demo/categorias/id000002/img11.jpg"
]
```

Obtener lista de URLs de imagen de un artículo.

```
curl -u 1:a339875fa309813a051799f150753f5d http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-real/imagenes
```
```javascript
[
	"/img/seccion-demo/articulos/id000002/img11-1280.jpg",
	"/img/seccion-demo/articulos/id000002/img11-1920.jpg",
	"/img/seccion-demo/articulos/id000002/img11-480.jpg",
	"/img/seccion-demo/articulos/id000002/img11-960.jpg",
	"/img/seccion-demo/articulos/id000002/img11.jpg"
]
```

Borrar set de imágenes.
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/articulos/titulo-rea/imagenes/img11
```
```
curl -u 1:a339875fa309813a051799f150753f5d -X DELETE http://localhost:6666/apis/wm-articulus/v1/blogs/seccion-demo/categorias/verde/imagenes/img11
```
Respuesta vacía con código de estado 204 para caso de éxito o mensaje de error.

---
## API Articulus

Obtener lista de blogs.
```
curl http://localhost:6666/apis/articulus/v1/blogs
```
```javascript
{
	"blogs": [
		{
			"nombre": "Sección Demo",
			"nombreUrl": "seccion-demo",
			"descripcion": "Esta es la Sección Demo"
		}
	]
}
```

Obtener un artículo con la versión estándar del servicio "articulos".
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/titulo-real
```
```javascript
{
	"id": 3,
	"uid": 2,
	"copete": "",
	"titulo": "Título real",
	"tituloUrl": "titulo-real",
	"entradilla": "<b>Texto introductorio</b>",
	"texto": "Cuerpo del artículo",
	"publicado": 1,
	"fechaCreado": "2019-03-07 00:37:52",
	"fechaPublicado": "2019-03-07 00:47:39",
	"imgPrincipal": "",
	"auxTexto": "",
	"auxFecha": null,
	"auxEntero": 0,
	"auxDecimal": 0,
	"autor": "El Juanca",
	"categorias": [
		{
			"id": 2,
			"nombre": "Verde",
			"nombreBase": "verde"
		}
	],
	"siguiente": {
		"titulo": "",
		"url": ""
	},
	"anterior": {
		"titulo": "",
		"url": ""
	},
	"cache": 1
}
```

Obtener un artículo con la versión full del servicio "articulos".
```
curl 'http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-full/titulo-real?incCategorias=1&incArtiAnt=1&incArtiSig=1&incUrlImg=1&cache=0'
```
```javascript
{
	"id": 3,
	"uid": 2,
	"copete": "",
	"titulo": "Título real",
	"tituloUrl": "titulo-real",
	"entradilla": "<b>Texto introductorio</b>",
	"texto": "Cuerpo del artículo",
	"publicado": 1,
	"fechaCreado": "2019-03-07 00:37:52",
	"fechaPublicado": "2019-03-07 00:47:39",
	"imgPrincipal": "",
	"auxTexto": "",
	"auxFecha": null,
	"auxEntero": 0,
	"auxDecimal": 0,
	"autor": "El Juanca",
	"categorias": [
		{
			"id": 2,
			"nombre": "Verde",
			"nombreBase": "verde"
		}
	],
	"siguiente": {
		"titulo": "",
		"url": ""
	},
	"anterior": {
		"titulo": "",
		"url": ""
	},
	"urlImagenes": [
		"/img/seccion-demo/articulos/id000003/img1-1920.jpg",
		"/img/seccion-demo/articulos/id000003/img1-480.jpg",
		"/img/seccion-demo/articulos/id000003/img1-960.jpg",
		"/img/seccion-demo/articulos/id000003/img1.jpg",
		"/img/seccion-demo/articulos/id000003/img10-1920.jpg",
		"/img/seccion-demo/articulos/id000003/img10-480.jpg",
		"/img/seccion-demo/articulos/id000003/img10-960.jpg",
		"/img/seccion-demo/articulos/id000003/img10.jpg"
	],
	"cache": 0
}
```

Obtener un artículo con la versión light del servicio "articulos"
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-light/titulo-real
```
```javascript
{
	"id": 3,
	"uid": 2,
	"copete": "",
	"titulo": "Título real",
	"tituloUrl": "titulo-real",
	"entradilla": "<b>Texto introductorio</b>",
	"texto": "Cuerpo del artículo",
	"publicado": 1,
	"fechaCreado": "2019-03-07 00:37:52",
	"fechaPublicado": "2019-03-07 00:47:39",
	"imgPrincipal": "",
	"auxTexto": "",
	"auxFecha": null,
	"auxEntero": 0,
	"auxDecimal": 0,
	"cache": 1
}
```

Obtener una lista de artículos con la versión estándar del servicio "articulos".
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos
```
```
curl 'http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos?pag=1&porPag=20&orden=crono&ordenDir=desc&categoria=verde&busqueda=real'
```
```javascript
{
	"articulos": [
		{
			"id": 3,
			"tituloUrl": "titulo-real",
			"copete": "",
			"titulo": "Título real",
			"fechaPublicado": "2019-03-07 00:47:39",
			"imgPrincipal": "",
			"entradilla": "<b>Texto introductorio</b>",
			"valoracion": 0,
			"auxTexto": "",
			"auxFecha": null,
			"auxEntero": 0,
			"auxDecimal": 0,
			"autor": "El Juanca"
		}
	],
	"paginacion": {
		"total": 1,
		"anterior": "",
		"siguiente": ""
	},
	"cache": 1
}
```

Obtener una lista de artículos con la versión full del servicio "articulos".
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-full
```
```
curl 'http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-full?pag=1&porPag=20&orden=crono&ordenDir=desc&categoria=verde&incUrlImg=1&busqueda=real'
```
```javascript
{
	"articulos": [
		{
			"id": 3,
			"tituloUrl": "titulo-real",
			"copete": "",
			"titulo": "Título real",
			"fechaPublicado": "2019-03-07 00:47:39",
			"imgPrincipal": "",
			"entradilla": "<b>Texto introductorio</b>",
			"valoracion": 0,
			"auxTexto": "",
			"auxFecha": null,
			"auxEntero": 0,
			"auxDecimal": 0,
			"autor":" El Juanca",
			"imagenes": [
				"/img/seccion-demo/articulos/id000003/img1-1920.jpg",
				"/img/seccion-demo/articulos/id000003/img1-480.jpg",
				"/img/seccion-demo/articulos/id000003/img1-960.jpg",
				"/img/seccion-demo/articulos/id000003/img1.jpg",
				"/img/seccion-demo/articulos/id000003/img10-1920.jpg",
				"/img/seccion-demo/articulos/id000003/img10-480.jpg",
				"/img/seccion-demo/articulos/id000003/img10-960.jpg",
				"/img/seccion-demo/articulos/id000003/img10.jpg"
			]
		}
	],
	"paginacion": {
		"total": 1,
		"anterior": "",
		"siguiente": ""
	},
	"cache": 1
}
```

Obtener una lista de artículos con la versión light del servicio "articulos".
Si no se pasa en URL "maxArticulos" la API devolverá la cantidad indicada en config.js. También existe un máximo de artículos indicado en config.js.
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-light
```
```
curl 'http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos-light?orden=alfa&ordenDir=asc&maxArticulos=8'
```
```javascript
{
	"articulos": [
		{
			"id": 3,
			"tituloUrl": "titulo-real",
			"copete": "",
			"titulo": "Título real",
			"fechaPublicado": "2019-03-07 00:47:39",
			"imgPrincipal": "",
			"entradilla": "<b>Texto introductorio</b>",
			"auxTexto": "",
			"auxFecha": null,
			"auxEntero": 0,
			"auxDecimal": 0
		}
	],
	"cache": 1
}
```

Comentar un artículo.
```
curl -u 2:a16fd33cf1877feb824ed2017b6c581d -X POST \
	-d '{"idPadre": "0", "texto": "Hola, qué tal?"}' \
	http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/titulo-real/comentarios/
```
```javascript
{
	"id": 1,
	"uid": 2,
	"autor": "Juan Carlos Rodriguez",
	"texto": "Hola, qué tal?",
	"fecha": "2019-03-07 03:45:16"
}
```

Obtener comentarios de un artículo.
```
curl http://localhost:6666/apis/articulus/v1/blogs/seccion-demo/articulos/titulo-real/comentarios/
```
```javascript
[
	{
		"id":1,
		"idPadre":0,
		"uid":2,
		"autor":"Juan Carlos Rodriguez",
		"fecha":"2019-03-07 03:45:16",
		"texto":"Hola, qué tal?",
		"rama":0
	}
]
```

---
## API Contacto

```
curl -H 'Accept-Language: en' -X POST \
	-d '{"nombre": "Ricardo Rubén", "email": "abc@def.ghi", "mensaje": "Hola"}' \
	http://localhost:6666/apis/contacto/v1/
```
```javascript
{
	"respuesta": "Thanks for communicating, we will contact you shortly."
}
```

---
