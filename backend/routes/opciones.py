from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd

opciones_bp = Blueprint('opciones', __name__)

@opciones_bp.route('/api/opciones', methods=['GET'])
def listar_opciones():
    """Obtiene todas las opciones (opcionalmente filtrar por pregunta_id)."""
    pregunta_id = request.args.get('pregunta_id')
    df = leer_csv('opciones.csv')
    
    if pregunta_id is not None:
        try:
            pregunta_id = int(pregunta_id)
            df = df[df['pregunta_id'] == pregunta_id]
        except ValueError:
            return jsonify({"error": "pregunta_id debe ser un número"}), 400
    
    # Ordenar por valor (o por id, como prefieras)
    if not df.empty:
        df = df.sort_values('valor')
    
    opciones = df.to_dict(orient='records')
    return jsonify(opciones)

@opciones_bp.route('/api/opciones/<int:id>', methods=['GET'])
def obtener_opcion(id):
    """Obtiene una opción por su ID."""
    df = leer_csv('opciones.csv')
    opcion = df[df['id'] == id].to_dict(orient='records')
    if opcion:
        return jsonify(opcion[0])
    else:
        return jsonify({"error": "Opción no encontrada"}), 404

@opciones_bp.route('/api/opciones', methods=['POST'])
def crear_opcion():
    """Crea una nueva opción para una pregunta."""
    data = request.get_json()
    
    # Validar campos obligatorios
    campos_obligatorios = ['pregunta_id', 'texto', 'valor']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    # Validar que pregunta_id sea entero
    try:
        pregunta_id = int(data['pregunta_id'])
    except (ValueError, TypeError):
        return jsonify({"error": "pregunta_id debe ser un número entero"}), 400

    # Validar que valor sea numérico (puede ser entero o float)
    try:
        valor = float(data['valor'])  # Permitimos float por si hay valores como 2.5
    except (ValueError, TypeError):
        return jsonify({"error": "valor debe ser un número"}), 400

    # Leer CSV existente
    df = leer_csv('opciones.csv')
    nuevo_id = generar_id('opciones.csv')

    # Crear nueva fila
    nueva_fila = {
        'id': nuevo_id,
        'pregunta_id': pregunta_id,
        'texto': data['texto'],
        'valor': valor
    }

    # Añadir al DataFrame
    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('opciones.csv', df)

    return jsonify(nueva_fila), 201

@opciones_bp.route('/api/opciones/<int:id>', methods=['PUT'])
def actualizar_opcion(id):
    """Actualiza una opción existente."""
    data = request.get_json()
    df = leer_csv('opciones.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Opción no encontrada"}), 404

    # Si se actualiza valor, validar que sea numérico
    if 'valor' in data:
        try:
            data['valor'] = float(data['valor'])
        except (ValueError, TypeError):
            return jsonify({"error": "valor debe ser un número"}), 400

    # Si se actualiza pregunta_id, validar que sea entero
    if 'pregunta_id' in data:
        try:
            data['pregunta_id'] = int(data['pregunta_id'])
        except (ValueError, TypeError):
            return jsonify({"error": "pregunta_id debe ser un número entero"}), 400

    # Actualizar campos
    for campo in data:
        if campo in df.columns:
            df.loc[df['id'] == id, campo] = data[campo]

    escribir_csv('opciones.csv', df)
    opcion_actualizada = df[df['id'] == id].to_dict(orient='records')[0]
    return jsonify(opcion_actualizada)

@opciones_bp.route('/api/opciones/<int:id>', methods=['DELETE'])
def eliminar_opcion(id):
    """Elimina una opción."""
    df = leer_csv('opciones.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Opción no encontrada"}), 404

    df = df[df['id'] != id]
    escribir_csv('opciones.csv', df)
    return jsonify({"mensaje": "Opción eliminada correctamente"}), 200