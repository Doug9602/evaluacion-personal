from utils.manejador_csv import leer_csv, escribir_csv, generar_id
import pandas as pd

print("ID generado (primera vez):", generar_id('prueba.csv'))

df = pd.DataFrame([
    {"id": 1, "nombre": "Juan"},
    {"id": 2, "nombre": "Ana"}
])

escribir_csv('prueba.csv', df)
print("Archivo 'prueba.csv' guardado en la carpeta data.")

df_leido = leer_csv('prueba.csv')
print("Contenido leído:")
print(df_leido)

print("ID generado después de guardar:", generar_id('prueba.csv'))