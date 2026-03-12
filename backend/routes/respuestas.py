from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import json
import math
from datetime import datetime

respuestas_bp = Blueprint('respuestas', __name__)

def limpiar_nan(data):
    """Convierte cualquier NaN a None y convierte tipos numpy/pandas a tipos nativos."""
    if isinstance(data, dict):
        return {k: limpiar_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [limpiar_nan(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    elif data == 'NaN':
        return None
    elif hasattr(data, 'dtype'):  # Es un tipo pandas/numpy
        if 'int' in str(data.dtype):
            return int(data)
        elif 'float' in str(data.dtype):
            val = float(data)
            return None if math.isnan(val) else val
    else:
        return data

def calcular_resultados_escalas(respuesta_id, respuestas_json, test_id):
    """
    Calcula las puntuaciones por escala para una respuesta.
    respuestas_json: lista de objetos con 'pregunta_id' y 'valor'
    """
    # Cargar preguntas del test
    df_preg = leer_csv('preguntas.csv')
    preguntas_test = df_preg[df_preg['test_id'] == test_id]
    
    # Crear un diccionario con el valor máximo por pregunta
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
    
    # Cargar relaciones pregunta-escala
    df_rel = leer_csv('pregunta_escala.csv')
    
    # Diccionario para acumular por escala
    acum = {}
    
    for respuesta in respuestas_json:
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
    
    # Guardar resultados en resultados_escalas.csv
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

@respuestas_bp.route('/api/respuestas', methods=['POST'])
def guardar_respuestas():
    data = request.get_json()
    
    campos_obligatorios = ['candidato_id', 'test_id', 'respuestas']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    try:
        candidato_id = int(data['candidato_id'])
        test_id = int(data['test_id'])
    except (ValueError, TypeError):
        return jsonify({"error": "candidato_id y test_id deben ser números enteros"}), 400

    df_candidatos = leer_csv('candidatos.csv')
    if candidato_id not in df_candidatos['id'].values:
        return jsonify({"error": "El candidato no existe"}), 404

    df_tests = leer_csv('tests.csv')
    if test_id not in df_tests['id'].values:
        return jsonify({"error": "El test no existe"}), 404

    if not isinstance(data['respuestas'], list):
        return jsonify({"error": "respuestas debe ser una lista"}), 400

    for item in data['respuestas']:
        if not isinstance(item, dict):
            return jsonify({"error": "Cada elemento de respuestas debe ser un objeto"}), 400
        if 'pregunta_id' not in item or 'valor' not in item:
            return jsonify({"error": "Cada respuesta debe tener 'pregunta_id' y 'valor'"}), 400

    df_preguntas = leer_csv('preguntas.csv')
    preguntas_test = df_preguntas[df_preguntas['test_id'] == test_id]['id'].tolist()
    for item in data['respuestas']:
        if item['pregunta_id'] not in preguntas_test:
            return jsonify({"error": f"La pregunta {item['pregunta_id']} no pertenece al test {test_id}"}), 400

    df = leer_csv('respuestas.csv')
    nuevo_id = generar_id('respuestas.csv')
    respuestas_json = json.dumps(data['respuestas'], ensure_ascii=False)

    nueva_fila = {
        'id': nuevo_id,
        'candidato_id': candidato_id,
        'test_id': test_id,
        'evaluador_id': data.get('evaluador_id', ''),
        'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'respuestas_json': respuestas_json
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('respuestas.csv', df)

    # Calcular y guardar resultados por escala
    calcular_resultados_escalas(nuevo_id, data['respuestas'], test_id)

    respuesta = {
        'id': nuevo_id,
        'candidato_id': candidato_id,
        'test_id': test_id,
        'evaluador_id': nueva_fila['evaluador_id'],
        'fecha': nueva_fila['fecha'],
        'respuestas': data['respuestas']
    }

    return jsonify(respuesta), 201

@respuestas_bp.route('/api/respuestas/candidato/<int:candidato_id>', methods=['GET'])
def listar_respuestas_por_candidato(candidato_id):
    """Devuelve todas las respuestas de un candidato, con nombre del test y número de preguntas."""
    df_resp = leer_csv('respuestas.csv')
    df_resp = df_resp[df_resp['candidato_id'] == candidato_id]
    if df_resp.empty:
        return jsonify([])

    # Leer tests para obtener nombres
    df_tests = leer_csv('tests.csv')
    test_dict = df_tests.set_index('id')['nombre'].to_dict()

    # Limpiar NaN y ordenar
    df_resp = df_resp.where(pd.notna(df_resp), None)
    df_resp = df_resp.sort_values('fecha', ascending=False)
    respuestas = df_resp.to_dict(orient='records')

    # Limpiar NaN de cada respuesta
    respuestas = [limpiar_nan(r) for r in respuestas]

    # Agregar campos adicionales
    for r in respuestas:
        r['test_nombre'] = test_dict.get(r['test_id'], 'Desconocido')
        try:
            resp_json = json.loads(r['respuestas_json'])
            r['num_preguntas'] = len(resp_json)
        except Exception:
            r['num_preguntas'] = 0

    return jsonify(respuestas)

@respuestas_bp.route('/api/respuestas/<int:respuesta_id>', methods=['GET'])
def obtener_respuesta(respuesta_id):
    """Devuelve una respuesta específica por su ID."""
    df = leer_csv('respuestas.csv')
    df = df[df['id'] == respuesta_id]
    if df.empty:
        return jsonify({"error": "Respuesta no encontrada"}), 404
    respuesta = df.iloc[0].to_dict()
    respuesta = limpiar_nan(respuesta)
    return jsonify(respuesta)

@respuestas_bp.route('/api/respuestas/<int:id>', methods=['DELETE'])
def eliminar_respuesta(id):
    """Elimina una respuesta (evaluación) por su ID."""
    df = leer_csv('respuestas.csv')
    if id not in df['id'].values:
        return jsonify({"error": "Respuesta no encontrada"}), 404
    df = df[df['id'] != id]
    escribir_csv('respuestas.csv', df)
    return jsonify({"mensaje": "Evaluación eliminada correctamente"}), 200