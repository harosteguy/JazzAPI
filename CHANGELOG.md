# JazzAPI - Registro de cambios

## v1.3.0 (2020-03-23)

#### Agregados
- Servicio para obtener información de un blog en la API Articulus.

#### Correcciones

- Corrección de permiso de autor para editar y borrar

#### Seguridad

- Se actualizan las dependencias.

## v1.2.1 (2019-07-11)

#### Agregados

- Mejora en el log de errores.
- Mejora en la seguridad de la carga de imágenes.
- Mejora en el pool de conexiones a bases de datos.
- Se le da una vigencia desde la última actividad al token de usuario.

#### Correcciones

- Correcciones menores.

#### Seguridad

- Se actualiza la versión de una dependencia vulnerable.

## v1.2.0 (2019-06-23)

#### Agregados

- Se agrega el campo imgPrincipal (para usar un URL) a las categorías de artículo.
- Se mejora la seguridad dándole una vigencia al token de usuario. Por defecto 4 horas después de la última interacción.

#### Correcciones

- Corrección de error en borrado de un set de imágenes.

## v1.1.0 (2019-04-09)

#### Agregados

- Se permite la carga de imágenes png además de jpg para artículos y categorías.
- Se agregan etiquetas a los filtros de saneo para permitir la carga de contenidos multimedia. Las etiquetas permitidas son las siguientes: h1, h2, h3, h4, h5, h6, blockquote, p, a, ul, ol, nl, li, b, i, strong, em, strike, code, hr, br, div, table, thead, caption, tbody, tr, th, td, pre, iframe, oembed, figure, img.
- Se agrega API WM-Imagen para la gestión de imágenes en diferentes carpetas. Por defecto están habilitadas las carpetas "contenidos" y "banco".

#### Correcciones

- Un par de correcciones menores.

## v1.0.1 (2019-03-15)

#### Correcciones

- Correcciones y cambios menores.

#### Seguridad

- En la API WM-Chorro se soluciona problema con el saneo de contenidos en peticiones POST y PUT.

## v1.0.0 (2019-03-01)

#### Agregados

- Se empieza el registro de cambios.

