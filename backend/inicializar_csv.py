import os
import pandas as pd
from utils.manejador_csv import CARPETA_DATA, asegurar_carpeta_data

asegurar_carpeta_data()

archivos = {
    'candidatos.csv': ['id', 'nombre', 'apellido', 'email', 'telefono', 'fecha_nacimiento', 'genero', 'cargo_id', 'fecha_registro'],
    'evaluadores.csv': ['id', 'nombre', 'apellido', 'email', 'cargo', 'password_hash'],
    'cargos.csv': ['id', 'nombre', 'descripcion', 'departamento'],
    'tests.csv': ['id', 'nombre', 'tipo', 'instrucciones', 'tiempo_limite', 'activo'],
    'preguntas.csv': ['id', 'test_id', 'texto', 'tipo_pregunta', 'orden', 'opciones_json'],
    'opciones.csv': ['id', 'pregunta_id', 'texto', 'valor'],  # Nota: antes era 'valor_puntuacion', pero en el sistema usamos 'valor' (en las opciones de múltiple)
    'respuestas.csv': ['id', 'candidato_id', 'test_id', 'evaluador_id', 'fecha', 'respuestas_json'],
    'resultados.csv': ['id', 'candidato_id', 'test_id', 'fecha', 'puntuacion_directa', 'percentil', 'interpretacion', 'respuesta_id'],  # Añadimos respuesta_id para vincular
    'baremos.csv': ['test_id', 'subgrupo', 'percentil_10', 'percentil_20', 'percentil_30', 'percentil_40', 'percentil_50', 'percentil_60', 'percentil_70', 'percentil_80', 'percentil_90'],
    'escalas.csv': ['id', 'test_id', 'nombre', 'descripcion'],  # Añadido
    'pregunta_escala.csv': ['id', 'pregunta_id', 'escala_id', 'peso'],  # Añadido
    'resultados_escalas.csv': ['id', 'respuesta_id', 'escala_id', 'puntuacion', 'maximo', 'porcentaje'],  # Añadido
}

for nombre, columnas in archivos.items():
    ruta_completa = os.path.join(CARPETA_DATA, nombre)
    if not os.path.exists(ruta_completa):
        df = pd.DataFrame(columns=columnas)
        df.to_csv(ruta_completa, index=False)
        print(f"Archivo {nombre} creado.")
    else:
        print(f"Archivo {nombre} ya existe, no se sobrescribe.")