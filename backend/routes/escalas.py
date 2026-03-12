from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import math

escalas_bp = Blueprint('escalas', __name__)

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

@escalas_bp.route('/api/escalas', methods=['GET'])
def listar_escalas():
    # Obtener parámetro test_id opcional
    test_id = request.args.get('test_id')
    df = leer_csv('escalas.csv')
    if test_id is not None:
        try:
            test_id = int(test_id)
            df = df[df['test_id'] == test_id]
        except ValueError:
            return jsonify({"error": "test_id debe ser un número"}), 400
    df = df.where(pd.notna(df), None)
    escalas = df.to_dict(orient='records')
    return jsonify(limpiar_nan(escalas))

@escalas_bp.route('/api/escalas/<int:id>', methods=['GET'])
def obtener_escala(id):
    df = leer_csv('escalas.csv')
    df = df.where(pd.notna(df), None)
    escala = df[df['id'] == id].to_dict(orient='records')
    if escala:
        return jsonify(limpiar_nan(escala[0]))
    else:
        return jsonify({"error": "Escala no encontrada"}), 404

@escalas_bp.route('/api/escalas', methods=['POST'])
def crear_escala():
    data = request.get_json()
    if 'nombre' not in data:
        return jsonify({"error": "Falta el campo 'nombre'"}), 400
    if 'test_id' not in data:
        return jsonify({"error": "Falta el campo 'test_id'"}), 400

    try:
        test_id = int(data['test_id'])
    except (ValueError, TypeError):
        return jsonify({"error": "test_id debe ser un número entero"}), 400

    # Verificar que el test exista (opcional pero recomendado)
    df_tests = leer_csv('tests.csv')
    if test_id not in df_tests['id'].values:
        return jsonify({"error": "El test especificado no existe"}), 404

    df = leer_csv('escalas.csv')
    nuevo_id = generar_id('escalas.csv')

    nueva_fila = {
        'id': nuevo_id,
        'test_id': test_id,
        'nombre': data['nombre'],
        'descripcion': data.get('descripcion', '')
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('escalas.csv', df)
    return jsonify(nueva_fila), 201

@escalas_bp.route('/api/escalas/<int:id>', methods=['PUT'])
def actualizar_escala(id):
    data = request.get_json()
    df = leer_csv('escalas.csv')
    if id not in df['id'].values:
        return jsonify({"error": "Escala no encontrada"}), 404

    # Si se actualiza test_id, validar
    if 'test_id' in data:
        try:
            test_id = int(data['test_id'])
            df_tests = leer_csv('tests.csv')
            if test_id not in df_tests['id'].values:
                return jsonify({"error": "El test especificado no existe"}), 404
        except (ValueError, TypeError):
            return jsonify({"error": "test_id debe ser un número entero"}), 400

    for campo in data:
        if campo in df.columns:
            df.loc[df['id'] == id, campo] = data[campo]

    escribir_csv('escalas.csv', df)
    df_limpio = df.where(pd.notna(df), None)
    escala_actualizada = df_limpio[df_limpio['id'] == id].to_dict(orient='records')[0]
    return jsonify(limpiar_nan(escala_actualizada))

@escalas_bp.route('/api/escalas/<int:id>', methods=['DELETE'])
def eliminar_escala(id):
    df = leer_csv('escalas.csv')
    if id not in df['id'].values:
        return jsonify({"error": "Escala no encontrada"}), 404
    df = df[df['id'] != id]
    escribir_csv('escalas.csv', df)
    return jsonify({"mensaje": "Escala eliminada correctamente"}), 200