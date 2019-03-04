CREATE USER 'cms_usr'@'localhost' IDENTIFIED WITH mysql_native_password AS '***';

GRANT USAGE ON *.* TO 'cms_usr'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `cms\_articulus`.* TO 'cms_usr'@'localhost';
GRANT SELECT ON `cms\_chorro`.* TO 'cms_usr'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `cms\_usuarios`.* TO 'cms_usr'@'localhost';

CREATE USER 'cms_wm'@'localhost' IDENTIFIED WITH mysql_native_password AS '***';

GRANT USAGE ON *.* TO 'cms_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `cms\_chorro`.* TO 'cms_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `cms\_articulus`.* TO 'cms_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `cms\_usuarios`.* TO 'cms_wm'@'localhost';
