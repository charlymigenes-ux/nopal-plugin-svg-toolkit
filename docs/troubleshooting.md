---
title: Herramientas SVG: solución de problemas
status: draft
verified_against: "nopal-plugin-svg-toolkit@3b55e05 (0.9.0) · nopal@4346f72"
---


# Solución de problemas

| Problema | Qué hacer |
|---|---|
| Un *path* con varios subtrazos no se simplifica | Es intencional: se conservan para no unir contornos independientes |
| No puedo guardar en la biblioteca | Comprueba que tu sesión siga activa |

## Pruebas del plugin

```bash
python -m unittest discover -s tests -v
```

```bash
node --check frontend/svg-toolkit.js
```
