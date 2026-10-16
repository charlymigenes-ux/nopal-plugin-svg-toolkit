---
title: Herramientas SVG: visión general
status: draft
verified_against: "nopal-plugin-svg-toolkit@3b55e05 (0.9.0) · nopal@4346f72"
---


# Herramientas SVG

Prepara archivos **SVG para corte láser y CNC**. Conserva el original en memoria, genera una **copia optimizada** y permite **comparar** ambos resultados antes de exportar.

## Qué hace

- **Sanea** contenido activo y metadatos innecesarios.
- **Elimina** geometría vacía y duplicados exactos.
- **Une** segmentos de línea colineales que comparten extremos.
- **Simplifica** polilíneas, polígonos y *paths* de un solo contorno, con tolerancia configurable.
- **Ordena** los contornos de primer nivel por cercanía, para reducir los recorridos en vacío.
- **Exporta** el SVG optimizado o lo **guarda en la biblioteca** de NOPAL mediante `/api/upload`.

## Alcance

**Solo frontend**, sin backend propio ni dependencias de compilación. Compatible con **láser y CNC**.

## Límite de la simplificación de curvas

Convierte los *paths* de un solo subtrazo a segmentos lineales dentro de la tolerancia elegida. Los *paths* con **varios subtrazos se conservan** tal cual, para no unir contornos independientes por accidente.

[Instalación](installation.md) · [Configuración](configuration.md) · [API](api.md) · [Solución de problemas](troubleshooting.md)
