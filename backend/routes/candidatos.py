from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd
from datetime import datetime
import math

candidatos_bp = Blueprint('candidatos', __name__)

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

@candidatos_bp.route('/api/candidatos', methods=['GET'])
def listar_candidatos():
    """Obtiene todos los candidatos, opcionalmente filtrados por cargo_id."""
    cargo_id = request.args.get('cargo_id')
    df = leer_csv('candidatos.csv')
    df = df.where(pd.notna(df), None)
    
    if cargo_id is not None:
        try:
            cargo_id = int(cargo_id)
            # Asegurar que la columna cargo_id sea numérica para comparar
            df['cargo_id'] = pd.to_numeric(df['cargo_id'], errors='coerce')
            df = df[df['cargo_id'] == cargo_id]
        except ValueError:
            return jsonify({"error": "cargo_id debe ser un número"}), 400

    candidatos = df.to_dict(orient='records')
    return jsonify(limpiar_nan(candidatos))

@candidatos_bp.route('/api/candidatos/<int:id>', methods=['GET'])
def obtener_candidato(id):
    """Obtiene un candidato por su ID."""
    df = leer_csv('candidatos.csv')
    df = df.where(pd.notna(df), None)
    candidato = df[df['id'] == id].to_dict(orient='records')
    if candidato:
        return jsonify(limpiar_nan(candidato[0]))
    else:
        return jsonify({"error": "Candidato no encontrado"}), 404

@candidatos_bp.route('/api/candidatos', methods=['POST'])
def crear_candidato():
    """Crea un nuevo candidato."""
    data = request.get_json()
    
    # Validar campos obligatorios
    campos_obligatorios = ['nombre', 'apellido', 'email']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    # Leer CSV existente
    df = leer_csv('candidatos.csv')
    if 'telefono' in df.columns:
        df['telefono'] = df['telefono'].astype(str).replace('nan', '')
    else:
        df['telefono'] = ''   # si no existe, la creamos vacía

    nuevo_id = generar_id('candidatos.csv')

    # Procesar cargo_id: si viene vacío o no numérico, poner None
    cargo_id = data.get('cargo_id')
    if cargo_id is not None and cargo_id != '':
        try:
            cargo_id = float(cargo_id)  # convertimos a float para mantener consistencia con el tipo de la columna
        except (ValueError, TypeError):
            cargo_id = None
    else:
        cargo_id = None

    # Crear nueva fila
    nueva_fila = {
        'id': nuevo_id,
        'nombre': data['nombre'],
        'apellido': data['apellido'],
        'email': data['email'],
        'telefono': data.get('telefono', ''),
        'fecha_nacimiento': data.get('fecha_nacimiento', ''),
        'genero': data.get('genero', ''),
        'cargo_id': cargo_id,
        'fecha_registro': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    # Añadir al DataFrame
    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('candidatos.csv', df)

    return jsonify(limpiar_nan(nueva_fila)), 201

@candidatos_bp.route('/api/candidatos/<int:id>', methods=['PUT'])
def actualizar_candidato(id):
    """Actualiza un candidato existente."""
    data = request.get_json()
    df = leer_csv('candidatos.csv')
    
    # Asegurar que la columna teléfono sea string
    if 'telefono' in df.columns:
        df['telefono'] = df['telefono'].astype(str).replace('nan', '')
    else:
        df['telefono'] = ''
    
    # Asegurar que cargo_id sea numérico (float) para consistencia
    if 'cargo_id' in df.columns:
        df['cargo_id'] = pd.to_numeric(df['cargo_id'], errors='coerce')
    else:
        df['cargo_id'] = None

    # Verificar que el candidato existe
    if id not in df['id'].values:
        return jsonify({"error": "Candidato no encontrado"}), 404

    # Actualizar campos (solo los proporcionados)
    for campo in data:
        if campo in df.columns:
            valor = data[campo]
            # Manejar cargo_id: convertir a float si es posible, sino None
            if campo == 'cargo_id':
                if valor is not None and valor != '':
                    try:
                        valor = float(valor)  # Convertir a float para que coincida con el dtype
                    except (ValueError, TypeError):
                        valor = None
                else:
                    valor = None
            elif campo == 'telefono' and valor is not None:
                valor = str(valor)
            df.loc[df['id'] == id, campo] = valor

    escribir_csv('candidatos.csv', df)

    # Limpiar NaN antes de devolver
    df_limpio = df.where(pd.notna(df), None)
    candidato_actualizado = df_limpio[df_limpio['id'] == id].to_dict(orient='records')[0]
    return jsonify(limpiar_nan(candidato_actualizado))

@candidatos_bp.route('/api/candidatos/<int:id>', methods=['DELETE'])
def eliminar_candidato(id):
    """Elimina un candidato."""
    df = leer_csv('candidatos.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Candidato no encontrado"}), 404

    df = df[df['id'] != id]
    escribir_csv('candidatos.csv', df)
    return jsonify({"mensaje": "Candidato eliminado correctamente"}), 200