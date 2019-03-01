CREATE DATABASE IF NOT EXISTS `cms_notificaciones` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cms_notificaciones`;

CREATE TABLE `usuarios` (
  `id` int(7) UNSIGNED NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `idioma` char(2) NOT NULL DEFAULT '',
  `uid` int(7) UNSIGNED NOT NULL DEFAULT 0,
  `ip` varchar(50) NOT NULL DEFAULT '',
  `urlPagina` varchar(255) NOT NULL DEFAULT '',
  `userAgent` varchar(255) NOT NULL DEFAULT '',
  `fecha` datetime DEFAULT NULL,
  `enviados` mediumint(7) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `endpoint` (`endpoint`),
  ADD UNIQUE KEY `p256dh` (`p256dh`),
  ADD UNIQUE KEY `auth` (`auth`),
  ADD KEY `idioma` (`idioma`),
  ADD KEY `uid` (`uid`),
  ADD KEY `urlPagina` (`urlPagina`),
  ADD KEY `userAgent` (`userAgent`),
  ADD KEY `fecha` (`fecha`);

ALTER TABLE `usuarios`
  MODIFY `id` mediumint(7) UNSIGNED NOT NULL AUTO_INCREMENT;
