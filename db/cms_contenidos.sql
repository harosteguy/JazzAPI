CREATE DATABASE IF NOT EXISTS `cms_contenidos` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cms_contenidos`;

CREATE TABLE `contenidos` (
  `id` varchar(30) NOT NULL DEFAULT '',
  `en` text NOT NULL,
  `es` text NOT NULL,
  `fr` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

ALTER TABLE `contenidos`
  ADD PRIMARY KEY (`id`);
