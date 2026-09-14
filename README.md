# Playmat Maker

Editor de escritorio para crear playmats personalizados de Digimon Card Game. El lienzo usa las dimensiones del template original de Photoshop: **3675 × 2175 px**.

## Desarrollo

Requisitos para desarrollo: Node.js 20 o superior.

```bash
npm install
npm run dev
```

`npm run dev` inicia Vite y abre la aplicación en Electron. Se puede ejecutar desde la terminal integrada de Visual Studio o Visual Studio Code.

## Ejecutable portable

```bash
npm run build
```

El ejecutable se genera en `release/Playmat-Maker-1.2.0-Portable.exe`. Es portable: la persona que lo use no necesita instalar Node.js, npm ni la aplicación.

## Uso

- Elegí o arrastrá una imagen para reemplazar el fondo. En la pestaña **Fondo**, arrastrala sobre el lienzo para reencuadrarla con el mouse.
- Seleccioná una zona para moverla, redimensionarla, rotarla o editar su aspecto. Los presets Security, Breeding, Battle, Deck y Trash usan las capas y proporciones exactas del PSD original.
- Agregá zonas desde los presets o creá una zona personalizada.
- Editá los colores del memory gauge conservando la geometría, los números, el centro partido y la orientación exactos de la capa original del PSD.
- Agregá uno o más logos PNG/WebP; cada logo se puede mover, escalar, rotar, duplicar, ocultar o bloquear.
- Guardá el trabajo como `.playmat` para continuar después.
- Exportá el resultado como PNG en calidad estándar (3675 × 2175 px, 150 DPI) o para imprenta (7350 × 4350 px, 300 DPI).

Atajos: `Ctrl+S` guardar, `Ctrl+Z` deshacer, `Ctrl+Shift+Z` rehacer, `Ctrl+D` duplicar, `Delete` eliminar y flechas para mover la zona seleccionada.
