from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import json
import math

resultados_bp = Blueprint('resultados', __name__)

def limpiar_nan(data):
    if isinstance(data, dict):
        return {k: limpiar_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [limpiar_nan(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    elif data == 'NaN':
        return None
    else:
        return data

def obtener_maximo_por_pregunta(test_id):
    df_preg = leer_csv('preguntas.csv')
    if df_preg.empty:
        return {}
    df_preg['test_id'] = pd.to_numeric(df_preg['test_id'], errors='coerce')
    preguntas_test = df_preg[df_preg['test_id'] == test_id]
    max_por_pregunta = {}
    for _, row in preguntas_test.iterrows():
        pid = int(row['id'])
        if row['tipo_pregunta'] == 'likert':
            max_por_pregunta[pid] = 5
        elif row['tipo_pregunta'] == 'multiple':
            try:
                opciones = json.loads(row['opciones_json'])
                if opciones and isinstance(opciones, list):
                    valores = [float(op['valor']) for op in opciones if 'valor' in op]
                    max_val = max(valores) if valores else 5
                else:
                    max_val = 5
            except:
                max_val = 5
            max_por_pregunta[pid] = max_val
        else:
            max_por_pregunta[pid] = 0
    return max_por_pregunta

def calcular_resultado(respuesta_row):
    try:
        respuestas = json.loads(respuesta_row['respuestas_json'])
    except:
        return None
    test_id = int(respuesta_row['test_id'])
    max_por_pregunta = obtener_maximo_por_pregunta(test_id)
    puntuacion_total = 0
    maximo_total = 0
    detalle = []
    for item in respuestas:
        pregunta_id = item['pregunta_id']
        valor = item['valor']
        try:
            valor = float(valor)
        except:
            valor = 0
        max_preg = max_por_pregunta.get(pregunta_id, 0)
        if max_preg is None or (isinstance(max_preg, float) and math.isnan(max_preg)):
            max_preg = 0
        puntuacion_total += valor
        maximo_total += max_preg
        detalle.append({'pregunta_id': pregunta_id, 'valor': valor})
    return {
        'candidato_id': int(respuesta_row['candidato_id']),
        'test_id': test_id,
        'fecha': respuesta_row['fecha'],
        'puntuacion_total': puntuacion_total,
        'maximo_total': maximo_total,
        'detalle': detalle
    }

@resultados_bp.route('/api/resultados/<int:candidato_id>/<int:test_id>', methods=['GET'])
def obtener_resultados(candidato_id, test_id):
    df_respuestas = leer_csv('respuestas.csv')
    df_filtrado = df_respuestas[(df_respuestas['candidato_id'] == candidato_id) & 
                                 (df_respuestas['test_id'] == test_id)]
    if df_filtrado.empty:
        return jsonify({"error": "No hay respuestas para este candidato y test"}), 404

    df_filtrado = df_filtrado.sort_values('fecha', ascending=False)
    ultima = df_filtrado.iloc[0]
    resultado = calcular_resultado(ultima)
    if resultado is None:
        return jsonify({"error": "Error al procesar las respuestas"}), 500
    if resultado['maximo_total'] > 0:
        resultado['porcentaje'] = round((resultado['puntuacion_total'] / resultado['maximo_total']) * 100, 2)
    else:
        resultado['porcentaje'] = 0
    return jsonify(resultado)

@resultados_bp.route('/api/resultados/ultima/<int:candidato_id>', methods=['GET'])
def obtener_ultima_evaluacion(candidato_id):
    df_respuestas = leer_csv('respuestas.csv')
    df_filtrado = df_respuestas[df_respuestas['candidato_id'] == candidato_id]
    if df_filtrado.empty:
        return jsonify({"error": "No hay evaluaciones para este candidato"}), 404
    df_filtrado = df_filtrado.sort_values('fecha', ascending=False)
    ultima = df_filtrado.iloc[0]
    resultado = calcular_resultado(ultima)
    if resultado is None:
        return jsonify({"error": "Error al procesar las respuestas"}), 500
    if resultado['maximo_total'] > 0:
        resultado['porcentaje'] = round((resultado['puntuacion_total'] / resultado['maximo_total']) * 100, 2)
    else:
        resultado['porcentaje'] = 0
    return jsonify(resultado)

@resultados_bp.route('/api/resultados/respuesta/<int:respuesta_id>', methods=['GET'])
def obtener_resultado_por_respuesta(respuesta_id):
    df_resp = leer_csv('respuestas.csv')
    fila = df_resp[df_resp['id'] == respuesta_id]
    if fila.empty:
        return jsonify({"error": "Respuesta no encontrada"}), 404
    fila = fila.iloc[0]
    resultado = calcular_resultado(fila)
    if resultado is None:
        return jsonify({"error": "Error al parsear respuestas"}), 500
    if resultado['maximo_total'] > 0:
        resultado['porcentaje'] = round((resultado['puntuacion_total'] / resultado['maximo_total']) * 100, 2)
    else:
        resultado['porcentaje'] = 0
    return jsonify(limpiar_nan(resultado))

@resultados_bp.route('/api/resultados/escalas/<int:respuesta_id>', methods=['GET'])
def obtener_resultados_escalas(respuesta_id):
    df = leer_csv('resultados_escalas.csv')
    df_filtrado = df[df['respuesta_id'] == respuesta_id]
    if df_filtrado.empty:
        return jsonify([])

    agrupado = df_filtrado.groupby('escala_id').agg({
        'puntuacion': 'sum',
        'maximo': 'sum'
    }).reset_index()
    agrupado['porcentaje'] = (agrupado['puntuacion'] / agrupado['maximo']) * 100
    resultados = agrupado.to_dict(orient='records')

    df_escalas = leer_csv('escalas.csv')
    escala_dict = df_escalas.set_index('id')['nombre'].to_dict()
    for r in resultados:
        r['escala_id'] = int(r['escala_id'])
        r['escala_nombre'] = escala_dict.get(r['escala_id'], 'Desconocido')

    return jsonify(limpiar_nan(resultados))

# Nuevo endpoint para ranking de candidatos por escalas seleccionadas
@resultados_bp.route('/api/resultados/ranking/<int:test_id>', methods=['GET'])
def ranking_candidatos_por_escalas(test_id):
    """
    Devuelve un ranking de candidatos que han realizado el test test_id,
    basado en la suma de puntuaciones de las escalas indicadas en el parámetro 'escalas'.
    Ejemplo: /api/resultados/ranking/1?escalas=1,2,3
    """
    # Obtener lista de IDs de escalas desde query parameter
    escalas_param = request.args.get('escalas')
    if not escalas_param:
        return jsonify({"error": "Debe proporcionar al menos una escala"}), 400
    try:
        escala_ids = [int(x.strip()) for x in escalas_param.split(',')]
    except:
        return jsonify({"error": "Formato de escalas inválido"}), 400

    # Obtener todas las respuestas del test
    df_resp = leer_csv('respuestas.csv')
    df_resp = df_resp[df_resp['test_id'] == test_id]
    if df_resp.empty:
        return jsonify([])

    # Para cada candidato, obtener la última respuesta (más reciente)
    df_resp = df_resp.sort_values('fecha', ascending=False)
    ultimas_por_candidato = df_resp.drop_duplicates(subset='candidato_id', keep='first')

    # Cargar resultados por escala
    df_res_escalas = leer_csv('resultados_escalas.csv')
    # Filtrar por las respuestas que nos interesan
    df_res_escalas = df_res_escalas[df_res_escalas['respuesta_id'].isin(ultimas_por_candidato['id'])]

    # Filtrar por las escalas seleccionadas
    df_res_escalas = df_res_escalas[df_res_escalas['escala_id'].isin(escala_ids)]

    if df_res_escalas.empty:
        return jsonify([])

    # Agrupar por candidato (necesitamos unir con candidatos para obtener nombre)
    # Primero, unimos con ultimas_por_candidato para tener candidato_id
    df_merge = pd.merge(df_res_escalas, ultimas_por_candidato[['id', 'candidato_id']], 
                        left_on='respuesta_id', right_on='id', how='left')

    # Agrupar por candidato sumando puntuacion y maximo
    agrupado = df_merge.groupby('candidato_id').agg({
        'puntuacion': 'sum',
        'maximo': 'sum'
    }).reset_index()
    agrupado['porcentaje'] = (agrupado['puntuacion'] / agrupado['maximo']) * 100

    # Obtener nombres de candidatos
    df_candidatos = leer_csv('candidatos.csv')
    candidatos_dict = df_candidatos.set_index('id')[['nombre', 'apellido']].to_dict('index')

    # Construir resultado
    ranking = []
    for _, row in agrupado.iterrows():
        cid = int(row['candidato_id'])
        cand = candidatos_dict.get(cid, {'nombre': 'Desconocido', 'apellido': ''})
        ranking.append({
            'candidato_id': cid,
            'nombre': cand['nombre'],
            'apellido': cand['apellido'],
            'puntuacion_total': round(row['puntuacion'], 2),
            'maximo_total': round(row['maximo'], 2),
            'porcentaje': round(row['porcentaje'], 2)
        })

    # Ordenar por porcentaje descendente
    ranking.sort(key=lambda x: x['porcentaje'], reverse=True)

    return jsonify(limpiar_nan(ranking))