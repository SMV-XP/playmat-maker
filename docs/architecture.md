# Estructura del código

La aplicación mantiene React + TypeScript para la interfaz, Konva para el lienzo y Electron para el escritorio. Esta separación no cambia el formato `.playmat` ni agrega dependencias.

## Dónde modificar cada parte

| Responsabilidad | Archivos |
| --- | --- |
| Composición de la pantalla | `src/App.tsx` |
| Barra de acciones, lista de capas y área de trabajo | `src/components/layout/` |
| Lienzo, selección, transformaciones, guías y exportación | `src/components/EditorCanvas.tsx` |
| Dibujo de zonas, logos y medidor | `src/components/canvas/` |
| Recursos y coordenadas de la plantilla | `src/components/canvas/templateAssets.ts` |
| Pestañas de propiedades | `src/components/properties/` |
| Controles reutilizables de formulario | `src/components/properties/Fields.tsx` |
| Coordinación del editor y acciones de capas | `src/hooks/usePlaymatEditor.ts` |
| Historial y estado de cambios sin guardar | `src/hooks/useProjectHistory.ts` |
| Abrir, guardar, importar imágenes y exportar | `src/hooks/useProjectFiles.ts` |
| Atajos de teclado | `src/hooks/useEditorShortcuts.ts` |
| Escala, zoom y cuadrícula | `src/hooks/useCanvasViewport.ts` |
| Dimensiones de imágenes | `src/hooks/useImageDimensions.ts` |
| Carga de imágenes para Konva | `src/hooks/useLoadedImage.ts` |
| Archivos del navegador, geometría y recoloreado | `src/utils/` |
| Modelo del proyecto y dimensiones | `src/types.ts` |
| Estado de interfaz: pestaña y resolución | `src/editorTypes.ts` |
| Proyecto inicial, presets y normalización | `src/defaults.ts` |
| Estilos por área | `src/styles/` |
| Inicio y ciclo de vida de Electron | `electron/main.cjs` |
| Diálogos y lectura/escritura nativa | `electron/fileHandlers.cjs` |
| Puente aislado entre React y Electron | `electron/preload.cjs` |

## Flujo de datos

`App` compone la interfaz y conecta el estado de `usePlaymatEditor` con sus componentes. Los paneles emiten callbacks; los cambios editables pasan por `commit`, que conserva el historial. Las operaciones de archivos se concentran en `useProjectFiles`, con soporte para Electron y navegador.

`EditorWorkspace` reúne el estado visible del lienzo y sus controles. `useCanvasViewport` ajusta la escala al contenedor y mantiene el zoom y la cuadrícula. Las acciones de color, fondo y selección se definen en `usePlaymatEditor`.

`EditorCanvas` coordina las capas de Konva. `ZoneNode`, `LogoNode` y `MemoryGauge` dibujan sus elementos; las funciones de recoloreado y geometría se mantienen separadas de los controles de React.

`PropertyPanel` elige la pestaña activa. Cada pestaña recibe únicamente las propiedades que necesita mediante un contrato tipado. Los imports de tipos no crean dependencias en ejecución.

## Convenciones para nuevos cambios

- Agregar controles en la pestaña correspondiente y compartirlos en `Fields.tsx` cuando se reutilicen.
- Mantener la lectura/escritura de archivos fuera de los componentes visuales.
- Usar `commit` para cambios que deban poder deshacerse; la selección y el zoom son estado de interfaz.
- Mantener los nombres de propiedades del proyecto para conservar compatibilidad con los archivos guardados.
- Agregar estilos en el archivo de su área. `src/styles.css` establece el orden de carga; las reglas adaptables se cargan al final.
- Mantener el acceso nativo en Electron y exponer operaciones concretas mediante el preload.

## Verificación

```bash
npm run typecheck
npm run build:web
npm run test:smoke
```

La prueba de humo compila y abre una ventana oculta de Electron con el renderer de producción y el preload real. Verifica zonas, logos, historial, pestañas, guardado y apertura de proyectos, importación de imágenes y exportación PNG. Sustituye los diálogos nativos por rutas temporales, sin intervenir archivos del usuario. Imprime la ubicación de los artefactos para inspeccionarlos.

El exportador conserva el cálculo de escala existente de Konva. Por redondeo de coma flotante, una salida puede medir un píxel menos; la prueba admite esa tolerancia. La reorganización no modifica este comportamiento.
