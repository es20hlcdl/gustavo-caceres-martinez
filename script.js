document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initSmoothScroll();
    initMobileNav();
    initCounters();
    initHeroGlobe();
    initCareerMap();
    initStudentsMap();
});

function initReveal() {
    const revealItems = document.querySelectorAll('.reveal');
    if (!revealItems.length) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => observer.observe(item));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) {
        return;
    }

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        toggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            toggle.textContent = '☰';
        });
    });
}

function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach((counter) => {
        const target = Number(counter.dataset.count);
        const start = target - 12;
        const duration = 1200;
        const startTime = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const value = Math.floor(start + (target - start) * progress);
            counter.textContent = String(value);
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    });
}

function initHeroGlobe() {
    const canvas = document.getElementById('hero-globe');
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
        return;
    }

    const capitalCities = [
        { name: 'Cobija', lon: -68.77, lat: -11.03 },
        { name: 'Trinidad', lon: -64.9, lat: -14.83 },
        { name: 'Cochabamba', lon: -66.16, lat: -17.39 },
        { name: 'La Paz', lon: -68.15, lat: -16.5 },
        { name: 'Oruro', lon: -67.11, lat: -17.97 },
        { name: 'Potosi', lon: -65.75, lat: -19.58 },
        { name: 'Santa Cruz', lon: -63.18, lat: -17.78 },
        { name: 'Sucre', lon: -65.26, lat: -19.04 },
        { name: 'Tarija', lon: -64.73, lat: -21.53 }
    ];

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let time = 0;
    let hoveredCity = null;
    let boliviaShape = [];
    let shapeBounds = {
        minLon: -69.7,
        maxLon: -57.4,
        minLat: -22.95,
        maxLat: -9.65
    };

    function resize() {
        const bounds = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        if (!animationFrameId) {
            render();
        }
    }

    function getHoveredCity(clientX, clientY) {
        const bounds = canvas.getBoundingClientRect();
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;

        return capitalCities.find((city) => {
            const point = projectBolivia(city.lon, city.lat);
            const radius = city.name === 'La Paz' || city.name === 'Santa Cruz' ? 8 : 7;
            return Math.hypot(point.x - x, point.y - y) <= radius;
        }) || null;
    }

    function projectBolivia(lon, lat) {
        const lonSpan = shapeBounds.maxLon - shapeBounds.minLon;
        const latSpan = shapeBounds.maxLat - shapeBounds.minLat;
        const x = ((lon - shapeBounds.minLon) / lonSpan) * width * 0.66 + width * 0.17;
        const y = ((shapeBounds.maxLat - lat) / latSpan) * height * 0.82 + height * 0.08;
        return { x, y };
    }

    function simplifyPoints(points, step) {
        if (points.length <= step) {
            return points;
        }

        const simplified = points.filter((_, index) => index % step === 0);
        const first = points[0];
        const last = simplified[simplified.length - 1];
        if (last[0] !== first[0] || last[1] !== first[1]) {
            simplified.push(first);
        }
        return simplified;
    }

    async function loadBoliviaShape() {
        try {
            const response = await fetch('data/Bolivia.geojson');
            const geojson = await response.json();
            const features = geojson.features || [];
            const multipolygon = features[0]?.geometry?.coordinates || [];
            const rings = multipolygon
                .flatMap((polygon) => polygon)
                .filter((ring) => Array.isArray(ring) && ring.length > 0);

            if (!rings.length) {
                return;
            }

            const primaryRing = rings.reduce((largest, ring) => (
                ring.length > largest.length ? ring : largest
            ), rings[0]);

            boliviaShape = simplifyPoints(primaryRing, 22);

            const lons = boliviaShape.map(([lon]) => lon);
            const lats = boliviaShape.map(([, lat]) => lat);
            shapeBounds = {
                minLon: Math.min(...lons),
                maxLon: Math.max(...lons),
                minLat: Math.min(...lats),
                maxLat: Math.max(...lats)
            };
            if (!animationFrameId) {
                render();
            }
        } catch (error) {
            console.error('No se pudo cargar Bolivia.geojson', error);
        }
    }
    function createGridPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 12;
        patternCanvas.height = 12;
        const patternContext = patternCanvas.getContext('2d');
        if (!patternContext) {
            return null;
        }

        patternContext.fillStyle = 'rgba(20, 24, 28, 0.72)';
        patternContext.fillRect(0, 0, 12, 12);

        patternContext.fillStyle = 'rgba(230, 232, 234, 0.62)';
        patternContext.fillRect(1, 1, 4, 4);
        patternContext.fillRect(7, 1, 4, 4);
        patternContext.fillRect(1, 7, 4, 4);
        patternContext.fillRect(7, 7, 4, 4);

        return context.createPattern(patternCanvas, 'repeat');
    }

    function drawShapes() {
        if (!boliviaShape.length) {
            return;
        }

        context.save();
        context.beginPath();
        boliviaShape.forEach(([lon, lat], index) => {
            const point = projectBolivia(lon, lat);
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.closePath();

        const pattern = createGridPattern();
        if (pattern) {
            context.fillStyle = pattern;
            context.globalAlpha = 0.52;
        } else {
            context.fillStyle = 'rgba(210, 214, 218, 0.26)';
        }
        context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = 'rgba(223, 243, 248, 0.72)';
        context.lineWidth = 1.4;
        context.stroke();
        context.restore();
    }

    function drawCapitalNodes() {
        if (!boliviaShape.length) {
            return;
        }

        context.save();
        capitalCities.forEach((city, index) => {
            const point = projectBolivia(city.lon, city.lat);
            const radius = city.name === 'La Paz' || city.name === 'Santa Cruz' ? 5 : 4;

             if (city.name === 'Santa Cruz') {
                [16, 10].forEach((ring, ringIndex) => {
                    context.beginPath();
                    context.arc(point.x, point.y, ring + Math.sin(time * 0.05) * 1.2, 0, Math.PI * 2);
                    context.strokeStyle = `rgba(243, 192, 58, ${0.2 - ringIndex * 0.07})`;
                    context.lineWidth = 4 - ringIndex;
                    context.stroke();
                });
            }

            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI * 2);
            context.fillStyle = index % 2 === 0 ? 'rgba(243, 192, 58, 0.95)' : 'rgba(223, 243, 248, 0.95)';
            context.fill();

            context.beginPath();
            context.arc(point.x, point.y, radius + 2.2, 0, Math.PI * 2);
            context.strokeStyle = 'rgba(223, 243, 248, 0.22)';
            context.lineWidth = 1;
            context.stroke();
        });
        context.restore();
    }

    function drawTooltip() {
        if (!hoveredCity) {
            return;
        }

        const point = projectBolivia(hoveredCity.lon, hoveredCity.lat);
        const label = hoveredCity.name;
        context.save();
        context.font = "600 13px 'JetBrains Mono'";
        const textWidth = context.measureText(label).width;
        const paddingX = 10;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = 30;
        const boxX = Math.min(Math.max(point.x - boxWidth / 2, 12), width - boxWidth - 12);
        const boxY = Math.max(point.y - 42, 12);

        context.fillStyle = 'rgba(31, 42, 49, 0.94)';
        context.strokeStyle = 'rgba(243, 201, 138, 0.28)';
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        context.fill();
        context.stroke();

        context.fillStyle = 'rgba(243, 246, 247, 0.96)';
        context.textBaseline = 'middle';
        context.fillText(label, boxX + paddingX, boxY + boxHeight / 2);
        context.restore();
    }

    function drawBackground() {
        const background = context.createLinearGradient(0, 0, width, height);
        background.addColorStop(0, '#243139');
        background.addColorStop(0.55, '#2b3942');
        background.addColorStop(1, '#1f2a31');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);

        context.save();
        context.globalAlpha = 0.08;
        for (let i = 0; i < 60; i += 1) {
            const y = (i / 60) * height;
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y + Math.sin(i * 0.8) * 10);
            context.strokeStyle = 'rgba(243, 201, 138, 0.16)';
            context.lineWidth = 1;
            context.stroke();
        }
        context.restore();
    }

    function render() {
        context.clearRect(0, 0, width, height);
        drawBackground();
        drawShapes();
        drawCapitalNodes();
        drawTooltip();
        time += 1;
        animationFrameId = requestAnimationFrame(render);
    }

    resize();
    loadBoliviaShape();
    cancelAnimationFrame(animationFrameId);
    render();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', (event) => {
        hoveredCity = getHoveredCity(event.clientX, event.clientY);
        canvas.style.cursor = hoveredCity ? 'pointer' : 'default';
    });
    canvas.addEventListener('mouseleave', () => {
        hoveredCity = null;
        canvas.style.cursor = 'default';
    });
    window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrameId), { once: true });
}

function initCareerMap() {
    const mapElement = document.getElementById('career-map');
    if (!mapElement || typeof L === 'undefined') {
        return;
    }

    const map = L.map(mapElement, {
        center: [-17.2, -62.8],
        zoom: 6,
        scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    let boliviaLayer = null;
    let regionsLayer = null;
    let departmentLayer = null;
    let departmentsBoliviaLayer = null;
    const featuredRegions = new Set([
        'metropolitana',
        'norte integrado',
        'chiquitania',
        'valles',
        'chaco cruceno'
    ]);
    const regionProjects = {
        metropolitana: {
            title: 'Metropolitana',
            projects: [
                'Investigacion sobre CORS RENA.',                
                'Analisis de la serie temporal de la estacion GNSS SCRZ.',
                'Docente en la materia de Rutas y Mapas digitales.',
                'Docente de postgrado en el módulo de catastro multifinalitario y desarrollo urbano.'
            ]
        },
        'norte integrado': {
            title: 'Norte Integrado',
            projects: [
                'Actualizacion catastral urbana con equipos GNSS, migracion de información territorial a SIG',
                'Asistencia en proyectos de delimitación y homologación de áreas urbanas.',
                'Apoyo a la formulación de propuesta para la creación de nuevos distritos urbanos-rurales.'
            ]
        },
        chiquitania: {
            title: 'Chiquitanía',
            projects: [
                'Asistencia SIG en la crisis de incendios forestales de 2020.',
                'Adminitración del sistema municipal de alerta temprana (SMAT)',
                'Cartografia y urbanismo municipal en San Miguel de Velasco.',
                'Catastro, drones y alerta temprana para gestion territorial municipal.',
                'Estructuración del catastro multifinalitario en SIG libre'
            ]
        },
        valles: {
            title: 'Valles',
            projects: [
                'Levantamiento topografia para proyectos de sistemas de riego.'
            ]
        },
        'chaco cruceno': {
            title: 'Chaco Cruceño',
            projects: [
                'Levantamiento topografico para planta de tratamiento de aguas residuales.'
            ]
        }
    };

    function normalizeRegionName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    function getRegionLayerStyle(feature) {
        const regionName = normalizeRegionName(feature?.properties?.Regiones);
        const isFeatured = featuredRegions.has(regionName);

        return {
            color: isFeatured ? 'rgba(243, 201, 138, 0.9)' : 'rgba(130, 196, 172, 0.18)',
            weight: isFeatured ? 1.6 : 0.8,
            fillColor: isFeatured ? '#d6723f' : '#5a8b63',
            fillOpacity: isFeatured ? 0.16 : 0.02
        };
    }

    function getDepartmentLayerStyle() {
        return {
            color: '#fff4d6',
            weight: 2,
            opacity: 0.95,
            fillOpacity: 0
        };
    }

    function getDepartmentsBoliviaLayerStyle() {
        return {
            color: 'rgba(243, 201, 138, 0.42)',
            weight: 0.95,
            opacity: 0.8,
            fillColor: '#76a5a0',
            fillOpacity: 0.03
        };
    }

    function getBoliviaLayerStyle() {
        return {
            color: 'rgba(173, 191, 201, 0.45)',
            weight: 1.6,
            opacity: 0.85,
            fillOpacity: 0
        };
    }

    function getRegionPopupHtml(feature) {
        const regionName = normalizeRegionName(feature?.properties?.Regiones);
        const regionInfo = regionProjects[regionName];
        if (!regionInfo) {
            return '';
        }

        const projectsHtml = regionInfo.projects
            .map((project) => `<li style="margin-bottom:6px;">${project}</li>`)
            .join('');

        return `
            <div style="min-width:240px; font-family: Manrope, sans-serif;">
                <div style="font-family: JetBrains Mono, monospace; color:#f0c36a; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:6px;">Region</div>
                <div style="font-size:18px; margin-bottom:10px; color:#f5ecdb;">${regionInfo.title}</div>
                <div style="font-size:13px; line-height:1.6; color:rgba(245,236,219,0.9); margin-bottom:6px;">Proyectos desarrollados:</div>
                <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.6; color:rgba(245,236,219,0.9);">
                    ${projectsHtml}
                </ul>
            </div>
        `;
    }

    function onEachRegionFeature(feature, layer) {
        const regionName = normalizeRegionName(feature?.properties?.Regiones);
        if (!featuredRegions.has(regionName)) {
            return;
        }

        const popupHtml = getRegionPopupHtml(feature);
        if (!popupHtml) {
            return;
        }

        layer.bindPopup(popupHtml);
        layer.on('mouseover', () => {
            layer.setStyle({
                color: '#f3c98a',
                weight: 2.2,
                fillOpacity: 0.22
            });
        });
        layer.on('mouseout', () => {
            regionsLayer?.resetStyle(layer);
        });
    }

    async function ensureRegionsLayer() {
        if (regionsLayer) {
            return regionsLayer;
        }

        try {
            const response = await fetch('data/regiones_SC.geojson');
            if (!response.ok) {
                throw new Error('No se pudo cargar data/regiones_SC.geojson');
            }

            const geojson = await response.json();
            regionsLayer = L.geoJSON(geojson, {
                interactive: true,
                style: (feature) => getRegionLayerStyle(feature),
                onEachFeature: onEachRegionFeature
            });

            return regionsLayer;
        } catch (error) {
            console.error('No se pudo cargar el GeoJSON de regiones de Santa Cruz.', error);
            regionsLayer = null;
            return null;
        }
    }

    async function ensureBoliviaLayer() {
        if (boliviaLayer) {
            return boliviaLayer;
        }

        try {
            const response = await fetch('data/Bolivia.geojson');
            if (!response.ok) {
                throw new Error('No se pudo cargar data/Bolivia.geojson');
            }

            const geojson = await response.json();
            boliviaLayer = L.geoJSON(geojson, {
                interactive: false,
                style: () => getBoliviaLayerStyle()
            });

            return boliviaLayer;
        } catch (error) {
            console.error('No se pudo cargar el GeoJSON de Bolivia.', error);
            boliviaLayer = null;
            return null;
        }
    }

    async function ensureDepartmentLayer() {
        if (departmentLayer) {
            return departmentLayer;
        }

        try {
            const response = await fetch('data/SC_DEP.geojson');
            if (!response.ok) {
                throw new Error('No se pudo cargar data/SC_DEP.geojson');
            }

            const geojson = await response.json();
            departmentLayer = L.geoJSON(geojson, {
                interactive: false,
                style: () => getDepartmentLayerStyle()
            });

            return departmentLayer;
        } catch (error) {
            console.error('No se pudo cargar el GeoJSON del departamento de Santa Cruz.', error);
            departmentLayer = null;
            return null;
        }
    }

    async function ensureDepartmentsBoliviaLayer() {
        if (departmentsBoliviaLayer) {
            return departmentsBoliviaLayer;
        }

        try {
            const response = await fetch('data/departamentosBolivia.geojson');
            if (!response.ok) {
                throw new Error('No se pudo cargar data/departamentosBolivia.geojson');
            }

            const geojson = await response.json();
            departmentsBoliviaLayer = L.geoJSON(geojson, {
                interactive: false,
                style: () => getDepartmentsBoliviaLayerStyle()
            });

            return departmentsBoliviaLayer;
        } catch (error) {
            console.error('No se pudo cargar el GeoJSON de departamentos de Bolivia.', error);
            departmentsBoliviaLayer = null;
            return null;
        }
    }

    async function showMunicipalityBoundaries() {
        const nationalLayer = await ensureBoliviaLayer();
        if (nationalLayer && !map.hasLayer(nationalLayer)) {
            nationalLayer.addTo(map);
        }

        const boliviaDepartmentsLayer = await ensureDepartmentsBoliviaLayer();
        if (boliviaDepartmentsLayer && !map.hasLayer(boliviaDepartmentsLayer)) {
            boliviaDepartmentsLayer.addTo(map);
        }

        const baseRegionsLayer = await ensureRegionsLayer();
        if (baseRegionsLayer && !map.hasLayer(baseRegionsLayer)) {
            baseRegionsLayer.addTo(map);
        }

        const santaCruzDepartmentLayer = await ensureDepartmentLayer();
        if (santaCruzDepartmentLayer && !map.hasLayer(santaCruzDepartmentLayer)) {
            santaCruzDepartmentLayer.addTo(map);
            santaCruzDepartmentLayer.bringToFront();
            const departmentBounds = santaCruzDepartmentLayer.getBounds();
            if (departmentBounds.isValid()) {
                map.fitBounds(departmentBounds.pad(0.38), { padding: [26, 26], maxZoom: 5.8 });
            }
        }
    }

    showMunicipalityBoundaries();
}

async function initStudentsMap() {
    const mapElement = document.getElementById('students-map');
    if (!mapElement || typeof L === 'undefined') {
        return;
    }

    const statTotal = document.getElementById('students-total');
    const statMunicipalities = document.getElementById('students-municipalities');
    const boliviaBounds = L.latLngBounds(
        L.latLng(-22.95, -69.8),
        L.latLng(-9.5, -57.3)
    );

    const map = L.map(mapElement, {
        center: [-17.35, -64.65],
        zoom: 5.9,
        preferCanvas: true,
        scrollWheelZoom: true,
        minZoom: 1,
        maxZoom: 18
    });

    map.createPane('studentsDepartments');
    map.getPane('studentsDepartments').style.zIndex = '410';

    map.createPane('studentsMarkers');
    map.getPane('studentsMarkers').style.zIndex = '430';

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        noWrap: true
    }).addTo(map);

    try {
        const boliviaResponse = await fetch('data/Bolivia.geojson');
        if (!boliviaResponse.ok) {
            throw new Error('No se pudo cargar data/Bolivia.geojson');
        }

        const boliviaGeojson = await boliviaResponse.json();
        L.geoJSON(boliviaGeojson, {
            interactive: false,
            style: () => ({
                color: 'rgba(243, 201, 138, 0.5)',
                weight: 1.4,
                opacity: 0.85,
                fillOpacity: 0
            })
        }).addTo(map);
    } catch (error) {
        console.error('No se pudo cargar el limite de Bolivia para el mapa de estudiantes.', error);
    }

    try {
        const departmentsResponse = await fetch('data/departamentosBolivia.geojson');
        if (!departmentsResponse.ok) {
            throw new Error('No se pudo cargar data/departamentosBolivia.geojson');
        }

        const departmentsGeojson = await departmentsResponse.json();
        const departmentsLayer = L.geoJSON(departmentsGeojson, {
            pane: 'studentsDepartments',
            style: () => ({
                color: 'rgba(243, 201, 138, 0.72)',
                weight: 1.1,
                opacity: 0.9,
                fillColor: '#76a5a0',
                fillOpacity: 0.04
            }),
            onEachFeature: (feature, layer) => {
                const departmentName = feature?.properties?.departamen || 'Departamento';

                layer.bindTooltip(escapeHtml(departmentName), {
                    sticky: true,
                    direction: 'top',
                    opacity: 0.92
                });

                layer.on('mouseover', () => {
                    layer.setStyle({
                        color: '#f3c98a',
                        weight: 1.6,
                        fillOpacity: 0.1
                    });
                });

                layer.on('mouseout', () => {
                    departmentsLayer.resetStyle(layer);
                });
            }
        }).addTo(map);
    } catch (error) {
        console.error('No se pudo cargar la capa de departamentos para el mapa de estudiantes.', error);
    }

    try {
        const sources = [
            { group: 'G2 ESAM LATAM', path: 'data/G2_ESAM LATAM.csv' },
            { group: 'G3 ESAM LATAM', path: 'data/G3_ESAM LATAM.csv' }
        ];

        const datasets = await Promise.all(sources.map(async (source) => {
            const response = await fetch(source.path);
            if (!response.ok) {
                throw new Error(`No se pudo cargar ${source.path}`);
            }

            const csvText = await response.text();
            const rows = parseCSV(csvText);

            return rows.map((row) => ({
                group: source.group,
                municipality: getStudentMunicipality(row),
                profession: getStudentProfession(row),
                latLng: getStudentLatLng(row.x, row.y)
            }));
        }));

        const unifranzPregrado = createUnifranzPregradoStudents();
        const allStudents = [...datasets.flat(), ...unifranzPregrado];

        const students = allStudents
            .filter((student) => student.latLng);

        if (!students.length) {
            throw new Error('No se encontraron estudiantes con coordenadas válidas.');
        }

        const municipalityCounts = new Set();
        const markerBounds = [];

        students.forEach((student) => {
            municipalityCounts.add(normalizeMunicipalityKey(student.municipality));
            markerBounds.push(student.latLng);

            const marker = L.circleMarker(student.latLng, {
                pane: 'studentsMarkers',
                radius: 6,
                color: 'rgba(240, 248, 160, 0.98)',
                weight: 1.4,
                fillColor: '#d8eb2f',
                fillOpacity: 0.92
            }).addTo(map);

            marker.bindPopup(`
                <div style="min-width:220px; font-family: Manrope, sans-serif;">
                    <div style="font-size:17px; margin-bottom:8px; color:#f5ecdb;">${escapeHtml(student.profession)}</div>
                    <div style="font-size:13px; line-height:1.65; color:rgba(245,236,219,0.9);">
                        <strong style="color:#f3c98a;">Municipio:</strong> ${escapeHtml(student.municipality)}
                    </div>
                </div>
            `);
        });

        const fitTarget = markerBounds.length ? L.latLngBounds(markerBounds) : boliviaBounds;
        map.fitBounds(fitTarget.pad(0.16), { padding: [26, 26], maxZoom: 6.2 });
        window.setTimeout(() => {
            map.invalidateSize();
            map.fitBounds(fitTarget.pad(0.16), { padding: [26, 26], maxZoom: 6.2 });
        }, 180);

        if (statMunicipalities) {
            statMunicipalities.textContent = String(municipalityCounts.size);
        }
    } catch (error) {
        console.error('No se pudo construir el mapa de estudiantes.', error);
    }
}

function getStudentMunicipality(row) {
    return (
        row['Municipio de residencia'] ||
        row['¿ En qué Gobierno Autónomo Municipal (GAM) ha trabajado? Menciona el últiimo'] ||
        'Municipio no especificado'
    ).trim();
}

function createUnifranzPregradoStudents() {
    const baseLat = -17.77405861149061;
    const baseLng = -63.192474787793884;
    const offsets = [
        [0, 0],
        [0.00022, 0.00012],
        [-0.0002, 0.00011],
        [0.00016, -0.00019],
        [-0.00018, -0.00014],
        [0.00009, 0.00024],
        [-0.00008, 0.00023],
        [0.00024, -0.00007]
    ];

    return offsets.map(([latOffset, lngOffset]) => ({
        group: 'UNIFRANZ Santa Cruz · Pregrado',
        municipality: 'Santa Cruz de la Sierra',
        profession: 'Estudiante',
        professionCategory: 'Otros',
        latLng: L.latLng(baseLat + latOffset, baseLng + lngOffset)
    }));
}

function getStudentProfession(row) {
    const profession = (row['Profesión o área de formación'] || '').trim();
    const otherProfession = (row['Otro - Profesión o área de formación'] || '').trim();

    if (!profession || profession.toLowerCase() === 'other') {
        return otherProfession || 'Profesión no especificada';
    }

    return profession;
}

function getStudentLatLng(rawX, rawY) {
    const lon = Number.parseFloat(rawX);
    const lat = Number.parseFloat(rawY);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
    }

    return L.latLng(lat, lon);
}

function normalizeMunicipalityKey(value) {
    return String(value || 'Municipio no especificado')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function getProfessionSummary(professions) {
    const items = [...professions].filter(Boolean);

    if (!items.length) {
        return 'No especificada';
    }

    if (items.length <= 3) {
        return items.join(', ');
    }

    return `${items.slice(0, 3).join(', ')} y otras`;
}

function parseCSV(csvText) {
    const rows = [];
    let currentField = '';
    let currentRow = [];
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i += 1) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i += 1;
            } else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }

        if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i += 1;
            }

            currentRow.push(currentField);
            currentField = '';

            if (currentRow.some((field) => field !== '')) {
                rows.push(currentRow);
            }

            currentRow = [];
            continue;
        }

        currentField += char;
    }

    if (currentField !== '' || currentRow.length) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    const [headers = [], ...dataRows] = rows;
    return dataRows.map((row) => {
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = row[index] || '';
        });
        return entry;
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
