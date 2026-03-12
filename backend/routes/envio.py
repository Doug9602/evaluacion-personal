from flask import Blueprint, request, jsonify, make_response
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
from utils.email_utils import enviar_correo
import pandas as pd
import json
import html
import math
from datetime import datetime

envio_bp = Blueprint('envio', __name__)

# ------------------------------------------------------------
# Función auxiliar para limpiar NaN (copiada de respuestas.py)
# ------------------------------------------------------------
def limpiar_nan(data):
    if isinstance(data, dict):
        return {k: limpiar_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [limpiar_nan(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    elif data == 'NaN':
        return None
    elif hasattr(data, 'dtype'):
        if 'int' in str(data.dtype):
            return int(data)
        elif 'float' in str(data.dtype):
            val = float(data)
            return None if math.isnan(val) else val
    else:
        return data

# ------------------------------------------------------------
# Generación de opciones HTML para preguntas múltiples
# ------------------------------------------------------------
def generar_opciones_html(pregunta_id, opciones_json):
    try:
        opciones = json.loads(opciones_json)
        if not isinstance(opciones, list):
            return ""
        html_opciones = ""
        for op in opciones:
            valor = op.get('valor', '')
            texto = html.escape(op.get('texto', ''))
            html_opciones += f'''
            <div class="form-check">
                <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="{valor}" required>
                <label class="form-check-label">{texto} (valor {valor})</label>
            </div>
            '''
        return html_opciones
    except Exception as e:
        print(f"Error al generar opciones: {e}")
        return ""

# ------------------------------------------------------------
# Generación del formulario HTML completo (con nombre personalizado)
# ------------------------------------------------------------
def generar_html_formulario(candidato_id, test_id):
    # Obtener datos del candidato
    df_candidatos = leer_csv('candidatos.csv')
    df_candidatos = df_candidatos.where(pd.notna(df_candidatos), None)
    candidato = df_candidatos[df_candidatos['id'] == candidato_id].to_dict(orient='records')
    if not candidato:
        return None, "Candidato no encontrado"
    candidato = candidato[0]

    # Obtener preguntas del test
    df_preguntas = leer_csv('preguntas.csv')
    df_preguntas = df_preguntas[df_preguntas['test_id'] == test_id]
    if df_preguntas.empty:
        return None, "No hay preguntas para este test"
    preguntas = df_preguntas.to_dict(orient='records')

    # Obtener nombre del test
    df_tests = leer_csv('tests.csv')
    test = df_tests[df_tests['id'] == test_id].to_dict(orient='records')
    test_nombre = test[0]['nombre'] if test else "Test desconocido"

    # Construir el HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formulario de evaluación</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{ padding: 20px; }}
        </style>
        <script>
            // Datos del candidato proporcionados por el backend
            const candidatoNombre = "{html.escape(candidato['nombre'])}";
            const candidatoApellido = "{html.escape(candidato['apellido'])}";
            const candidatoId = {candidato_id};

            // Función para normalizar el nombre (eliminar acentos y reemplazar espacios)
            function normalizarTexto(texto) {{
                return texto
                    .normalize('NFD')
                    .replace(/[\\u0300-\\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .toLowerCase();
            }}
        </script>
    </head>
    <body>
        <div class="container">
            <h1>Evaluación: {html.escape(test_nombre)}</h1>
            <p><strong>Candidato:</strong> {html.escape(candidato['nombre'])} {html.escape(candidato['apellido'])} (ID: {candidato_id})</p>
            <hr>
            <form id="formEvaluacion">
                <input type="hidden" name="candidato_id" value="{candidato_id}">
                <input type="hidden" name="test_id" value="{test_id}">
    """

    for idx, p in enumerate(preguntas):
        pregunta_id = p['id']
        texto = html.escape(p['texto'])
        tipo = p['tipo_pregunta']
        html_content += f"<h5 class='mt-3'>Pregunta {idx+1}: {texto}</h5>"

        if tipo == 'likert':
            html_content += f"""
            <div class="mb-3">
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="1" required> <label class="form-check-label">1</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="2" required> <label class="form-check-label">2</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="3" required> <label class="form-check-label">3</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="4" required> <label class="form-check-label">4</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta_{pregunta_id}" value="5" required> <label class="form-check-label">5</label>
                </div>
            </div>
            """
        elif tipo == 'multiple':
            opciones_html = generar_opciones_html(pregunta_id, p['opciones_json'])
            html_content += f"<div class='mb-3'>{opciones_html}</div>"
        elif tipo == 'abierta':
            html_content += f"""
            <div class="mb-3">
                <textarea class="form-control" name="pregunta_{pregunta_id}" rows="3" required></textarea>
            </div>
            """

    html_content += """
                <hr>
                <button type="button" class="btn btn-primary" onclick="generarJSON()">Descargar respuestas</button>
            </form>
        </div>

        <script>
        function generarJSON() {
            const form = document.getElementById('formEvaluacion');
            const formData = new FormData(form);
            const respuestas = [];

            for (let [key, value] of formData.entries()) {
                if (key.startsWith('pregunta_')) {
                    const pregunta_id = key.split('_')[1];
                    respuestas.push({
                        pregunta_id: parseInt(pregunta_id),
                        valor: isNaN(value) ? value : Number(value)
                    });
                }
            }

            const resultado = {
                candidato_id: parseInt(formData.get('candidato_id')),
                test_id: parseInt(formData.get('test_id')),
                respuestas: respuestas
            };

            // Construir nombre del archivo: apellido_nombre_id_respuestas.json
            const nombreBase = normalizarTexto(candidatoApellido) + '_' + normalizarTexto(candidatoNombre) + '_' + candidatoId;
            const nombreArchivo = nombreBase + '_respuestas.json';

            const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            a.click();
            URL.revokeObjectURL(url);
        }
        </script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    return html_content, None

# ------------------------------------------------------------
# Endpoint para obtener el formulario en el navegador
# ------------------------------------------------------------
@envio_bp.route('/api/generar-formulario/<int:candidato_id>/<int:test_id>', methods=['GET'])
def generar_formulario(candidato_id, test_id):
    html_content, error = generar_html_formulario(candidato_id, test_id)
    if error:
        return jsonify({"error": error}), 404
    response = make_response(html_content)
    response.headers['Content-Type'] = 'text/html'
    return response

# ------------------------------------------------------------
# Endpoint para enviar el formulario por correo
# ------------------------------------------------------------
@envio_bp.route('/api/enviar-formulario/<int:candidato_id>/<int:test_id>', methods=['POST'])
def enviar_formulario(candidato_id, test_id):
    data = request.get_json()
    email_destino = data.get('email')
    if not email_destino:
        return jsonify({"error": "Email no proporcionado"}), 400

    html_content, error = generar_html_formulario(candidato_id, test_id)
    if error:
        return jsonify({"error": error}), 404

    df_candidatos = leer_csv('candidatos.csv')
    candidato = df_candidatos[df_candidatos['id'] == candidato_id].to_dict(orient='records')
    if not candidato:
        return jsonify({"error": "Candidato no encontrado"}), 404
    candidato = candidato[0]

    df_tests = leer_csv('tests.csv')
    test = df_tests[df_tests['id'] == test_id].to_dict(orient='records')
    test_nombre = test[0]['nombre'] if test else "Test desconocido"

    cuerpo_html = f"""
    <p>Hola {candidato['nombre']} {candidato['apellido']},</p>
    <p>Adjuntamos el formulario de evaluación "{test_nombre}". Por favor, sigue estos pasos:</p>
    <ol>
        <li>Abre el archivo adjunto (formulario.html) en tu navegador.</li>
        <li>Completa todas las preguntas.</li>
        <li>Haz clic en "Descargar respuestas" y guarda el archivo JSON generado.</li>
        <li>Responde a este correo adjuntando el archivo JSON.</li>
    </ol>
    <p>Gracias.</p>
    <hr>
    <p><em>Este es un mensaje automático, por favor no respondas directamente.</em></p>
    """

    try:
        enviar_correo(
            destinatario=email_destino,
            asunto=f"Formulario de evaluación: {test_nombre}",
            cuerpo_html=cuerpo_html,
            adjunto_nombre="formulario.html",
            adjunto_contenido=html_content.encode('utf-8'),
            adjunto_tipo='html'
        )
        return jsonify({"mensaje": "Formulario enviado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------------------------------------
# Función local para calcular resultados por escala (evita dependencia circular)
# ------------------------------------------------------------
def calcular_resultados_escalas_local(respuesta_id, respuestas, test_id):
    df_preg = leer_csv('preguntas.csv')
    preguntas_test = df_preg[df_preg['test_id'] == test_id]
    
    max_por_pregunta = {}
    for _, row in preguntas_test.iterrows():
        if row['tipo_pregunta'] == 'likert':
            max_por_pregunta[row['id']] = 5
        elif row['tipo_pregunta'] == 'multiple':
            try:
                opciones = json.loads(row['opciones_json'])
                if opciones and isinstance(opciones, list):
                    max_val = max(op['valor'] for op in opciones)
                else:
                    max_val = 5
            except:
                max_val = 5
            max_por_pregunta[row['id']] = max_val
        else:
            max_por_pregunta[row['id']] = 0
    
    df_rel = leer_csv('pregunta_escala.csv')
    acum = {}
    
    for respuesta in respuestas:
        pregunta_id = respuesta['pregunta_id']
        valor = respuesta['valor']
        relaciones = df_rel[df_rel['pregunta_id'] == pregunta_id]
        max_preg = max_por_pregunta.get(pregunta_id, 5)
        for _, row in relaciones.iterrows():
            escala_id = int(row['escala_id'])
            peso = float(row['peso'])
            if escala_id not in acum:
                acum[escala_id] = {'puntuacion': 0, 'maximo': 0}
            acum[escala_id]['puntuacion'] += valor * peso
            acum[escala_id]['maximo'] += max_preg * peso
    
    df_res_escalas = leer_csv('resultados_escalas.csv')
    for escala_id, vals in acum.items():
        nuevo_id = generar_id('resultados_escalas.csv')
        porcentaje = (vals['puntuacion'] / vals['maximo']) * 100 if vals['maximo'] > 0 else 0
        nueva_fila = {
            'id': nuevo_id,
            'respuesta_id': respuesta_id,
            'escala_id': escala_id,
            'puntuacion': vals['puntuacion'],
            'maximo': vals['maximo'],
            'porcentaje': porcentaje
        }
        df_res_escalas = pd.concat([df_res_escalas, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('resultados_escalas.csv', df_res_escalas)

# ------------------------------------------------------------
# Endpoint para importar respuestas (con validación de duplicados)
# ------------------------------------------------------------
@envio_bp.route('/api/importar-respuestas', methods=['POST'])
def importar_respuestas():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
    
    if not file.filename.endswith('.json'):
        return jsonify({"error": "El archivo debe ser de tipo JSON"}), 400

    try:
        content = file.read().decode('utf-8')
        data = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Error al leer el archivo JSON: {str(e)}"}), 400

    if not all(k in data for k in ('candidato_id', 'test_id', 'respuestas')):
        return jsonify({"error": "El JSON debe contener candidato_id, test_id y respuestas"}), 400
    
    if not isinstance(data['respuestas'], list):
        return jsonify({"error": "El campo 'respuestas' debe ser una lista"}), 400

    df_candidatos = leer_csv('candidatos.csv')
    if data['candidato_id'] not in df_candidatos['id'].values:
        return jsonify({"error": "El candidato especificado no existe"}), 404

    df_tests = leer_csv('tests.csv')
    if data['test_id'] not in df_tests['id'].values:
        return jsonify({"error": "El test especificado no existe"}), 404

    df_preguntas = leer_csv('preguntas.csv')
    preguntas_test = df_preguntas[df_preguntas['test_id'] == data['test_id']]['id'].tolist()
    for item in data['respuestas']:
        if 'pregunta_id' not in item or 'valor' not in item:
            return jsonify({"error": "Cada respuesta debe tener 'pregunta_id' y 'valor'"}), 400
        if item['pregunta_id'] not in preguntas_test:
            return jsonify({"error": f"La pregunta {item['pregunta_id']} no pertenece al test {data['test_id']}"}), 400

    respuestas_json_normalizado = json.dumps(data['respuestas'], sort_keys=True, separators=(',', ':'))

    df_respuestas = leer_csv('respuestas.csv')
    if not df_respuestas.empty:
        df_existente = df_respuestas[
            (df_respuestas['candidato_id'] == data['candidato_id']) &
            (df_respuestas['test_id'] == data['test_id'])
        ]
        for _, row in df_existente.iterrows():
            try:
                respuestas_csv = json.loads(row['respuestas_json'])
                json_csv_normalizado = json.dumps(respuestas_csv, sort_keys=True, separators=(',', ':'))
                if json_csv_normalizado == respuestas_json_normalizado:
                    return jsonify({"error": "Esta evaluación ya fue importada anteriormente"}), 409
            except:
                pass

    df = leer_csv('respuestas.csv')
    nuevo_id = generar_id('respuestas.csv')
    respuestas_json = json.dumps(data['respuestas'], ensure_ascii=False)

    nueva_fila = {
        'id': nuevo_id,
        'candidato_id': data['candidato_id'],
        'test_id': data['test_id'],
        'evaluador_id': '',
        'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'respuestas_json': respuestas_json
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('respuestas.csv', df)

    calcular_resultados_escalas_local(nuevo_id, data['respuestas'], data['test_id'])

    respuesta = {
        'id': nuevo_id,
        'candidato_id': data['candidato_id'],
        'test_id': data['test_id'],
        'fecha': nueva_fila['fecha'],
        'respuestas': data['respuestas']
    }

    return jsonify(limpiar_nan(respuesta)), 201