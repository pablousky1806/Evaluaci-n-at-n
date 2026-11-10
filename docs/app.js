/* ===================== Configuración ===================== */
// Pega aquí la URL de la Web App de Apps Script (termina en /exec).
const CONFIG = {
  ENDPOINT: 'https://script.google.com/macros/s/AKfycbxFAWgrf6ZW-1NrBvqM6H10uFhpfVebicsO-b68xf2yZsQxLpnn-VBcECHzvM6CQ6kl8A/exec',
  IMAGEN_FINAL: 'assets/super_tuna.jpg',
  TIMEOUT_MS: 45000
};

const CODIGOS = ['371', '528', '694', '147', '856'];
const PASOS = [
  'p-bienvenida', 'p-datos', 'p-instrucciones',
  'p-muestra-0', 'p-muestra-1', 'p-muestra-2', 'p-muestra-3', 'p-muestra-4',
  'p-ranking', 'p-favorita', 'p-final'
];
const GENEROS = ['Mujer', 'Hombre', 'Otro', 'Prefiero no responder'];
const CONSUME = ['Sí', 'No'];
const FRECUENCIAS = [
  'Más de 3 veces por semana', '2-3 veces por semana', 'Una vez por semana',
  '2-3 veces al mes', 'Una vez al mes', 'Menos de una vez al mes', 'Nunca'
];
const FORMAS = [
  'Directamente', 'En ensaladas', 'En tostadas o sándwiches', 'Con verduras',
  'Con mayonesa o aderezos', 'En platillos preparados', 'Otro'
];
const AGRADO = [
  ['Me gusta muchísimo', 9], ['Me gusta mucho', 8], ['Me gusta', 7],
  ['Me gusta ligeramente', 6], ['Ni me gusta ni me disgusta', 5],
  ['Me disgusta ligeramente', 4], ['Me disgusta', 3], ['Me disgusta mucho', 2],
  ['Me disgusta muchísimo', 1]
];
const JAR_SALADO = [
  ['Mucho menos salado de lo ideal', 1], ['Un poco menos salado de lo ideal', 2],
  ['Justo como me gusta', 3], ['Un poco más salado de lo ideal', 4],
  ['Mucho más salado de lo ideal', 5]
];
const JAR_INTENSIDAD = [
  ['Mucho menos intenso de lo ideal', 1], ['Un poco menos intenso de lo ideal', 2],
  ['Justo como me gusta', 3], ['Un poco más intenso de lo ideal', 4],
  ['Mucho más intenso de lo ideal', 5]
];
const COMPRA = [
  ['Definitivamente la compraría', 5], ['Probablemente la compraría', 4],
  ['No estoy seguro(a) de comprarla', 3], ['Probablemente no la compraría', 2],
  ['Definitivamente no la compraría', 1]
];

/* ===================== Estado ===================== */
const estado = {
  paso: 0,
  token: generarToken(),
  enviando: false,
  codigosOrden: mezclar(CODIGOS),
  ranking: [null, null, null, null, null]
};

/* ===================== Utilidades ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function generarToken() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function mezclar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function valorRadio(nombre) {
  const r = document.querySelector('input[name="' + nombre + '"]:checked');
  return r ? r.value : null;
}

function opcionesRadio(nombre, opciones) {
  return opciones.map(o => {
    const valor = Array.isArray(o) ? o[1] : o;
    const etiqueta = Array.isArray(o) ? o[0] : o;
    return '<label class="opcion"><input type="radio" name="' + nombre + '" value="' + valor + '"><span>' + etiqueta + '</span></label>';
  }).join('');
}

function opcionesCheck(nombre, opciones) {
  return opciones.map(o =>
    '<label class="opcion"><input type="checkbox" name="' + nombre + '" value="' + o + '"><span>' + o + '</span></label>'
  ).join('');
}

function mostrarError(msg, paso = estado.paso) {
  const box = $('#' + PASOS[paso] + ' .error');
  if (!box) return;
  box.textContent = msg || '';
  box.classList.toggle('visible', !!msg);
  if (msg) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function irA(paso) {
  estado.paso = paso;
  $$('.pantalla').forEach(p => p.classList.remove('activa'));
  $('#' + PASOS[paso]).classList.add('activa');
  $('#barra').style.width = (paso / (PASOS.length - 1) * 100) + '%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===================== Construcción de la interfaz ===================== */
function construirDatos() {
  $('#opciones-genero').innerHTML = opcionesRadio('genero', GENEROS);
  $('#opciones-consume').innerHTML = opcionesRadio('consume', CONSUME);
  $('#opciones-frecuencia').innerHTML = opcionesRadio('frecuencia', FRECUENCIAS);
  $('#opciones-formas').innerHTML = opcionesCheck('forma', FORMAS);

  $('#opciones-consume').addEventListener('change', actualizarConsumo);
  $('#opciones-formas').addEventListener('change', () => {
    const otro = $('input[name="forma"][value="Otro"]').checked;
    $('#campo-otro').classList.toggle('oculto', !otro);
  });
}

// Si no consume, solo "Nunca"; si consume, cualquier frecuencia excepto "Nunca".
function actualizarConsumo() {
  const consume = valorRadio('consume');
  $('#bloque-consumo').classList.toggle('oculto', consume !== 'Sí');
  $$('input[name="frecuencia"]').forEach(r => {
    if (consume === 'No') r.disabled = r.value !== 'Nunca';
    else if (consume === 'Sí') r.disabled = r.value === 'Nunca';
    else r.disabled = false;
    if (r.disabled && r.checked) r.checked = false;
  });
}

function renderRanking() {
  const slots = $('#slots');
  slots.innerHTML = '';
  estado.ranking.forEach((codigo, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (codigo ? ' lleno' : '');
    div.innerHTML = '<span class="num">' + (i + 1) + '</span>' +
      (codigo ? '<strong>Código ' + codigo + '</strong>' : '<span class="ayuda">Posición vacía</span>');
    div.addEventListener('click', () => {
      if (estado.ranking[i]) {
        estado.ranking[i] = null;
        renderRanking();
      }
    });
    slots.appendChild(div);
  });

  const disponibles = $('#disponibles');
  disponibles.innerHTML = '';
  estado.codigosOrden
    .filter(c => estado.ranking.indexOf(c) === -1)
    .forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = c;
      b.addEventListener('click', () => {
        const libre = estado.ranking.indexOf(null);
        if (libre === -1) return;
        estado.ranking[libre] = c;
        renderRanking();
      });
      disponibles.appendChild(b);
    });
}

function construirFavorita() {
  $('#opciones-favorita').innerHTML = opcionesRadio('favorita', estado.codigosOrden);
}

function construirMuestras() {
  const contenedor = $('#muestras');
  for (let i = 0; i < 5; i++) {
    const sec = document.createElement('section');
    sec.className = 'pantalla';
    sec.id = 'p-muestra-' + i;
    sec.innerHTML =
      '<div class="tarjeta">' +
        '<div class="muestra-titulo"><h2>Muestra ' + (i + 1) + ' de 5</h2><span class="insignia">Muestra ' + (i + 1) + '</span></div>' +
        '<h3>Código de la muestra</h3>' +
        '<p class="ayuda">Selecciona el código de la muestra física que estás evaluando. Cada código solo puede usarse una vez.</p>' +
        '<div class="chips" data-chips="' + i + '">' +
          estado.codigosOrden.map(c => '<button type="button" class="chip" data-codigo="' + c + '">' + c + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="tarjeta">' +
        '<h3>¿Qué tanto le gustó esta muestra en general?</h3>' +
        '<div class="opciones">' + opcionesRadio('agrado' + i, AGRADO) + '</div>' +
      '</div>' +
      '<div class="tarjeta">' +
        '<h3>Evaluación de características</h3>' +
        '<h4>Nivel de salado</h4>' +
        '<div class="opciones">' + opcionesRadio('salado' + i, JAR_SALADO) + '</div>' +
        '<h4>Intensidad del sabor a pescado</h4>' +
        '<div class="opciones">' + opcionesRadio('pescado' + i, JAR_INTENSIDAD) + '</div>' +
        '<h4>Intensidad del color</h4>' +
        '<div class="opciones">' + opcionesRadio('color' + i, JAR_INTENSIDAD) + '</div>' +
      '</div>' +
      '<div class="tarjeta">' +
        '<h3>Intención de compra</h3>' +
        '<p>Si esta muestra estuviera disponible en el mercado, ¿qué tan probable sería que la comprara?</p>' +
        '<div class="opciones">' + opcionesRadio('compra' + i, COMPRA) + '</div>' +
      '</div>' +
      '<div class="error" role="alert"></div>' +
      '<div class="botones"><button class="btn btn-primario" type="button" data-siguiente>Siguiente muestra</button></div>';
    contenedor.appendChild(sec);
  }

  $$('[data-chips]').forEach(cont => {
    cont.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip || chip.disabled) return;
      const yaSeleccionado = chip.classList.contains('sel');
      $$('.chip', cont).forEach(c => c.classList.remove('sel'));
      if (!yaSeleccionado) chip.classList.add('sel');
      actualizarCodigos();
    });
  });
}

// Bloquea en cada muestra los códigos ya usados en otra muestra.
function actualizarCodigos() {
  const usados = {};
  $$('[data-chips]').forEach(cont => {
    const sel = $('.chip.sel', cont);
    if (sel) usados[sel.dataset.codigo] = cont.dataset.chips;
  });
  $$('[data-chips]').forEach(cont => {
    const propio = cont.dataset.chips;
    $$('.chip', cont).forEach(ch => {
      const dueno = usados[ch.dataset.codigo];
      ch.disabled = dueno !== undefined && dueno !== propio;
      ch.classList.toggle('sel', dueno === propio);
    });
  });
}

/* ===================== Validaciones ===================== */
function validarPaso(paso) {
  const id = PASOS[paso];

  if (id === 'p-bienvenida') {
    if (!$('#consentimiento').checked) return 'Debes aceptar el consentimiento informado para continuar.';
    return null;
  }

  if (id === 'p-datos') {
    const edad = $('#edad').value.trim();
    if (!/^\d+$/.test(edad) || Number(edad) < 18 || Number(edad) > 120) {
      return 'Ingresa una edad válida (número entero entre 18 y 120 años).';
    }
    if (!valorRadio('genero')) return 'Selecciona una opción de género.';
    const consume = valorRadio('consume');
    if (!consume) return 'Indica si consumes atún enlatado.';
    if (!valorRadio('frecuencia')) return 'Selecciona la frecuencia de consumo.';
    if (consume === 'Sí') {
      if ($$('input[name="forma"]:checked').length === 0) return 'Selecciona al menos una forma de consumo.';
      if ($('input[name="forma"][value="Otro"]').checked && !$('#otraForma').value.trim()) {
        return 'Escribe la forma de consumo en el campo "Otro".';
      }
      const marcaIndicada = $('#marcas').value.trim() !== '' ||
        $('#chk-sinmarca').checked || $('#chk-norecuerda').checked;
      if (!marcaIndicada) return 'Escribe una o varias marcas, o selecciona una de las opciones de marca.';
    }
    return null;
  }

  if (id === 'p-instrucciones') return null;

  if (id.indexOf('p-muestra-') === 0) {
    const i = Number(id.slice(-1));
    if (!$('[data-chips="' + i + '"] .chip.sel')) return 'Selecciona el código de la muestra.';
    const preguntas = [
      ['agrado', 'la evaluación de agrado general'],
      ['salado', 'el nivel de salado'],
      ['pescado', 'el sabor a pescado'],
      ['color', 'la intensidad del color'],
      ['compra', 'la intención de compra']
    ];
    for (const [nombre, texto] of preguntas) {
      if (!valorRadio(nombre + i)) return 'Falta responder ' + texto + ' de esta muestra.';
    }
    return null;
  }

  if (id === 'p-ranking') {
    if (estado.ranking.some(c => !c)) return 'Asigna un código a las cinco posiciones antes de continuar.';
    return null;
  }

  if (id === 'p-favorita') {
    if (!valorRadio('favorita')) return 'Selecciona tu muestra favorita.';
    return null;
  }

  return null;
}

/* ===================== Navegación ===================== */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-siguiente]');
  if (!btn) return;
  const msg = validarPaso(estado.paso);
  mostrarError(msg);
  if (msg) return;
  irA(estado.paso + 1);
});

/* ===================== Envío ===================== */
function construirPayload() {
  const consume = valorRadio('consume') === 'Sí';
  const datos = {
    edad: Number($('#edad').value),
    genero: valorRadio('genero'),
    consumeAtun: valorRadio('consume'),
    frecuencia: valorRadio('frecuencia'),
    formasConsumo: consume ? $$('input[name="forma"]:checked').map(i => i.value) : [],
    otraForma: consume ? $('#otraForma').value.trim() : '',
    marcasTexto: consume ? $('#marcas').value.trim() : '',
    sinMarcaParticular: consume && $('#chk-sinmarca').checked,
    noRecuerdaMarca: consume && $('#chk-norecuerda').checked
  };

  const muestras = [];
  for (let i = 0; i < 5; i++) {
    const sel = $('[data-chips="' + i + '"] .chip.sel');
    muestras.push({
      codigo: sel ? sel.dataset.codigo : null,
      agrado: Number(valorRadio('agrado' + i)),
      salado: Number(valorRadio('salado' + i)),
      pescado: Number(valorRadio('pescado' + i)),
      color: Number(valorRadio('color' + i)),
      compra: Number(valorRadio('compra' + i))
    });
  }

  return {
    token: estado.token,
    consentimiento: $('#consentimiento').checked,
    datos: datos,
    muestras: muestras,
    ranking: estado.ranking.slice(),
    favorita: valorRadio('favorita')
  };
}

function validarTodo() {
  for (let p = 1; p <= 9; p++) {
    const msg = validarPaso(p);
    if (msg) return { paso: p, msg: msg };
  }
  return null;
}

async function enviarRespuestas() {
  if (estado.enviando) return;

  if (!CONFIG.ENDPOINT || CONFIG.ENDPOINT.indexOf('PEGA_AQUI') === 0) {
    mostrarError('La aplicación aún no está conectada al servidor. Avisa a la persona organizadora.', 9);
    return;
  }

  const fallo = validarTodo();
  if (fallo) {
    irA(fallo.paso);
    mostrarError(fallo.msg, fallo.paso);
    return;
  }

  mostrarError('');
  estado.enviando = true;
  const btn = $('#btn-enviar');
  btn.disabled = true;
  btn.innerHTML = '<span class="carga"></span>Enviando respuestas…';

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), CONFIG.TIMEOUT_MS);

  try {
    // text/plain evita el preflight CORS; el backend parsea el JSON del cuerpo.
    const respuesta = await fetch(CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(construirPayload()),
      signal: controlador.signal
    });
    const resultado = await respuesta.json();
    onRespuesta(resultado);
  } catch (err) {
    const mensaje = err && err.name === 'AbortError'
      ? 'La conexión tardó demasiado. Revisa tu internet e intenta de nuevo; tus respuestas siguen en pantalla.'
      : 'No fue posible enviar tus respuestas. Revisa tu conexión e intenta de nuevo; tus respuestas siguen en pantalla.';
    onFalloEnvio(mensaje);
  } finally {
    clearTimeout(limite);
  }
}

function onRespuesta(res) {
  if (res && res.ok) {
    try { localStorage.setItem('atun_enviado', '1'); } catch (e) { /* sin almacenamiento local */ }
    mostrarFinal();
    return;
  }
  onFalloEnvio((res && res.mensaje) || 'No fue posible guardar tus respuestas. Intenta de nuevo.');
}

function onFalloEnvio(mensaje) {
  estado.enviando = false;
  const btn = $('#btn-enviar');
  btn.disabled = false;
  btn.textContent = 'Enviar respuestas';
  mostrarError(mensaje, 9);
}

function mostrarFinal() {
  const contenedor = $('#contenedor-imagen');
  contenedor.innerHTML = '';
  const img = document.createElement('img');
  img.src = CONFIG.IMAGEN_FINAL;
  img.alt = 'Super tuna';
  contenedor.appendChild(img);
  irA(10);
}

/* ===================== Inicio ===================== */
function iniciar() {
  construirDatos();
  construirMuestras();
  renderRanking();
  construirFavorita();
  actualizarConsumo();

  let yaEnviado = false;
  try { yaEnviado = localStorage.getItem('atun_enviado') === '1'; } catch (e) { yaEnviado = false; }
  if (yaEnviado) {
    $('#aviso-enviado').classList.remove('oculto');
    $('#btn-comenzar').disabled = true;
  }

  $('#btn-enviar').addEventListener('click', enviarRespuestas);
  irA(0);
}

document.addEventListener('DOMContentLoaded', iniciar);
