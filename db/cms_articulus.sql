CREATE DATABASE IF NOT EXISTS `cms_articulus` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cms_articulus`;

CREATE TABLE `blog_articulos` (
  `id` mediumint(7) UNSIGNED NOT NULL,
  `idBlog` mediumint(7) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `copete` varchar(255) NOT NULL,
  `tituloUrl` varchar(200) NOT NULL DEFAULT '',
  `titulo` varchar(255) NOT NULL,
  `entradilla` text NOT NULL,
  `texto` text NOT NULL,
  `publicado` tinyint(1) UNSIGNED NOT NULL DEFAULT '0',
  `fechaCreado` datetime NOT NULL,
  `fechaPublicado` datetime NOT NULL,
  `imgPrincipal` varchar(255) NOT NULL DEFAULT '',
  `valoracion` decimal(7,4) UNSIGNED NOT NULL DEFAULT '0.0000',
  `totValoraciones` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `auxTexto` varchar(255) NOT NULL,
  `auxFecha` datetime DEFAULT NULL,
  `auxEntero` int(10) NOT NULL DEFAULT '0',
  `auxDecimal` decimal(8,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_arti_cat` (
  `idArti` mediumint(7) UNSIGNED NOT NULL DEFAULT '0',
  `idCat` mediumint(7) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_autores` (
  `uid` int(10) UNSIGNED NOT NULL,
  `nombreAutor` varchar(60) NOT NULL DEFAULT '',
  `autorBase` varchar(60) NOT NULL DEFAULT '',
  `nombreUsuario` varchar(80) NOT NULL DEFAULT '',
  `descripcion` text NOT NULL,
  `activo` tinyint(1) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_autor_blogs` (
  `uid` int(10) UNSIGNED NOT NULL,
  `idBlog` mediumint(7) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Permiso para los autores';

CREATE TABLE `blog_blogs` (
  `id` mediumint(7) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `nombreUrl` varchar(100) NOT NULL DEFAULT '',
  `descripcion` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_categorias` (
  `id` mediumint(7) UNSIGNED NOT NULL,
  `idBlog` mediumint(7) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL DEFAULT '',
  `nombreBase` varchar(100) NOT NULL DEFAULT '',
  `descripcion` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_comentarios` (
  `id` mediumint(7) UNSIGNED NOT NULL,
  `idArti` mediumint(7) UNSIGNED NOT NULL,
  `idPadre` mediumint(7) UNSIGNED NOT NULL,
  `uid` int(10) UNSIGNED NOT NULL,
  `autor` varchar(60) NOT NULL,
  `email` varchar(40) NOT NULL,
  `texto` mediumtext NOT NULL,
  `fecha` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `blog_rating` (
  `uid` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `idArti` mediumint(7) UNSIGNED NOT NULL DEFAULT '0',
  `valor` tinyint(2) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


ALTER TABLE `blog_articulos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tituloUrl` (`tituloUrl`,`idBlog`),
  ADD UNIQUE KEY `titulo` (`titulo`,`idBlog`),
  ADD KEY `idBlog` (`idBlog`),
  ADD KEY `uid` (`uid`),
  ADD KEY `publicado` (`publicado`),
  ADD KEY `fechaCreado` (`fechaCreado`),
  ADD KEY `fechaPublicado` (`fechaPublicado`),
  ADD KEY `valoracion` (`valoracion`),
  ADD KEY `auxEntero` (`auxEntero`),
  ADD KEY `auxFecha` (`auxFecha`),
  ADD KEY `auxTexto` (`auxTexto`);

ALTER TABLE `blog_arti_cat`
  ADD PRIMARY KEY (`idArti`,`idCat`),
  ADD KEY `idCat` (`idCat`);

ALTER TABLE `blog_autores`
  ADD PRIMARY KEY (`uid`),
  ADD KEY `activo` (`activo`),
  ADD KEY `nombre` (`nombreAutor`),
  ADD KEY `autorBase` (`autorBase`),
  ADD KEY `nombreUsuario` (`nombreUsuario`) USING BTREE;

ALTER TABLE `blog_autor_blogs`
  ADD PRIMARY KEY (`uid`,`idBlog`),
  ADD KEY `blog_autor_blogs_ibfk_2` (`idBlog`);

ALTER TABLE `blog_blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombreUrl` (`nombreUrl`),
  ADD KEY `nombre` (`nombre`);

ALTER TABLE `blog_categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`,`idBlog`),
  ADD UNIQUE KEY `nombreBase` (`nombreBase`,`idBlog`) USING BTREE,
  ADD KEY `idBlog` (`idBlog`);

ALTER TABLE `blog_comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idArti` (`idArti`),
  ADD KEY `fecha` (`fecha`),
  ADD KEY `idPadre` (`idPadre`),
  ADD KEY `uid` (`uid`);

ALTER TABLE `blog_rating`
  ADD PRIMARY KEY (`uid`,`idArti`);


ALTER TABLE `blog_articulos`
  MODIFY `id` mediumint(7) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `blog_blogs`
  MODIFY `id` mediumint(7) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `blog_categorias`
  MODIFY `id` mediumint(7) UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `blog_comentarios`
  MODIFY `id` mediumint(7) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `blog_articulos`
  ADD CONSTRAINT `blog_articulos_ibfk_1` FOREIGN KEY (`idBlog`) REFERENCES `blog_blogs` (`id`),
  ADD CONSTRAINT `blog_articulos_ibfk_2` FOREIGN KEY (`uid`) REFERENCES `blog_autores` (`uid`);

ALTER TABLE `blog_arti_cat`
  ADD CONSTRAINT `blog_arti_cat_ibfk_1` FOREIGN KEY (`idArti`) REFERENCES `blog_articulos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_arti_cat_ibfk_2` FOREIGN KEY (`idCat`) REFERENCES `blog_categorias` (`id`) ON DELETE CASCADE;

ALTER TABLE `blog_autor_blogs`
  ADD CONSTRAINT `blog_autor_blogs_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `blog_autores` (`uid`) ON DELETE CASCADE,
  ADD CONSTRAINT `blog_autor_blogs_ibfk_2` FOREIGN KEY (`idBlog`) REFERENCES `blog_blogs` (`id`) ON DELETE CASCADE;

ALTER TABLE `blog_categorias`
  ADD CONSTRAINT `blog_categorias_ibfk_1` FOREIGN KEY (`idBlog`) REFERENCES `blog_blogs` (`id`) ON DELETE CASCADE;

ALTER TABLE `blog_comentarios`
  ADD CONSTRAINT `blog_comentarios_ibfk_1` FOREIGN KEY (`idArti`) REFERENCES `blog_articulos` (`id`) ON DELETE CASCADE;
