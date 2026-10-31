# Tabvia

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | **Español** | [Français](./README.fr.md) | [Deutsch](./README.de.md)

Tabvia es un gestor de marcadores que sustituye la página de nueva pestaña del navegador. La versión actual de la extensión es **0.2.5**. Consulta el [registro de cambios](./CHANGELOG.md).

Guarda y organiza enlaces localmente, importa o exporta copias de seguridad JSON y, si lo deseas, sincroniza una instantánea con un servicio de almacenamiento que tú gestionas. Tabvia prioriza el almacenamiento local: no requiere iniciar sesión ni utiliza un servidor propio. La interfaz está disponible en inglés, chino simplificado, chino tradicional, japonés, coreano, español, francés y alemán.

Este repositorio usa un workspace de pnpm. El producto es la extensión Manifest V3 de `apps/extension`. Los marcadores de Tabvia son independientes de la barra de marcadores integrada en el navegador.

- Código fuente: [miss55/happy-tab](https://github.com/miss55/happy-tab)
- Incidencias: [GitHub Issues](https://github.com/miss55/happy-tab/issues)
- Política de privacidad: [página pública](https://miss55.github.io/happy-tab/privacy-policy.html)

## Estructura del repositorio

- `apps/extension`: extensión Chrome MV3 desarrollada con Vite, Vue 3 y TypeScript.
- `docs`: documentación del producto y de su arquitectura.

## Desarrollo

Ejecuta estos comandos desde la raíz del repositorio:

```sh
# Instalar dependencias
pnpm install
# Iniciar el servidor de desarrollo
pnpm dev:extension
# Validar el manifiesto de la extensión
pnpm check:manifest
# Ejecutar las pruebas del frontend
pnpm test
# Compilar la extensión (incluye la comprobación de TypeScript)
pnpm build:extension
```

Activa el modo de desarrollador en `chrome://extensions` (Chrome) o `edge://extensions` (Edge), carga `apps/extension/dist` como extensión sin empaquetar y abre una nueva pestaña.

Consulta la [guía de publicación](./docs/store-listing.md) para preparar el paquete para Chrome Web Store y Microsoft Edge Add-ons, y la [documentación de privacidad](./docs/privacy-policy.md) para la política que requieren ambas tiendas. Tras configurar GitHub Pages para publicar `docs/` desde la rama `main`, puedes introducir `https://miss55.github.io/happy-tab/privacy-policy.html` en los paneles de ambas tiendas.

## Funciones actuales

Están implementados el MVP local de la nueva pestaña y la sincronización opcional de instantáneas con almacenamiento externo.

- Sustituye la nueva pestaña de Chrome. El mismo paquete funciona en Microsoft Edge.
- Muestra las pestañas abiertas agrupadas por ventana y permite cambiar a ellas o cerrarlas.
- Guarda grupos de enlaces, enlaces y tareas en IndexedDB. Las operaciones sobre los datos pasan por la capa de repositorios y Dexie.
- Permite crear, renombrar, eliminar y reordenar grupos de enlaces arrastrándolos.
- Organiza grupos en páginas de marcadores: crea, renombra y reordena páginas, elimina las vacías y mueve grupos o enlaces entre páginas desde sus controles de edición. La navegación rápida, las pestañas del navegador y la lista opcional de tareas son compartidas.
- Guarda pestañas como enlaces mediante un botón o arrastrándolas a un grupo. También permite añadir enlaces escribiendo su URL.
- Abre los enlaces guardados en una nueva pestaña y registra el número de aperturas y la última fecha de apertura.
- Permite ordenar enlaces arrastrándolos dentro de un grupo o entre grupos.
- Permite crear, completar, desmarcar, editar, eliminar y reordenar tareas. La lista está oculta inicialmente y se puede activar en Importar / Exportar.
- Ofrece ocho idiomas, detecta el idioma del navegador y guarda localmente la selección manual.
- Exporta copias JSON con versión e importa datos validados mediante combinación o sustitución. Incluye páginas, grupos, enlaces, tareas, estadísticas de uso y accesos de navegación rápida. El formato v2 conserva la pertenencia a páginas y sigue admitiendo copias v1.
- Incluye los temas Soft, Minimal, Glass, Fluent, OLED y Cyber; modos claro, oscuro y del sistema; colores de acento; fondos incluidos y un fondo local personalizado. La apariencia guardada se aplica antes de cargar la aplicación.
- Ofrece una barra de navegación rápida sobre los marcadores. Añade accesos por URL o arrastrando pestañas o enlaces guardados; permite reordenarlos, editarlos, eliminarlos y deshacer una eliminación durante la sesión actual de la página.
- Distribuye los grupos en un diseño de columnas tipo masonry y asigna colores pastel a sus encabezados, ajustables por grupo.
- Permite sincronizar, de forma opcional, con tu propio Upstash Redis, GitHub Gist, Cloudflare KV, JSONBin o endpoint REST personalizado. Las instantáneas incluyen páginas y accesos de navegación rápida.

Actualiza todos los dispositivos que sincronizas antes de usar varias páginas de marcadores: los clientes antiguos no pueden conservar las colecciones de páginas. Consulta la [guía de páginas de marcadores](./docs/bookmark-pages.md) para conocer la migración y la compatibilidad de copias y sincronización.

Pendiente de mejora o verificación:

- Ampliar la cobertura automatizada más allá de las pruebas unitarias y las comprobaciones de páginas y temas en el navegador.
- Completar las pruebas de regresión de la extensión sin empaquetar en Chrome y Edge.

La sincronización de marcadores nativos del navegador queda fuera del alcance actual.

## Idiomas de la documentación

Los enlaces superiores permiten leer este README en los ocho idiomas de la interfaz. La guía de desarrollo de la extensión, el registro de cambios y los documentos detallados de `docs/` están actualmente en inglés.

## Licencia

[MIT](./LICENSE)
