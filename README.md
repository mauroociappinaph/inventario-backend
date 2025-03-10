# Sistema de Control de Inventario - Backend

## Descripción General

Este repositorio alberga la API REST del Sistema de Control de Inventario. La aplicación se desarrollará con NestJS y TypeScript, conectándose a una base de datos MongoDB a través de Mongoose. La API proporciona endpoints para la autenticación, gestión de productos, registro de movimientos y generación de reportes.

## Tecnologías Utilizadas

- **NestJS con TypeScript:** Para la construcción de una API escalable y modular.
- **MongoDB y Mongoose:** Para la gestión de datos y el manejo de esquemas.
- **JWT y Passport:** Para la autenticación de usuarios y protección de rutas sensibles.
- **Jest:** Para la implementación de pruebas unitarias que garanticen la calidad del código.
- **@nestjs/config (opcional):** Para la gestión organizada de las variables de entorno.
- **Nodemon:** Para reiniciar automáticamente la aplicación durante el desarrollo.
- **Git:** Para el control de versiones con una estrategia basada en ramas.

## Características del Backend

- **Autenticación y Seguridad:** Ofrece funcionalidades para el registro y login de usuarios, utilizando JSON Web Tokens para proteger los endpoints.
- **Gestión de Productos:** Permite la creación, consulta, actualización y eliminación de productos en el inventario.
- **Control de Inventario:** Registra las entradas y salidas de productos, actualizando automáticamente los niveles de stock y generando alertas cuando estos son bajos.
- **Generación de Reportes:** Facilita la creación de informes sobre el consumo y movimientos del inventario.
- **Integración Continua:** Se han configurado despliegues automáticos desde la rama principal (main) mediante Heroku.

## Estructura del Proyecto

El backend está organizado en módulos que separan las funcionalidades de autenticación, productos, inventario y reportes. Cada módulo cuenta con sus controladores, servicios y esquemas, lo que permite un desarrollo modular y un mantenimiento simplificado.

## Configuración y Desarrollo

- Se deben instalar todas las dependencias necesarias para ejecutar el proyecto.
- Se utiliza un archivo de configuración para definir las variables de entorno esenciales (por ejemplo, la conexión a MongoDB y el secreto para JWT).
- El servidor se ejecuta en modo de desarrollo para facilitar las pruebas y la integración de nuevas funcionalidades, utilizando Nodemon para reiniciar automáticamente la aplicación ante cualquier cambio.
- Se recomienda el uso de pruebas unitarias para cada módulo, asegurando la estabilidad y calidad de la API.

## Despliegue

- El backend se despliega en Heroku.
- Cada push en la rama main activa un proceso de despliegue automático, el cual actualiza la aplicación y la hace accesible mediante una URL pública.
- Es importante configurar las variables de entorno necesarias en el panel de Heroku para garantizar el correcto funcionamiento de la aplicación.

## Contribución

- Se debe trabajar en la rama de desarrollo (develop) para implementar nuevas funcionalidades y corregir errores.
- Tras una revisión y validación exhaustiva, los cambios se fusionarán en la rama main para su despliegue en producción.

## Licencia

Este proyecto se distribuye bajo la Licencia MIT.

## Deployment

Cuando estés listo para implementar tu aplicación NestJS en producción, hay algunos pasos clave que puedes seguir para asegurarte de que funcione de la manera más eficiente posible. Consulta la documentación de implementación para obtener más información.

Si buscas una plataforma en la nube para implementar tu aplicación NestJS, visita Mau, nuestra plataforma oficial para desplegar aplicaciones NestJS en AWS. Mau hace que el despliegue sea sencillo y rápido, requiriendo solo unos pocos pasos simples:

```bash
$ npm install -g mau
$ mau deploy
```

Con Mau, puedes desplegar tu aplicación en solo unos pocos clics, permitiéndote concentrarte en desarrollar funcionalidades en lugar de gestionar la infraestructura.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
