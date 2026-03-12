from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import math

tests_bp = Blueprint('tests', __name__)

def limpiar_nan(data):
    """Convierte cualquier NaN (de cualquier tipo) a None."""
    if isinstance(data, dict):
        return {k: limpiar_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [limpiar_nan(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    elif data == 'NaN':  # por si es string "NaN"
        return None
    else:
        return data

@tests_bp.route('/api/tests', methods=['GET'])
def listar_tests():
    """Obtiene todos los tests."""
    df = leer_csv('tests.csv')
    df = df.where(pd.notna(df), None)
    tests = df.to_dict(orient='records')
    tests = limpiar_nan(tests)
    return jsonify(tests)

@tests_bp.route('/api/tests/<int:id>', methods=['GET'])
def obtener_test(id):
    """Obtiene un test por su ID."""
    df = leer_csv('tests.csv')
    df = df.where(pd.notna(df), None)
    test = df[df['id'] == id].to_dict(orient='records')
    if test:
        return jsonify(limpiar_nan(test[0]))
    else:
        return jsonify({"error": "Test no encontrado"}), 404

@tests_bp.route('/api/tests', methods=['POST'])
def crear_test():
    """Crea un nuevo test."""
    data = request.get_json()
    
    # Validar campos obligatorios
    campos_obligatorios = ['nombre', 'tipo']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    df = leer_csv('tests.csv')
    nuevo_id = generar_id('tests.csv')

    nueva_fila = {
        'id': nuevo_id,
        'nombre': data['nombre'],
        'tipo': data['tipo'],
        'instrucciones': data.get('instrucciones', ''),
        'tiempo_limite': data.get('tiempo_limite', 0),
        'activo': data.get('activo', 1)
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('tests.csv', df)

    return jsonify(limpiar_nan(nueva_fila)), 201

@tests_bp.route('/api/tests/<int:id>', methods=['PUT'])
def actualizar_test(id):
    """Actualiza un test existente."""
    data = request.get_json()
    df = leer_csv('tests.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Test no encontrado"}), 404

    for campo in data:
        if campo in df.columns:
            df.loc[df['id'] == id, campo] = data[campo]

    escribir_csv('tests.csv', df)

    df_limpio = df.where(pd.notna(df), None)
    test_actualizado = df_limpio[df_limpio['id'] == id].to_dict(orient='records')[0]
    return jsonify(limpiar_nan(test_actualizado))

@tests_bp.route('/api/tests/<int:id>', methods=['DELETE'])
def eliminar_test(id):
    """Elimina un test."""
    df = leer_csv('tests.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Test no encontrado"}), 404

    df = df[df['id'] != id]
    escribir_csv('tests.csv', df)
    return jsonify({"mensaje": "Test eliminado correctamente"}), 200