(() => {
    'use strict';

    const PLUGIN_ID = 'svg-toolkit';
    const VERSION = '0.9.0';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const GRAPHICS = 'path,polyline,polygon,line,rect,circle,ellipse';
    if (window.NopalPluginRegistry?.[PLUGIN_ID]) return;

    const state = {
        filename: '',
        original: null,
        optimized: null,
        originalText: '',
        optimizedText: '',
        originalMetrics: null,
        optimizedMetrics: null,
        processing: false,
    };

    let root = null;
    let fileInput = null;

    // Mismo patrón que font-library.js (plugins/font-library/frontend):
    // diccionario propio por plugin, sin depender de un t()/i18n global del
    // core (no existe uno expuesto a plugins) -- lee el idioma que el
    // usuario ya eligió en Configuración (mismo localStorage.language).
    const I18N = {
        es: {
            title: 'Herramientas SVG', toolsHeading: 'Herramientas', open: 'Abrir', save: 'Guardar', exportBtn: 'Exportar',
            original: 'Original', optimized: 'Optimizado', openFilePrompt: 'Abre un archivo SVG', dragHere: 'o arrástralo a esta zona',
            optimizedPreviewPlaceholder: 'La vista optimizada aparecerá aquí', nodes: 'Nodos', traces: 'Trazos', contours: 'Contornos',
            size: 'Tamaño', fileLabel: 'Archivo:', none: 'Ninguno', dimensionsLabel: 'Dimensiones:', unitsLabel: 'Unidades:',
            cleanTracesTitle: 'Limpiar trazos', cleanTracesDesc: 'Elimina nodos duplicados y trazos vacíos',
            joinLinesTitle: 'Unir líneas', joinLinesDesc: 'Une segmentos colineales y contiguos',
            simplifyCurvesTitle: 'Simplificar curvas', simplifyCurvesDesc: 'Reduce puntos manteniendo la forma', precision: 'Precisión',
            removeOverlapsTitle: 'Eliminar solapes', removeOverlapsDesc: 'Remueve geometría exactamente superpuesta',
            orderContoursTitle: 'Ordenar contornos', orderContoursDesc: 'Reduce recorridos entre operaciones',
            exportSettings: 'Configuración de exportación', units: 'Unidades', inches: 'pulgadas', optimizedFor: 'Optimizado para',
            laser: 'Láser', cnc: 'CNC', applyAll: 'Aplicar todo', readyToOpen: 'Listo para abrir un SVG',
            processedLocally: 'El archivo se procesa localmente en tu navegador', adjustCompareAria: 'Ajustar comparación',
            compareResultsAria: 'Comparación de resultados', invalidSvg: 'El archivo no contiene un SVG válido.',
            processing: 'Procesando SVG…', applyingTools: 'Aplicando las herramientas seleccionadas', ready: 'Listo',
            processedOk: 'Archivo procesado correctamente', couldNotOptimize: 'No se pudo optimizar',
            couldNotProcess: 'No se pudo procesar el SVG.', undefinedDims: 'Sin definir', pressApplyAll: 'Pulsa Aplicar todo para optimizar',
            selectSvgFile: 'Selecciona un archivo con extensión .svg.', fileTooLarge: 'El SVG supera el límite de 25 MB.',
            openingSvg: 'Abriendo SVG…', svgLoaded: 'SVG cargado', reviewTools: 'Revisa las herramientas y pulsa Aplicar todo',
            invalidFile: 'Archivo inválido', exportedOk: 'SVG optimizado exportado.',
            couldNotSaveLibrary: 'No se pudo guardar el SVG en la biblioteca.', savedToLibrary: 'SVG guardado en la Biblioteca NOPAL.',
        },
        en: {
            title: 'SVG Tools', toolsHeading: 'Tools', open: 'Open', save: 'Save', exportBtn: 'Export',
            original: 'Original', optimized: 'Optimized', openFilePrompt: 'Open an SVG file', dragHere: 'or drag it into this area',
            optimizedPreviewPlaceholder: 'The optimized view will appear here', nodes: 'Nodes', traces: 'Traces', contours: 'Contours',
            size: 'Size', fileLabel: 'File:', none: 'None', dimensionsLabel: 'Dimensions:', unitsLabel: 'Units:',
            cleanTracesTitle: 'Clean traces', cleanTracesDesc: 'Removes duplicate nodes and empty traces',
            joinLinesTitle: 'Join lines', joinLinesDesc: 'Joins collinear, contiguous segments',
            simplifyCurvesTitle: 'Simplify curves', simplifyCurvesDesc: 'Reduces points while keeping the shape', precision: 'Precision',
            removeOverlapsTitle: 'Remove overlaps', removeOverlapsDesc: 'Removes exactly overlapping geometry',
            orderContoursTitle: 'Order contours', orderContoursDesc: 'Reduces travel between operations',
            exportSettings: 'Export settings', units: 'Units', inches: 'inches', optimizedFor: 'Optimized for',
            laser: 'Laser', cnc: 'CNC', applyAll: 'Apply all', readyToOpen: 'Ready to open an SVG',
            processedLocally: 'The file is processed locally in your browser', adjustCompareAria: 'Adjust comparison',
            compareResultsAria: 'Results comparison', invalidSvg: 'The file does not contain a valid SVG.',
            processing: 'Processing SVG…', applyingTools: 'Applying the selected tools', ready: 'Ready',
            processedOk: 'File processed successfully', couldNotOptimize: 'Could not optimize',
            couldNotProcess: 'Could not process the SVG.', undefinedDims: 'Undefined', pressApplyAll: 'Press Apply all to optimize',
            selectSvgFile: 'Select a file with .svg extension.', fileTooLarge: 'The SVG exceeds the 25 MB limit.',
            openingSvg: 'Opening SVG…', svgLoaded: 'SVG loaded', reviewTools: 'Review the tools and press Apply all',
            invalidFile: 'Invalid file', exportedOk: 'Optimized SVG exported.',
            couldNotSaveLibrary: 'Could not save the SVG to the library.', savedToLibrary: 'SVG saved to the NOPAL Library.',
        },
        de: {
            title: 'SVG-Werkzeuge', toolsHeading: 'Werkzeuge', open: 'Öffnen', save: 'Speichern', exportBtn: 'Exportieren',
            original: 'Original', optimized: 'Optimiert', openFilePrompt: 'SVG-Datei öffnen', dragHere: 'oder hierher ziehen',
            optimizedPreviewPlaceholder: 'Die optimierte Ansicht erscheint hier', nodes: 'Knoten', traces: 'Pfade', contours: 'Konturen',
            size: 'Größe', fileLabel: 'Datei:', none: 'Keine', dimensionsLabel: 'Abmessungen:', unitsLabel: 'Einheiten:',
            cleanTracesTitle: 'Pfade bereinigen', cleanTracesDesc: 'Entfernt doppelte Knoten und leere Pfade',
            joinLinesTitle: 'Linien verbinden', joinLinesDesc: 'Verbindet kollineare, angrenzende Segmente',
            simplifyCurvesTitle: 'Kurven vereinfachen', simplifyCurvesDesc: 'Reduziert Punkte unter Beibehaltung der Form', precision: 'Genauigkeit',
            removeOverlapsTitle: 'Überlappungen entfernen', removeOverlapsDesc: 'Entfernt exakt überlappende Geometrie',
            orderContoursTitle: 'Konturen ordnen', orderContoursDesc: 'Reduziert Verfahrwege zwischen Operationen',
            exportSettings: 'Exporteinstellungen', units: 'Einheiten', inches: 'Zoll', optimizedFor: 'Optimiert für',
            laser: 'Laser', cnc: 'CNC', applyAll: 'Alles anwenden', readyToOpen: 'Bereit, eine SVG-Datei zu öffnen',
            processedLocally: 'Die Datei wird lokal in deinem Browser verarbeitet', adjustCompareAria: 'Vergleich anpassen',
            compareResultsAria: 'Ergebnisvergleich', invalidSvg: 'Die Datei enthält kein gültiges SVG.',
            processing: 'SVG wird verarbeitet…', applyingTools: 'Ausgewählte Werkzeuge werden angewendet', ready: 'Bereit',
            processedOk: 'Datei erfolgreich verarbeitet', couldNotOptimize: 'Optimierung fehlgeschlagen',
            couldNotProcess: 'Das SVG konnte nicht verarbeitet werden.', undefinedDims: 'Nicht definiert', pressApplyAll: 'Auf „Alles anwenden" klicken, um zu optimieren',
            selectSvgFile: 'Wähle eine Datei mit der Endung .svg.', fileTooLarge: 'Das SVG überschreitet das Limit von 25 MB.',
            openingSvg: 'SVG wird geöffnet…', svgLoaded: 'SVG geladen', reviewTools: 'Werkzeuge prüfen und auf „Alles anwenden" klicken',
            invalidFile: 'Ungültige Datei', exportedOk: 'Optimiertes SVG exportiert.',
            couldNotSaveLibrary: 'Das SVG konnte nicht in der Bibliothek gespeichert werden.', savedToLibrary: 'SVG in der NOPAL-Bibliothek gespeichert.',
        },
        fr: {
            title: 'Outils SVG', toolsHeading: 'Outils', open: 'Ouvrir', save: 'Enregistrer', exportBtn: 'Exporter',
            original: 'Original', optimized: 'Optimisé', openFilePrompt: 'Ouvrez un fichier SVG', dragHere: 'ou glissez-le dans cette zone',
            optimizedPreviewPlaceholder: "L'aperçu optimisé apparaîtra ici", nodes: 'Nœuds', traces: 'Tracés', contours: 'Contours',
            size: 'Taille', fileLabel: 'Fichier :', none: 'Aucun', dimensionsLabel: 'Dimensions :', unitsLabel: 'Unités :',
            cleanTracesTitle: 'Nettoyer les tracés', cleanTracesDesc: 'Supprime les nœuds dupliqués et les tracés vides',
            joinLinesTitle: 'Joindre les lignes', joinLinesDesc: 'Joint les segments colinéaires et contigus',
            simplifyCurvesTitle: 'Simplifier les courbes', simplifyCurvesDesc: 'Réduit les points en conservant la forme', precision: 'Précision',
            removeOverlapsTitle: 'Supprimer les chevauchements', removeOverlapsDesc: 'Supprime les géométries exactement superposées',
            orderContoursTitle: 'Ordonner les contours', orderContoursDesc: 'Réduit les déplacements entre opérations',
            exportSettings: "Paramètres d'exportation", units: 'Unités', inches: 'pouces', optimizedFor: 'Optimisé pour',
            laser: 'Laser', cnc: 'CNC', applyAll: 'Tout appliquer', readyToOpen: 'Prêt à ouvrir un SVG',
            processedLocally: 'Le fichier est traité localement dans votre navigateur', adjustCompareAria: 'Ajuster la comparaison',
            compareResultsAria: 'Comparaison des résultats', invalidSvg: 'Le fichier ne contient pas un SVG valide.',
            processing: 'Traitement du SVG…', applyingTools: 'Application des outils sélectionnés', ready: 'Prêt',
            processedOk: 'Fichier traité avec succès', couldNotOptimize: "Échec de l'optimisation",
            couldNotProcess: 'Impossible de traiter le SVG.', undefinedDims: 'Non définies', pressApplyAll: 'Appuyez sur « Tout appliquer » pour optimiser',
            selectSvgFile: "Sélectionnez un fichier avec l'extension .svg.", fileTooLarge: 'Le SVG dépasse la limite de 25 Mo.',
            openingSvg: 'Ouverture du SVG…', svgLoaded: 'SVG chargé', reviewTools: 'Vérifiez les outils et appuyez sur « Tout appliquer »',
            invalidFile: 'Fichier invalide', exportedOk: 'SVG optimisé exporté.',
            couldNotSaveLibrary: "Impossible d'enregistrer le SVG dans la bibliothèque.", savedToLibrary: 'SVG enregistré dans la bibliothèque NOPAL.',
        },
        'pt-BR': {
            title: 'Ferramentas SVG', toolsHeading: 'Ferramentas', open: 'Abrir', save: 'Salvar', exportBtn: 'Exportar',
            original: 'Original', optimized: 'Otimizado', openFilePrompt: 'Abra um arquivo SVG', dragHere: 'ou arraste-o para esta área',
            optimizedPreviewPlaceholder: 'A visualização otimizada aparecerá aqui', nodes: 'Nós', traces: 'Traços', contours: 'Contornos',
            size: 'Tamanho', fileLabel: 'Arquivo:', none: 'Nenhum', dimensionsLabel: 'Dimensões:', unitsLabel: 'Unidades:',
            cleanTracesTitle: 'Limpar traços', cleanTracesDesc: 'Remove nós duplicados e traços vazios',
            joinLinesTitle: 'Unir linhas', joinLinesDesc: 'Une segmentos colineares e contíguos',
            simplifyCurvesTitle: 'Simplificar curvas', simplifyCurvesDesc: 'Reduz pontos mantendo a forma', precision: 'Precisão',
            removeOverlapsTitle: 'Remover sobreposições', removeOverlapsDesc: 'Remove geometria exatamente sobreposta',
            orderContoursTitle: 'Ordenar contornos', orderContoursDesc: 'Reduz deslocamentos entre operações',
            exportSettings: 'Configurações de exportação', units: 'Unidades', inches: 'polegadas', optimizedFor: 'Otimizado para',
            laser: 'Laser', cnc: 'CNC', applyAll: 'Aplicar tudo', readyToOpen: 'Pronto para abrir um SVG',
            processedLocally: 'O arquivo é processado localmente no seu navegador', adjustCompareAria: 'Ajustar comparação',
            compareResultsAria: 'Comparação de resultados', invalidSvg: 'O arquivo não contém um SVG válido.',
            processing: 'Processando SVG…', applyingTools: 'Aplicando as ferramentas selecionadas', ready: 'Pronto',
            processedOk: 'Arquivo processado com sucesso', couldNotOptimize: 'Não foi possível otimizar',
            couldNotProcess: 'Não foi possível processar o SVG.', undefinedDims: 'Não definidas', pressApplyAll: 'Pressione Aplicar tudo para otimizar',
            selectSvgFile: 'Selecione um arquivo com extensão .svg.', fileTooLarge: 'O SVG excede o limite de 25 MB.',
            openingSvg: 'Abrindo SVG…', svgLoaded: 'SVG carregado', reviewTools: 'Revise as ferramentas e pressione Aplicar tudo',
            invalidFile: 'Arquivo inválido', exportedOk: 'SVG otimizado exportado.',
            couldNotSaveLibrary: 'Não foi possível salvar o SVG na biblioteca.', savedToLibrary: 'SVG salvo na Biblioteca NOPAL.',
        },
    };

    function lang() {
        const raw = document.documentElement.lang || localStorage.getItem('language') || 'es';
        if (raw.toLowerCase().startsWith('pt')) return 'pt-BR';
        const short = raw.slice(0, 2).toLowerCase();
        return ['es', 'en', 'de', 'fr'].includes(short) ? short : 'en';
    }

    function tr(key) { return I18N[lang()]?.[key] || I18N.en[key] || key; }

    const icon = (body, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const esc = value => typeof window.escapeHtml === 'function'
        ? window.escapeHtml(value)
        : String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const toast = (message, tone = 'success') => typeof window.showToast === 'function'
        ? window.showToast(message, tone)
        : console[tone === 'error' ? 'error' : 'log'](message);
    const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const near = (a, b, tolerance) => distance(a, b) <= tolerance;
    const formatNumber = value => Number(Number(value).toFixed(4)).toString();
    const formatBytes = value => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(2)} MB`;

    function moduleHtml() {
        const diamond = '<path d="m5 3 14 0 2 7-9 11-9-11Z"/><path d="M5 3l7 18L19 3M3 10h18"/>';
        return `
            <section id="svg-toolkit-section" class="view-section svgt-section" style="display:none">
                <main class="svgt-shell">
                    <header class="svgt-header svgt-card">
                        <div class="svgt-brand-icon">${icon(diamond, 25)}</div>
                        <div class="svgt-heading">
                            <span>NOPAL LABS · v${VERSION}</span>
                            <h1>${tr('title')}</h1>
                        </div>
                        <div class="svgt-file-actions">
                            <button type="button" id="svgt-open">${icon('<path d="M3 7h6l2 2h10v10H3z"/>')} ${tr('open')}</button>
                            <button type="button" id="svgt-save" disabled>${icon('<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-8h8v8"/>')} ${tr('save')}</button>
                            <button type="button" class="primary" id="svgt-export" disabled>${icon('<path d="M12 3v12m-5-5 5 5 5-5M4 19h16"/>')} ${tr('exportBtn')}</button>
                            <input id="svgt-file" type="file" accept=".svg,image/svg+xml" hidden>
                        </div>
                    </header>

                    <div class="svgt-layout">
                        <section class="svgt-workspace svgt-card">
                            <div class="svgt-dropzone" id="svgt-dropzone">
                                <div class="svgt-preview-grid">
                                    <article class="svgt-preview-pane">
                                        <span class="svgt-preview-label">${tr('original')}</span>
                                        <div class="svgt-preview" id="svgt-original-preview">
                                            <div class="svgt-empty">${icon(diamond, 48)}<strong>${tr('openFilePrompt')}</strong><span>${tr('dragHere')}</span></div>
                                        </div>
                                    </article>
                                    <div class="svgt-compare-handle" id="svgt-compare-handle" role="separator" aria-label="${tr('adjustCompareAria')}" aria-orientation="vertical" aria-valuemin="15" aria-valuemax="85" aria-valuenow="50" tabindex="0">${icon('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>', 20)}</div>
                                    <article class="svgt-preview-pane">
                                        <span class="svgt-preview-label">${tr('optimized')}</span>
                                        <div class="svgt-preview" id="svgt-optimized-preview">
                                            <div class="svgt-empty"><span>${tr('optimizedPreviewPlaceholder')}</span></div>
                                        </div>
                                    </article>
                                </div>
                            </div>

                            <div class="svgt-metrics" aria-label="${tr('compareResultsAria')}">
                                <div class="svgt-metric-row svgt-before"><strong>${tr('original')}</strong><span>${tr('nodes')} <b id="svgt-before-nodes">—</b></span><span>${tr('traces')} <b id="svgt-before-traces">—</b></span><span>${tr('contours')} <b id="svgt-before-contours">—</b></span><span>${tr('size')} <b id="svgt-before-size">—</b></span></div>
                                <div class="svgt-metric-row svgt-after"><strong>${tr('optimized')}</strong><span>${tr('nodes')} <b id="svgt-after-nodes">—</b><i id="svgt-nodes-delta"></i></span><span>${tr('traces')} <b id="svgt-after-traces">—</b><i id="svgt-traces-delta"></i></span><span>${tr('contours')} <b id="svgt-after-contours">—</b><i id="svgt-contours-delta"></i></span><span>${tr('size')} <b id="svgt-after-size">—</b><i id="svgt-size-delta"></i></span></div>
                            </div>

                            <footer class="svgt-filebar">
                                <span>${tr('fileLabel')} <strong id="svgt-filename">${tr('none')}</strong></span>
                                <span>${tr('dimensionsLabel')} <strong id="svgt-dimensions">—</strong></span>
                                <span>${tr('unitsLabel')} <strong id="svgt-units-label">mm</strong></span>
                            </footer>
                        </section>

                        <aside class="svgt-tools svgt-card">
                            <h2>${tr('toolsHeading')}</h2>
                            ${toggleHtml('clean', tr('cleanTracesTitle'), tr('cleanTracesDesc'), true)}
                            ${toggleHtml('join', tr('joinLinesTitle'), tr('joinLinesDesc'), true)}
                            <section class="svgt-tool-block">
                                <div><strong>${tr('simplifyCurvesTitle')}</strong><small>${tr('simplifyCurvesDesc')}</small></div>
                                <label class="svgt-switch"><input id="svgt-simplify" type="checkbox" checked><span></span></label>
                                <label class="svgt-range"><span>${tr('precision')} <b id="svgt-tolerance-label">0.15 mm</b></span><input id="svgt-tolerance" type="range" min="0.01" max="1" value="0.15" step="0.01"></label>
                            </section>
                            ${toggleHtml('overlaps', tr('removeOverlapsTitle'), tr('removeOverlapsDesc'), true)}
                            ${toggleHtml('order', tr('orderContoursTitle'), tr('orderContoursDesc'), true)}
                            <section class="svgt-export-settings">
                                <h3>${tr('exportSettings')}</h3>
                                <label><span>${tr('units')}</span><select id="svgt-units"><option value="mm">mm</option><option value="in">${tr('inches')}</option></select></label>
                                <label><span>${tr('optimizedFor')}</span><select id="svgt-target"><option value="laser">${tr('laser')}</option><option value="cnc">${tr('cnc')}</option></select></label>
                            </section>
                            <button type="button" class="svgt-apply" id="svgt-apply" disabled>${icon('<path d="M12 3v4M12 17v4M4.2 7.5l3.5 2M16.3 14.5l3.5 2M4.2 16.5l3.5-2M16.3 9.5l3.5-2"/><circle cx="12" cy="12" r="3"/>')} ${tr('applyAll')}</button>
                        </aside>
                    </div>
                    <footer class="svgt-status"><i id="svgt-status-dot"></i><strong id="svgt-status-text">${tr('readyToOpen')}</strong><span id="svgt-status-detail">${tr('processedLocally')}</span></footer>
                </main>
            </section>`;
    }

    function toggleHtml(id, title, description, checked) {
        return `<section class="svgt-tool-block"><div><strong>${title}</strong><small>${description}</small></div><label class="svgt-switch"><input id="svgt-${id}" type="checkbox" ${checked ? 'checked' : ''}><span></span></label></section>`;
    }

    function parseSvg(text) {
        const documentNode = new DOMParser().parseFromString(text, 'image/svg+xml');
        if (documentNode.querySelector('parsererror') || documentNode.documentElement.localName !== 'svg') {
            throw new Error(tr('invalidSvg'));
        }
        sanitize(documentNode);
        return documentNode;
    }

    function sanitize(documentNode) {
        documentNode.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach(node => node.remove());
        const walker = documentNode.createTreeWalker(documentNode.documentElement, NodeFilter.SHOW_ELEMENT);
        const elements = [documentNode.documentElement];
        while (walker.nextNode()) elements.push(walker.currentNode);
        elements.forEach(element => [...element.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:'))) {
                element.removeAttribute(attribute.name);
            }
        }));
    }

    function serialize(documentNode) {
        const text = new XMLSerializer().serializeToString(documentNode.documentElement);
        return `<?xml version="1.0" encoding="UTF-8"?>\n${text}`;
    }

    function splitAbsoluteSubpaths(pathData) {
        const subpaths = pathData.match(/[Mm][^Mm]*/g) || [];
        if (subpaths.some((subpath, index) => index > 0 && subpath.startsWith('m'))) return [];
        return subpaths;
    }

    function countNodes(element) {
        if (element.matches('polyline,polygon')) return parsePoints(element.getAttribute('points')).length;
        if (element.matches('line')) return 2;
        if (element.matches('rect')) return 4;
        if (element.matches('circle,ellipse')) return 4;
        if (element.matches('path')) {
            const d = element.getAttribute('d') || '';
            return (d.match(/[a-zA-Z]/g) || []).filter(command => !/[zZ]/.test(command)).length;
        }
        return 0;
    }

    function countTraces(element) {
        if (element.matches('polyline')) return Math.max(0, parsePoints(element.getAttribute('points')).length - 1);
        if (element.matches('polygon')) return parsePoints(element.getAttribute('points')).length;
        if (element.matches('line')) return 1;
        if (element.matches('rect')) return 4;
        if (element.matches('circle,ellipse')) return 1;
        if (element.matches('path')) {
            const commands = (element.getAttribute('d') || '').match(/[a-zA-Z]/g) || [];
            return commands.filter(command => !/[mMzZ]/.test(command)).length;
        }
        return 0;
    }

    function countContours(element) {
        if (!element.matches('path')) return 1;
        return Math.max(1, (element.getAttribute('d') || '').match(/[mM]/g)?.length || 0);
    }

    function dimensions(documentNode) {
        const svg = documentNode.documentElement;
        const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
        const width = number((svg.getAttribute('width') || '').replace(/[a-z%]+/gi, ''), viewBox[2]);
        const height = number((svg.getAttribute('height') || '').replace(/[a-z%]+/gi, ''), viewBox[3]);
        const unitMatch = (svg.getAttribute('width') || '').match(/[a-z]+$/i);
        return { width: width || 0, height: height || 0, unit: unitMatch?.[0] || 'px' };
    }

    function convertLength(value, fromUnit, toUnit) {
        const normalizedFrom = fromUnit === 'in' ? 'in' : fromUnit === 'mm' ? 'mm' : 'px';
        const normalizedTo = toUnit === 'in' ? 'in' : toUnit === 'mm' ? 'mm' : 'px';
        if (normalizedFrom === normalizedTo) return value;
        const inches = normalizedFrom === 'in' ? value : normalizedFrom === 'mm' ? value / 25.4 : value / 96;
        return normalizedTo === 'in' ? inches : normalizedTo === 'mm' ? inches * 25.4 : inches * 96;
    }

    function metrics(documentNode, text = serialize(documentNode)) {
        const elements = [...documentNode.querySelectorAll(GRAPHICS)];
        return {
            nodes: elements.reduce((total, element) => total + countNodes(element), 0),
            traces: elements.reduce((total, element) => total + countTraces(element), 0),
            contours: elements.filter(element => !element.closest('defs,clipPath,mask,pattern')).reduce((total, element) => total + countContours(element), 0),
            size: new Blob([text]).size,
            dimensions: dimensions(documentNode),
        };
    }

    function cleanDocument(documentNode) {
        documentNode.querySelectorAll('metadata,title,desc').forEach(node => node.remove());
        documentNode.querySelectorAll('*').forEach(element => {
            [...element.attributes].forEach(attribute => {
                if (/^(data-|aria-)/.test(attribute.name) || ['id', 'class'].includes(attribute.name)) return;
                if (/^-?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(attribute.value.trim())) {
                    element.setAttribute(attribute.name, formatNumber(attribute.value));
                }
            });
        });
        documentNode.querySelectorAll('path').forEach(path => {
            const d = path.getAttribute('d') || '';
            if (!d.trim()) path.remove();
            else path.setAttribute('d', d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, value => formatNumber(value)).replace(/\s+/g, ' ').trim());
        });
        documentNode.querySelectorAll('polyline,polygon').forEach(shape => {
            const minimum = shape.localName === 'polygon' ? 3 : 2;
            if (parsePoints(shape.getAttribute('points')).length < minimum) shape.remove();
        });
        documentNode.querySelectorAll('line').forEach(line => {
            const a = point(number(line.getAttribute('x1')), number(line.getAttribute('y1')));
            const b = point(number(line.getAttribute('x2')), number(line.getAttribute('y2')));
            if (distance(a, b) < 1e-7) line.remove();
        });
        documentNode.querySelectorAll('rect').forEach(rect => {
            if (number(rect.getAttribute('width')) <= 0 || number(rect.getAttribute('height')) <= 0) rect.remove();
        });
        documentNode.querySelectorAll('circle').forEach(circle => { if (number(circle.getAttribute('r')) <= 0) circle.remove(); });
        documentNode.querySelectorAll('ellipse').forEach(ellipse => {
            if (number(ellipse.getAttribute('rx')) <= 0 || number(ellipse.getAttribute('ry')) <= 0) ellipse.remove();
        });
    }

    function geometrySignature(element) {
        const ignored = new Set(['id', 'class', 'data-name']);
        const attributes = [...element.attributes]
            .filter(attribute => !ignored.has(attribute.name))
            .map(attribute => `${attribute.name}=${attribute.value.replace(/\s+/g, ' ').trim()}`)
            .sort().join('|');
        return `${element.localName}|${attributes}`;
    }

    function removeExactOverlaps(documentNode) {
        const seen = new Set();
        documentNode.querySelectorAll(GRAPHICS).forEach(element => {
            const signature = geometrySignature(element);
            if (seen.has(signature)) element.remove();
            else seen.add(signature);
        });
        documentNode.querySelectorAll('path').forEach(path => {
            const subpaths = splitAbsoluteSubpaths(path.getAttribute('d') || '');
            if (subpaths.length < 2) return;
            const unique = [];
            const signatures = new Set();
            subpaths.forEach(subpath => {
                const signature = subpath.replace(/\s+/g, ' ').trim();
                if (signatures.has(signature)) return;
                signatures.add(signature);
                unique.push(subpath);
            });
            if (unique.length !== subpaths.length) path.setAttribute('d', unique.join(' '));
        });
    }

    function point(x, y) { return { x, y }; }

    function parsePoints(value = '') {
        const values = value.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
        const points = [];
        for (let index = 0; index + 1 < values.length; index += 2) points.push(point(values[index], values[index + 1]));
        return points;
    }

    function pointsAttribute(points) {
        return points.map(item => `${formatNumber(item.x)},${formatNumber(item.y)}`).join(' ');
    }

    function styleSignature(element) {
        return ['stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill', 'style', 'class', 'transform']
            .map(name => `${name}:${element.getAttribute(name) || ''}`).join('|');
    }

    function collinear(a, b, c, tolerance) {
        const length = Math.max(distance(a, b), distance(b, c), 1);
        return Math.abs((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) / length <= tolerance;
    }

    function joinLines(documentNode, tolerance) {
        const parents = new Set([...documentNode.querySelectorAll('line')].map(line => line.parentElement));
        parents.forEach(parent => {
            const byStyle = new Map();
            [...parent.children].filter(element => element.localName === 'line').forEach(line => {
                const signature = styleSignature(line);
                if (!byStyle.has(signature)) byStyle.set(signature, []);
                byStyle.get(signature).push(line);
            });
            byStyle.forEach(lines => {
                const remaining = lines.map(line => ({
                    element: line,
                    a: point(number(line.getAttribute('x1')), number(line.getAttribute('y1'))),
                    b: point(number(line.getAttribute('x2')), number(line.getAttribute('y2'))),
                }));
                while (remaining.length) {
                    const seed = remaining.shift();
                    const chain = [seed.a, seed.b];
                    const used = [seed.element];
                    let changed = true;
                    while (changed) {
                        changed = false;
                        for (let index = 0; index < remaining.length; index += 1) {
                            const segment = remaining[index];
                            const first = chain[0];
                            const last = chain[chain.length - 1];
                            let next = null;
                            if (near(last, segment.a, tolerance) && collinear(chain.at(-2), last, segment.b, tolerance)) next = ['push', segment.b];
                            else if (near(last, segment.b, tolerance) && collinear(chain.at(-2), last, segment.a, tolerance)) next = ['push', segment.a];
                            else if (near(first, segment.b, tolerance) && collinear(segment.a, first, chain[1], tolerance)) next = ['unshift', segment.a];
                            else if (near(first, segment.a, tolerance) && collinear(segment.b, first, chain[1], tolerance)) next = ['unshift', segment.b];
                            if (!next) continue;
                            chain[next[0]](next[1]);
                            used.push(segment.element);
                            remaining.splice(index, 1);
                            changed = true;
                            break;
                        }
                    }
                    if (used.length < 2) continue;
                    const polyline = documentNode.createElementNS(SVG_NS, 'polyline');
                    [...seed.element.attributes].forEach(attribute => {
                        if (!['x1', 'y1', 'x2', 'y2'].includes(attribute.name)) polyline.setAttribute(attribute.name, attribute.value);
                    });
                    polyline.setAttribute('points', pointsAttribute(chain));
                    seed.element.before(polyline);
                    used.forEach(element => element.remove());
                }
            });
        });
    }

    function perpendicularDistance(item, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (dx === 0 && dy === 0) return distance(item, start);
        const t = Math.max(0, Math.min(1, ((item.x - start.x) * dx + (item.y - start.y) * dy) / (dx * dx + dy * dy)));
        return distance(item, point(start.x + t * dx, start.y + t * dy));
    }

    function simplifyPoints(points, tolerance) {
        if (points.length <= 2) return points;
        let maxDistance = 0;
        let splitIndex = 0;
        for (let index = 1; index < points.length - 1; index += 1) {
            const candidate = perpendicularDistance(points[index], points[0], points[points.length - 1]);
            if (candidate > maxDistance) { maxDistance = candidate; splitIndex = index; }
        }
        if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];
        const left = simplifyPoints(points.slice(0, splitIndex + 1), tolerance);
        const right = simplifyPoints(points.slice(splitIndex), tolerance);
        return left.slice(0, -1).concat(right);
    }

    function radialPrefilter(points, tolerance) {
        if (points.length <= 2) return points;
        const filtered = [points[0]];
        let previous = points[0];
        for (let index = 1; index < points.length - 1; index += 1) {
            if (distance(previous, points[index]) < tolerance) continue;
            filtered.push(points[index]);
            previous = points[index];
        }
        filtered.push(points.at(-1));
        return filtered;
    }

    function simplifyPolyShapes(documentNode, tolerance) {
        documentNode.querySelectorAll('polyline,polygon').forEach(element => {
            const closed = element.localName === 'polygon';
            let points = parsePoints(element.getAttribute('points'));
            if (closed && points.length > 2) points = points.concat(points[0]);
            points = simplifyPoints(points, tolerance);
            if (closed) points = points.slice(0, -1);
            element.setAttribute('points', pointsAttribute(points));
        });
    }

    async function simplifyPaths(documentNode, tolerance) {
        const host = document.createElementNS(SVG_NS, 'svg');
        host.setAttribute('width', '0');
        host.setAttribute('height', '0');
        host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;overflow:hidden';
        document.body.appendChild(host);
        const paths = [...documentNode.querySelectorAll('path')];
        for (const path of paths) {
            const d = path.getAttribute('d') || '';
            const subpaths = splitAbsoluteSubpaths(d);
            if (!subpaths.length) continue;
            let changed = false;
            const optimizedSubpaths = [];
            for (let subpathIndex = 0; subpathIndex < subpaths.length; subpathIndex += 1) {
                if (subpathIndex > 0 && subpathIndex % 4 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
                const subpath = subpaths[subpathIndex];
                const probe = path.cloneNode();
                probe.setAttribute('d', subpath);
                host.appendChild(probe);
                try {
                    const length = probe.getTotalLength();
                    if (!Number.isFinite(length) || length <= tolerance * 2) {
                        optimizedSubpaths.push(subpath);
                        continue;
                    }
                    const samples = Math.min(120, Math.max(8, Math.ceil(length / Math.max(tolerance * .75, length / 120))));
                    const points = [];
                    for (let index = 0; index <= samples; index += 1) {
                        const item = probe.getPointAtLength(length * index / samples);
                        points.push(point(item.x, item.y));
                    }
                    const closed = /z\s*$/i.test(subpath.trim()) || near(points[0], points.at(-1), tolerance);
                    const simplified = simplifyPoints(radialPrefilter(points, tolerance * .5), tolerance);
                    const candidate = `M ${simplified.map(item => `${formatNumber(item.x)} ${formatNumber(item.y)}`).join(' L ')}${closed ? ' Z' : ''}`;
                    const originalNodes = (subpath.match(/[a-yA-Y]/g) || []).length;
                    if (simplified.length < originalNodes && candidate.length < subpath.length) {
                        changed = true;
                        optimizedSubpaths.push(candidate);
                    } else {
                        optimizedSubpaths.push(subpath);
                    }
                } catch (_) {
                    optimizedSubpaths.push(subpath);
                } finally {
                    probe.remove();
                }
            }
            if (changed) path.setAttribute('d', optimizedSubpaths.join(' '));
        }
        host.remove();
    }

    function endpoints(element) {
        if (element.localName === 'line') return [point(number(element.getAttribute('x1')), number(element.getAttribute('y1'))), point(number(element.getAttribute('x2')), number(element.getAttribute('y2')))];
        if (element.matches('polyline,polygon')) {
            const points = parsePoints(element.getAttribute('points'));
            return points.length ? [points[0], points.at(-1)] : null;
        }
        if (element.localName === 'rect') {
            const start = point(number(element.getAttribute('x')), number(element.getAttribute('y')));
            return [start, start];
        }
        if (element.matches('circle,ellipse')) {
            const start = point(number(element.getAttribute('cx')) + number(element.getAttribute(element.localName === 'circle' ? 'r' : 'rx')), number(element.getAttribute('cy')));
            return [start, start];
        }
        if (element.localName === 'path') {
            const numbers = (element.getAttribute('d') || '').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
            if (numbers.length >= 2) return [point(numbers[0], numbers[1]), point(numbers.at(-2), numbers.at(-1))];
        }
        return null;
    }

    function orderContours(documentNode) {
        documentNode.querySelectorAll('path').forEach(path => {
            const subpaths = splitAbsoluteSubpaths(path.getAttribute('d') || '');
            if (subpaths.length < 3) return;
            const remainingSubpaths = subpaths.map(subpath => ({ subpath, points: subpathNumbers(subpath) })).filter(item => item.points);
            if (remainingSubpaths.length !== subpaths.length) return;
            const orderedSubpaths = [remainingSubpaths.shift()];
            while (remainingSubpaths.length) {
                const current = orderedSubpaths.at(-1).points.end;
                let bestIndex = 0;
                let bestDistance = Infinity;
                remainingSubpaths.forEach((item, index) => {
                    const candidate = distance(current, item.points.start);
                    if (candidate < bestDistance) { bestDistance = candidate; bestIndex = index; }
                });
                orderedSubpaths.push(remainingSubpaths.splice(bestIndex, 1)[0]);
            }
            path.setAttribute('d', orderedSubpaths.map(item => item.subpath).join(' '));
        });
        const svg = documentNode.documentElement;
        const remaining = [...svg.children].filter(element => element.matches(GRAPHICS) && endpoints(element));
        if (remaining.length < 3) return;
        const ordered = [remaining.shift()];
        while (remaining.length) {
            const current = endpoints(ordered.at(-1))[1];
            let bestIndex = 0;
            let bestDistance = Infinity;
            remaining.forEach((element, index) => {
                const candidate = distance(current, endpoints(element)[0]);
                if (candidate < bestDistance) { bestDistance = candidate; bestIndex = index; }
            });
            ordered.push(remaining.splice(bestIndex, 1)[0]);
        }
        ordered.forEach(element => svg.appendChild(element));
    }

    function subpathNumbers(subpath) {
        const values = subpath.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
        if (values.length < 2) return null;
        const start = point(values[0], values[1]);
        const end = /z\s*$/i.test(subpath.trim()) ? start : point(values.at(-2), values.at(-1));
        return { start, end };
    }

    function applyOutputSettings(documentNode) {
        const svg = documentNode.documentElement;
        const unit = root.querySelector('#svgt-units').value;
        const current = dimensions(documentNode);
        const width = convertLength(current.width, current.unit, unit);
        const height = convertLength(current.height, current.unit, unit);
        if (width > 0) svg.setAttribute('width', `${formatNumber(width)}${unit}`);
        if (height > 0) svg.setAttribute('height', `${formatNumber(height)}${unit}`);
        svg.setAttribute('data-nopal-optimized-for', root.querySelector('#svgt-target').value);
    }

    async function optimize() {
        if (!state.original || state.processing) return;
        state.processing = true;
        setStatus(tr('processing'), tr('applyingTools'), 'working');
        root.querySelector('#svgt-apply').disabled = true;
        await new Promise(resolve => requestAnimationFrame(resolve));
        try {
            const documentNode = state.original.cloneNode(true);
            const outputUnit = root.querySelector('#svgt-units').value;
            const sourceUnit = dimensions(documentNode).unit;
            const tolerance = convertLength(number(root.querySelector('#svgt-tolerance').value, 0.15), outputUnit, sourceUnit);
            if (root.querySelector('#svgt-clean').checked) cleanDocument(documentNode);
            if (root.querySelector('#svgt-join').checked) joinLines(documentNode, tolerance);
            if (root.querySelector('#svgt-simplify').checked) {
                simplifyPolyShapes(documentNode, tolerance);
                await simplifyPaths(documentNode, tolerance);
            }
            if (root.querySelector('#svgt-overlaps').checked) removeExactOverlaps(documentNode);
            if (root.querySelector('#svgt-order').checked) orderContours(documentNode);
            applyOutputSettings(documentNode);
            state.optimized = documentNode;
            state.optimizedText = serialize(documentNode);
            state.optimizedMetrics = metrics(documentNode, state.optimizedText);
            renderPreview('svgt-optimized-preview', state.optimizedText);
            renderMetrics();
            root.querySelector('#svgt-export').disabled = false;
            root.querySelector('#svgt-save').disabled = false;
            setStatus(tr('ready'), tr('processedOk'), 'success');
        } catch (error) {
            console.error(error);
            setStatus(tr('couldNotOptimize'), error.message, 'error');
            toast(error.message || tr('couldNotProcess'), 'error');
        } finally {
            state.processing = false;
            root.querySelector('#svgt-apply').disabled = false;
        }
    }

    function renderPreview(id, text) {
        const container = root.querySelector(`#${id}`);
        container.innerHTML = text;
        const svg = container.querySelector('svg');
        if (svg) {
            svg.removeAttribute('width');
            svg.removeAttribute('height');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
    }

    function delta(after, before) {
        if (!before) return '';
        const percentage = Math.round((after - before) / before * 100);
        return Number.isFinite(percentage) ? `${percentage > 0 ? '+' : ''}${percentage}%` : '0%';
    }

    function renderMetrics() {
        const before = state.originalMetrics;
        const after = state.optimizedMetrics;
        if (!before) return;
        ['nodes', 'traces', 'contours'].forEach(key => {
            root.querySelector(`#svgt-before-${key}`).textContent = before[key].toLocaleString();
            if (after) {
                root.querySelector(`#svgt-after-${key}`).textContent = after[key].toLocaleString();
                root.querySelector(`#svgt-${key}-delta`).textContent = delta(after[key], before[key]);
            }
        });
        root.querySelector('#svgt-before-size').textContent = formatBytes(before.size);
        if (after) {
            root.querySelector('#svgt-after-size').textContent = formatBytes(after.size);
            root.querySelector('#svgt-size-delta').textContent = delta(after.size, before.size);
        }
        const dims = before.dimensions;
        root.querySelector('#svgt-dimensions').textContent = dims.width && dims.height ? `${formatNumber(dims.width)} × ${formatNumber(dims.height)} ${dims.unit}` : tr('undefinedDims');
    }

    async function openFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
            toast(tr('selectSvgFile'), 'error');
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            toast(tr('fileTooLarge'), 'error');
            return;
        }
        setStatus(tr('openingSvg'), file.name, 'working');
        try {
            const rawText = await file.text();
            const documentNode = parseSvg(rawText);
            const safeText = serialize(documentNode);
            state.filename = file.name;
            state.original = documentNode;
            state.originalText = safeText;
            state.originalMetrics = metrics(documentNode, safeText);
            state.optimized = null;
            state.optimizedText = '';
            state.optimizedMetrics = null;
            renderPreview('svgt-original-preview', safeText);
            root.querySelector('#svgt-optimized-preview').innerHTML = `<div class="svgt-empty"><span>${tr('pressApplyAll')}</span></div>`;
            root.querySelector('#svgt-filename').textContent = file.name;
            root.querySelector('#svgt-apply').disabled = false;
            root.querySelector('#svgt-export').disabled = true;
            root.querySelector('#svgt-save').disabled = true;
            renderMetrics();
            setStatus(tr('svgLoaded'), tr('reviewTools'), 'success');
        } catch (error) {
            setStatus(tr('invalidFile'), error.message, 'error');
            toast(error.message, 'error');
        }
    }

    function downloadOptimized() {
        if (!state.optimizedText) return;
        const blob = new Blob([state.optimizedText], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = optimizedFilename();
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        toast(tr('exportedOk'));
    }

    function optimizedFilename() {
        const base = (state.filename || 'diseno.svg').replace(/\.svg$/i, '');
        return `${base}-optimizado.svg`;
    }

    async function saveToLibrary() {
        if (!state.optimizedText) return;
        const button = root.querySelector('#svgt-save');
        button.disabled = true;
        try {
            const form = new FormData();
            form.append('file', new File([state.optimizedText], optimizedFilename(), { type: 'image/svg+xml' }));
            form.append('type', 'model');
            form.append('path', 'Herramientas SVG');
            const response = await fetch('/api/upload', { method: 'POST', body: form });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.detail || tr('couldNotSaveLibrary'));
            }
            toast(tr('savedToLibrary'));
            window.loadModelsFolder?.('');
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            button.disabled = false;
        }
    }

    function setStatus(title, detail, tone = '') {
        root.querySelector('#svgt-status-text').textContent = title;
        root.querySelector('#svgt-status-detail').textContent = detail;
        root.querySelector('#svgt-status-dot').className = tone;
    }

    function setCompareSplit(percentage) {
        const split = Math.max(15, Math.min(85, percentage));
        const grid = root.querySelector('.svgt-preview-grid');
        const handle = root.querySelector('#svgt-compare-handle');
        grid.style.setProperty('--svgt-split', `${split}%`);
        handle.setAttribute('aria-valuenow', String(Math.round(split)));
    }

    function bindCompareHandle() {
        const grid = root.querySelector('.svgt-preview-grid');
        const handle = root.querySelector('#svgt-compare-handle');
        let dragging = false;
        const move = event => {
            if (!dragging) return;
            const bounds = grid.getBoundingClientRect();
            setCompareSplit((event.clientX - bounds.left) / bounds.width * 100);
        };
        handle.addEventListener('pointerdown', event => {
            dragging = true;
            handle.setPointerCapture(event.pointerId);
            handle.classList.add('is-dragging');
            move(event);
        });
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', event => {
            dragging = false;
            handle.releasePointerCapture(event.pointerId);
            handle.classList.remove('is-dragging');
        });
        handle.addEventListener('pointercancel', () => {
            dragging = false;
            handle.classList.remove('is-dragging');
        });
        handle.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const current = number(handle.getAttribute('aria-valuenow'), 50);
            if (event.key === 'Home') setCompareSplit(15);
            else if (event.key === 'End') setCompareSplit(85);
            else setCompareSplit(current + (event.key === 'ArrowRight' ? 5 : -5));
        });
    }

    function updateToleranceLabel() {
        const value = number(root.querySelector('#svgt-tolerance').value, 0.15);
        const unit = root.querySelector('#svgt-units').value;
        root.querySelector('#svgt-tolerance-label').textContent = `${value.toFixed(2)} ${unit}`;
    }

    function bindEvents() {
        fileInput = root.querySelector('#svgt-file');
        root.querySelector('#svgt-open').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async event => {
            await openFile(event.target.files?.[0]);
            event.target.value = '';
        });
        root.querySelector('#svgt-apply').addEventListener('click', optimize);
        root.querySelector('#svgt-export').addEventListener('click', downloadOptimized);
        root.querySelector('#svgt-save').addEventListener('click', saveToLibrary);
        root.querySelector('#svgt-tolerance').addEventListener('input', updateToleranceLabel);
        root.querySelector('#svgt-units').addEventListener('change', event => {
            root.querySelector('#svgt-units-label').textContent = event.target.value;
            updateToleranceLabel();
        });
        const dropzone = root.querySelector('#svgt-dropzone');
        ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
            event.preventDefault();
            dropzone.classList.add('is-dragging');
        }));
        ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
            event.preventDefault();
            dropzone.classList.remove('is-dragging');
        }));
        dropzone.addEventListener('drop', event => openFile(event.dataTransfer?.files?.[0]));
        bindCompareHandle();
    }

    function mount() {
        if (document.getElementById('svg-toolkit-section')) return;
        const pluginsContainer = document.querySelector('.nav-category[data-group="plugins"] .nav-category-items');
        const navButton = document.createElement('button');
        navButton.type = 'button';
        navButton.className = 'nav-item';
        navButton.dataset.section = 'svg-toolkit';
        navButton.dataset.pluginNav = PLUGIN_ID;
        navButton.title = tr('title');
        navButton.innerHTML = `${icon('<path d="m5 3 14 0 2 7-9 11-9-11Z"/><path d="M5 3l7 18L19 3M3 10h18"/>', 20)}<span>${tr('title')}</span>`;
        navButton.addEventListener('click', () => window.switchSection?.('svg-toolkit'));
        pluginsContainer?.appendChild(navButton);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = moduleHtml();
        root = wrapper.firstElementChild;
        document.querySelector('.content')?.appendChild(root);
        bindEvents();
        window.applySidebarOrder?.();
    }

    function unmount() {
        document.querySelector(`[data-plugin-nav="${PLUGIN_ID}"]`)?.remove();
        document.getElementById('svg-toolkit-section')?.remove();
        root = fileInput = null;
        Object.assign(state, { filename: '', original: null, optimized: null, originalText: '', optimizedText: '', originalMetrics: null, optimizedMetrics: null, processing: false });
    }

    window.NopalPluginRegistry = window.NopalPluginRegistry || {};
    window.NopalPluginRegistry[PLUGIN_ID] = { mount, unmount, version: VERSION };
    mount();
})();
