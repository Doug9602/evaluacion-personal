from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
import math

cargos_bp = Blueprint('cargos', __name__)

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

@cargos_bp.route('/api/cargos', methods=['GET'])
def listar_cargos():
    """Obtiene todos los cargos."""
    df = leer_csv('cargos.csv')
    # Reemplazar NaN por None usando pandas
    df = df.where(pd.notna(df), None)
    cargos = df.to_dict(orient='records')
    # Limpieza adicional para asegurar que no quede ningún NaN
    cargos = limpiar_nan(cargos)
    return jsonify(cargos)

@cargos_bp.route('/api/cargos/<int:id>', methods=['GET'])
def obtener_cargo(id):
    """Obtiene un cargo por su ID."""
    df = leer_csv('cargos.csv')
    df = df.where(pd.notna(df), None)
    cargo = df[df['id'] == id].to_dict(orient='records')
    if cargo:
        return jsonify(limpiar_nan(cargo[0]))
    else:
        return jsonify({"error": "Cargo no encontrado"}), 404

@cargos_bp.route('/api/cargos', methods=['POST'])
def crear_cargo():
    """Crea un nuevo cargo."""
    data = request.get_json()
    
    # Validar campo obligatorio
    if 'nombre' not in data:
        return jsonify({"error": "Falta el campo 'nombre'"}), 400

    df = leer_csv('cargos.csv')
    nuevo_id = generar_id('cargos.csv')

    nueva_fila = {
        'id': nuevo_id,
        'nombre': data['nombre'],
        'descripcion': data.get('descripcion', ''),
        'departamento': data.get('departamento', '')
    }

    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('cargos.csv', df)

    return jsonify(limpiar_nan(nueva_fila)), 201

@cargos_bp.route('/api/cargos/<int:id>', methods=['PUT'])
def actualizar_cargo(id):
    """Actualiza un cargo existente."""
    data = request.get_json()
    df = leer_csv('cargos.csv')
    
    # Verificar que el cargo existe
    if id not in df['id'].values:
        return jsonify({"error": "Cargo no encontrado"}), 404

    # Actualizar campos (solo los proporcionados)
    for campo in data:
        if campo in df.columns:
            df.loc[df['id'] == id, campo] = data[campo]

    escribir_csv('cargos.csv', df)

    # Limpiar NaN antes de devolver
    df_limpio = df.where(pd.notna(df), None)
    cargo_actualizado = df_limpio[df_limpio['id'] == id].to_dict(orient='records')[0]
    return jsonify(limpiar_nan(cargo_actualizado))

@cargos_bp.route('/api/cargos/<int:id>', methods=['DELETE'])
def eliminar_cargo(id):
    """Elimina un cargo."""
    df = leer_csv('cargos.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Cargo no encontrado"}), 404

    df = df[df['id'] != id]
    escribir_csv('cargos.csv', df)
    return jsonify({"mensaje": "Cargo eliminado correctamente"}), 200