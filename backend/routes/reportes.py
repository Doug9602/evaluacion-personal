from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv
import pandas as pd

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/api/reportes/cargo/<int:cargo_id>', methods=['GET'])
def reporte_por_cargo(cargo_id):
    """
    Devuelve estadísticas agregadas de las evaluaciones de los candidatos de un cargo.
    """
    # Obtener candidatos de ese cargo
    df_candidatos = leer_csv('candidatos.csv')
    candidatos_cargo = df_candidatos[df_candidatos['cargo_id'] == cargo_id]
    if candidatos_cargo.empty:
        return jsonify({"error": "No hay candidatos en este cargo"}), 404

    lista_ids = candidatos_cargo['id'].tolist()

    # Obtener todas las respuestas de esos candidatos (solo la última de cada candidato)
    df_respuestas = leer_csv('respuestas.csv')
    df_respuestas_filtrado = df_respuestas[df_respuestas['candidato_id'].isin(lista_ids)]

    if df_respuestas_filtrado.empty:
        return jsonify({"error": "No hay evaluaciones para estos candidatos"}), 404

    # Ordenar por fecha y quedarnos con la última por candidato
    df_respuestas_filtrado = df_respuestas_filtrado.sort_values('fecha', ascending=False)
    ultimas_por_candidato = df_respuestas_filtrado.drop_duplicates(subset='candidato_id', keep='first')

    # Obtener resultados por escala para esas respuestas
    df_res_escalas = leer_csv('resultados_escalas.csv')
    df_res_escalas_filtrado = df_res_escalas[df_res_escalas['respuesta_id'].isin(ultimas_por_candidato['id'])]

    if df_res_escalas_filtrado.empty:
        return jsonify({"error": "No hay resultados por escala para estos candidatos"}), 404

    # Agrupar por escala y calcular estadísticas
    estadisticas = df_res_escalas_filtrado.groupby('escala_id').agg({
        'porcentaje': ['mean', 'min', 'max', 'count']
    }).round(2)
    estadisticas.columns = ['promedio', 'minimo', 'maximo', 'cantidad']
    estadisticas = estadisticas.reset_index()

    # Obtener nombres de escalas
    df_escalas = leer_csv('escalas.csv')
    escala_dict = df_escalas.set_index('id')['nombre'].to_dict()

    resultado = []
    for _, row in estadisticas.iterrows():
        resultado.append({
            'escala_id': int(row['escala_id']),
            'escala_nombre': escala_dict.get(int(row['escala_id']), 'Desconocido'),
            'promedio': row['promedio'],
            'minimo': row['minimo'],
            'maximo': row['maximo'],
            'num_candidatos': int(row['cantidad'])
        })

    return jsonify(resultado)