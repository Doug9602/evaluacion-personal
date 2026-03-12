from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import math
import json

preguntas_bp = Blueprint('preguntas', __name__)

def limpiar_nan(data):
    """
    Convierte cualquier NaN a None y convierte tipos pandas/numpy a tipos nativos de Python.
    """
    if isinstance(data, dict):
        return {k: limpiar_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [limpiar_nan(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None
    elif data == 'NaN':
        return None
    elif hasattr(data, 'dtype'):  # Es un tipo pandas (Series, DataFrame, o escalar con dtype)
        # Intentar convertir a tipo nativo
        if pd.api.types.is_integer_dtype(data) or isinstance(data, (pd.Int64Dtype, pd.Int32Dtype)):
            return int(data)
        elif pd.api.types.is_float_dtype(data):
            val = float(data)
            return None if math.isnan(val) else val
        else:
            # Para otros casos, convertir a string o dejarlo
            return str(data)
    else:
        return data

def obtener_escalas_de_pregunta(pregunta_id):
    """Devuelve la lista de escalas asociadas a una pregunta con sus pesos."""
    df = leer_csv('pregunta_escala.csv')
    if df.empty:
        return []
    df_filtrado = df[df['pregunta_id'] == pregunta_id]
    return df_filtrado.to_dict(orient='records')

def guardar_escalas_de_pregunta(pregunta_id, escalas):
    """
    Guarda las relaciones pregunta-escala.
    escalas: lista de dicts con 'escala_id' y 'peso'.
    """
    # Primero eliminar relaciones existentes
    df = leer_csv('pregunta_escala.csv')
    df = df[df['pregunta_id'] != pregunta_id]
    # Agregar las nuevas
    for es in escalas:
        nuevo_id = generar_id('pregunta_escala.csv')
        nueva_fila = {
            'id': nuevo_id,
            'pregunta_id': pregunta_id,
            'escala_id': es['escala_id'],
            'peso': es['peso']
        }
        df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('pregunta_escala.csv', df)

@preguntas_bp.route('/api/preguntas', methods=['GET'])
def listar_preguntas():
    test_id = request.args.get('test_id')
    df = leer_csv('preguntas.csv')
    
    if test_id is not None:
        try:
            test_id = int(test_id)
            df = df[df['test_id'] == test_id]
        except ValueError:
            return jsonify({"error": "test_id debe ser un número"}), 400
    
    df = df.where(pd.notna(df), None)
    preguntas = df.to_dict(orient='records')

    # Para cada pregunta, agregar sus escalas
    for p in preguntas:
        p['escalas'] = obtener_escalas_de_pregunta(p['id'])

    return jsonify(limpiar_nan(preguntas))

@preguntas_bp.route('/api/preguntas/<int:id>', methods=['GET'])
def obtener_pregunta(id):
    df = leer_csv('preguntas.csv')
    df = df.where(pd.notna(df), None)
    pregunta = df[df['id'] == id].to_dict(orient='records')
    if pregunta:
        p = pregunta[0]
        p['escalas'] = obtener_escalas_de_pregunta(id)
        return jsonify(limpiar_nan(p))
    else:
        return jsonify({"error": "Pregunta no encontrada"}), 404

@preguntas_bp.route('/api/preguntas', methods=['POST'])
def crear_pregunta():
    data = request.get_json()
    
    # Validar campos obligatorios
    campos_obligatorios = ['test_id', 'texto', 'tipo_pregunta']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    try:
        test_id = int(data['test_id'])
    except (ValueError, TypeError):
        return jsonify({"error": "test_id debe ser un número entero"}), 400

    # Manejo del orden
    if 'orden' in data and data['orden'] is not None:
        try:
            orden = int(data['orden'])
        except (ValueError, TypeError):
            return jsonify({"error": "orden debe ser un número entero"}), 400
    else:
        orden = None

    # Leer preguntas existentes para calcular el siguiente orden
    df_existente = leer_csv('preguntas.csv')
    if orden is None:
        # Calcular el máximo orden para este test
        if not df_existente.empty:
            df_mismo_test = df_existente[df_existente['test_id'] == test_id]
            if not df_mismo_test.empty:
                # Asegurar que la columna 'orden' sea numérica
                df_mismo_test['orden'] = pd.to_numeric(df_mismo_test['orden'], errors='coerce')
                orden = df_mismo_test['orden'].max() + 1
            else:
                orden = 1
        else:
            orden = 1
    else:
        # Validar unicidad del orden proporcionado
        if not df_existente.empty:
            df_mismo_test = df_existente[df_existente['test_id'] == test_id]
            if not df_mismo_test.empty:
                # Asegurar que la columna 'orden' sea numérica para la comparación
                df_mismo_test['orden'] = pd.to_numeric(df_mismo_test['orden'], errors='coerce')
                if orden in df_mismo_test['orden'].values:
                    return jsonify({"error": f"Ya existe una pregunta con el orden {orden} en este test"}), 400

    # Procesar opciones_json si viene como lista
    opciones_json = data.get('opciones_json', '')
    if isinstance(opciones_json, list):
        opciones_json = json.dumps(opciones_json, ensure_ascii=False)

    df = leer_csv('preguntas.csv')
    nuevo_id = generar_id('preguntas.csv')

    nueva_fila = {
        'id': nuevo_id,
        'test_id': test_id,
        'texto': data['texto'],
        'tipo_pregunta': data['tipo_pregunta'],
        'orden': orden,
        'opciones_json': opciones_json
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('preguntas.csv', df)

    # Guardar escalas asociadas si vienen
    if 'escalas' in data and isinstance(data['escalas'], list):
        guardar_escalas_de_pregunta(nuevo_id, data['escalas'])
        nueva_fila['escalas'] = data['escalas']
    else:
        nueva_fila['escalas'] = []

    return jsonify(limpiar_nan(nueva_fila)), 201

@preguntas_bp.route('/api/preguntas/<int:id>', methods=['PUT'])
def actualizar_pregunta(id):
    data = request.get_json()
    df = leer_csv('preguntas.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Pregunta no encontrada"}), 404

    # Determinar test_id actual (puede cambiar)
    if 'test_id' in data:
        try:
            test_id = int(data['test_id'])
        except (ValueError, TypeError):
            return jsonify({"error": "test_id debe ser un número entero"}), 400
    else:
        test_id = df.loc[df['id'] == id, 'test_id'].values[0]

    # Validar orden si se envía
    if 'orden' in data:
        try:
            orden = int(data['orden'])
        except (ValueError, TypeError):
            return jsonify({"error": "orden debe ser un número entero"}), 400

        # Verificar unicidad excluyendo la pregunta actual
        df_all = leer_csv('preguntas.csv')
        df_mismo_test = df_all[(df_all['test_id'] == test_id) & (df_all['id'] != id)]
        if not df_mismo_test.empty:
            # Asegurar que la columna 'orden' sea numérica
            df_mismo_test['orden'] = pd.to_numeric(df_mismo_test['orden'], errors='coerce')
            if orden in df_mismo_test['orden'].values:
                return jsonify({"error": f"Ya existe otra pregunta con el orden {orden} en este test"}), 400
        df.loc[df['id'] == id, 'orden'] = orden

    # Procesar opciones_json si viene como lista
    if 'opciones_json' in data and isinstance(data['opciones_json'], list):
        data['opciones_json'] = json.dumps(data['opciones_json'], ensure_ascii=False)

    # Actualizar otros campos
    for campo in data:
        if campo in df.columns and campo != 'orden':  # orden ya actualizado
            if campo == 'test_id':
                try:
                    valor = int(data[campo])
                except (ValueError, TypeError):
                    return jsonify({"error": "test_id debe ser un número entero"}), 400
            else:
                valor = data[campo]
            df.loc[df['id'] == id, campo] = valor

    escribir_csv('preguntas.csv', df)

    # Actualizar escalas si vienen
    if 'escalas' in data:
        guardar_escalas_de_pregunta(id, data['escalas'])

    df_limpio = df.where(pd.notna(df), None)
    pregunta_actualizada = df_limpio[df_limpio['id'] == id].to_dict(orient='records')[0]
    pregunta_actualizada['escalas'] = obtener_escalas_de_pregunta(id)
    return jsonify(limpiar_nan(pregunta_actualizada))

@preguntas_bp.route('/api/preguntas/<int:id>', methods=['DELETE'])
def eliminar_pregunta(id):
    df = leer_csv('preguntas.csv')
    if id not in df['id'].values:
        return jsonify({"error": "Pregunta no encontrada"}), 404

    # Eliminar relaciones de escalas
    df_rel = leer_csv('pregunta_escala.csv')
    df_rel = df_rel[df_rel['pregunta_id'] != id]
    escribir_csv('pregunta_escala.csv', df_rel)

    df = df[df['id'] != id]
    escribir_csv('preguntas.csv', df)
    return jsonify({"mensaje": "Pregunta eliminada correctamente"}), 200