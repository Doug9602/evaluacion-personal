from flask import Blueprint, request, jsonify
from utils.manejador_csv import leer_csv, escribir_csv, generar_id
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd

evaluadores_bp = Blueprint('evaluadores', __name__)

def email_existe(email, df, id_ignorar=None):
    """Verifica si un email ya existe en el DataFrame, opcionalmente ignorando un ID."""
    if email in df['email'].values:
        if id_ignorar is None:
            return True
        else:
            # Si hay un ID a ignorar, comprobamos que el email pertenezca a otro registro
            fila = df[df['email'] == email]
            if not fila.empty and fila.iloc[0]['id'] != id_ignorar:
                return True
    return False

@evaluadores_bp.route('/api/evaluadores', methods=['GET'])
def listar_evaluadores():
    """Obtiene todos los evaluadores (sin password_hash)."""
    df = leer_csv('evaluadores.csv')
    # Eliminar la columna password_hash antes de enviar
    if 'password_hash' in df.columns:
        df = df.drop(columns=['password_hash'])
    evaluadores = df.to_dict(orient='records')
    return jsonify(evaluadores)

@evaluadores_bp.route('/api/evaluadores/<int:id>', methods=['GET'])
def obtener_evaluador(id):
    """Obtiene un evaluador por su ID (sin password_hash)."""
    df = leer_csv('evaluadores.csv')
    evaluador = df[df['id'] == id].to_dict(orient='records')
    if evaluador:
        # Eliminar password_hash del diccionario
        evaluador_dict = evaluador[0]
        evaluador_dict.pop('password_hash', None)
        return jsonify(evaluador_dict)
    else:
        return jsonify({"error": "Evaluador no encontrado"}), 404

@evaluadores_bp.route('/api/evaluadores', methods=['POST'])
def crear_evaluador():
    """Crea un nuevo evaluador."""
    data = request.get_json()
    
    # Validar campos obligatorios
    campos_obligatorios = ['nombre', 'apellido', 'email', 'password']
    for campo in campos_obligatorios:
        if campo not in data:
            return jsonify({"error": f"Falta el campo '{campo}'"}), 400

    # Leer CSV existente
    df = leer_csv('evaluadores.csv')
    
    # Verificar email único
    if email_existe(data['email'], df):
        return jsonify({"error": "El email ya está registrado"}), 400

    nuevo_id = generar_id('evaluadores.csv')

    # Generar hash de la contraseña
    password_hash = generate_password_hash(data['password'])

    # Crear nueva fila
    nueva_fila = {
        'id': nuevo_id,
        'nombre': data['nombre'],
        'apellido': data['apellido'],
        'email': data['email'],
        'cargo': data.get('cargo', ''),
        'password_hash': password_hash
    }

    # Añadir al DataFrame
    df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
    escribir_csv('evaluadores.csv', df)

    # Preparar respuesta sin el hash
    respuesta = nueva_fila.copy()
    respuesta.pop('password_hash')
    return jsonify(respuesta), 201

@evaluadores_bp.route('/api/evaluadores/<int:id>', methods=['PUT'])
def actualizar_evaluador(id):
    """Actualiza un evaluador existente."""
    data = request.get_json()
    df = leer_csv('evaluadores.csv')
    
    # Verificar que el evaluador existe
    if id not in df['id'].values:
        return jsonify({"error": "Evaluador no encontrado"}), 404

    # Si se actualiza el email, verificar que no exista en otro registro
    if 'email' in data:
        if email_existe(data['email'], df, id_ignorar=id):
            return jsonify({"error": "El email ya está registrado por otro evaluador"}), 400

    # Actualizar campos (solo los proporcionados)
    for campo in data:
        if campo in df.columns:
            valor = data[campo]
            if campo == 'password':
                # Si es password, generar hash y guardar en password_hash
                df.loc[df['id'] == id, 'password_hash'] = generate_password_hash(valor)
            elif campo != 'password':  # No actualizar el campo 'password' directamente
                df.loc[df['id'] == id, campo] = valor

    escribir_csv('evaluadores.csv', df)
    
    # Obtener el evaluador actualizado y quitar el hash
    evaluador_actualizado = df[df['id'] == id].to_dict(orient='records')[0]
    evaluador_actualizado.pop('password_hash', None)
    return jsonify(evaluador_actualizado)

@evaluadores_bp.route('/api/evaluadores/<int:id>', methods=['DELETE'])
def eliminar_evaluador(id):
    """Elimina un evaluador."""
    df = leer_csv('evaluadores.csv')
    
    if id not in df['id'].values:
        return jsonify({"error": "Evaluador no encontrado"}), 404

    df = df[df['id'] != id]
    escribir_csv('evaluadores.csv', df)
    return jsonify({"mensaje": "Evaluador eliminado correctamente"}), 200