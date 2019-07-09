CREATE USER 'jazz_usr'@'localhost' IDENTIFIED WITH mysql_native_password AS '***';

GRANT USAGE ON *.* TO 'jazz_usr'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `jazz\_articulus`.* TO 'jazz_usr'@'localhost';
GRANT SELECT ON `jazz\_chorro`.* TO 'jazz_usr'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `jazz\_usuarios`.* TO 'jazz_usr'@'localhost';

CREATE USER 'jazz_wm'@'localhost' IDENTIFIED WITH mysql_native_password AS '***';

GRANT USAGE ON *.* TO 'jazz_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `jazz\_chorro`.* TO 'jazz_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `jazz\_articulus`.* TO 'jazz_wm'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `jazz\_usuarios`.* TO 'jazz_wm'@'localhost';

-- Usuario para crear el pool de conexiones
CREATE USER 'sinPrivilegios'@'localhost' IDENTIFIED WITH mysql_native_password AS '***';

