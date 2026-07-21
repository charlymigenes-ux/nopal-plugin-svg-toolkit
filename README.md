# Herramientas SVG (plugin de NOPAL)

Plugin frontend para preparar archivos SVG destinados a corte láser y CNC. Conserva el original en memoria, genera una copia optimizada y permite comparar ambos resultados antes de exportar.

## Funciones

- Sanea contenido activo y metadatos innecesarios.
- Elimina geometría vacía y duplicados exactos.
- Une segmentos de línea colineales que comparten extremos.
- Simplifica polilíneas, polígonos y paths de un solo contorno con tolerancia configurable.
- Ordena los contornos de primer nivel por cercanía para reducir recorridos en vacío.
- Exporta el SVG optimizado o lo guarda en la Biblioteca de NOPAL mediante `/api/upload`.

## Instalación en NOPAL

NOPAL clona cada plugin desde su propio repositorio. Cuando este repositorio esté publicado, la entrada `svg-toolkit` de `backend/plugin_catalog.json` debe cambiar a:

```json
{
  "availability": "available",
  "repo_url": "https://github.com/charlymigenes-ux/nopal-plugin-svg-toolkit.git"
}
```

Después se instala desde **Configuración → Galería de plugins → Herramientas SVG**. NOPAL clona el repositorio en `plugins/svg-toolkit/` y carga automáticamente los archivos declarados en `nopal-plugin.json`.

## Desarrollo

El plugin no tiene backend propio ni dependencias de compilación. Su estructura es:

```text
nopal-plugin.json
frontend/
  svg-toolkit.js
  svg-toolkit.css
tests/
  test_plugin_contract.py
```

Validación:

```bash
python -m unittest discover -s tests -v
node --check frontend/svg-toolkit.js
```

La simplificación de curvas convierte paths de un solo subtrazo a segmentos lineales dentro de la tolerancia elegida. Los paths con varios subtrazos se conservan para evitar unir contornos independientes accidentalmente.
