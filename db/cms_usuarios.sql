CREATE DATABASE IF NOT EXISTS `cms_usuarios` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cms_usuarios`;

CREATE TABLE `clave_nueva` (
  `email` varchar(40) NOT NULL DEFAULT '',
  `token` char(32) NOT NULL DEFAULT '',
  `tiempo` int(11) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(40) NOT NULL DEFAULT '',
  `clave` varchar(32) NOT NULL DEFAULT '',
  `token` char(32) NOT NULL DEFAULT '',
  `esAdmin` tinyint(1) UNSIGNED NOT NULL DEFAULT '0',
  `nombre` varchar(20) NOT NULL DEFAULT '',
  `apellido` varchar(40) NOT NULL DEFAULT '',
  `alta` date NOT NULL,
  `ultimoLogon` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `pre_registro` (
  `token` char(32) NOT NULL DEFAULT '',
  `email` varchar(40) NOT NULL DEFAULT '',
  `clave` varchar(32) NOT NULL DEFAULT '',
  `nombre` varchar(20) NOT NULL DEFAULT '',
  `apellido` varchar(40) NOT NULL DEFAULT '',
  `tiempo` int(11) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `clave_nueva`
  ADD PRIMARY KEY (`email`,`token`),
  ADD KEY `tiempo` (`tiempo`);

ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uidToken` (`id`,`token`) USING BTREE,
  ADD KEY `nombre` (`nombre`),
  ADD KEY `apellido` (`apellido`),
  ADD KEY `esAdmin` (`esAdmin`);

ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `pre_registro`
  ADD PRIMARY KEY (`token`),
  ADD KEY `tiempo` (`tiempo`);

