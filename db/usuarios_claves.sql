ALTER USER 'jazz_usr'@'localhost' IDENTIFIED BY 'Contraseña de usuario aquí';
ALTER USER 'jazz_wm'@'localhost' IDENTIFIED BY 'Contraseña de webmaster aquí';

-- Usuario para crear el pool de conexiones
ALTER USER 'sinPrivilegios'@'localhost' IDENTIFIED BY 'Contraseña de usuario sinPrivilegios aquí';
