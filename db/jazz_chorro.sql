CREATE DATABASE IF NOT EXISTS `jazz_chorro` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `jazz_chorro`;

CREATE TABLE `contenidos` (
  `id` varchar(30) NOT NULL DEFAULT '',
  `en` text NOT NULL,
  `es` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

ALTER TABLE `contenidos`
  ADD PRIMARY KEY (`id`);
