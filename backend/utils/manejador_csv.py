import os
import pandas as pd
from typing import List, Dict, Any

# Ruta absoluta a la carpeta 'data' (junto a 'utils')
CARPETA_DATA = os.path.join(os.path.dirname(__file__), '..', 'data')

def asegurar_carpeta_data():
    """Crea la carpeta data si no existe."""
    if not os.path.exists(CARPETA_DATA):
        os.makedirs(CARPETA_DATA)

def leer_csv(archivo: str) -> pd.DataFrame:
    """
    Lee un archivo CSV desde la carpeta data y devuelve un DataFrame.
    Si el archivo no existe, retorna un DataFrame vacío.
    """
    asegurar_carpeta_data()
    ruta = os.path.join(CARPETA_DATA, archivo)
    if os.path.exists(ruta):
        return pd.read_csv(ruta)
    else:
        # Devolver DataFrame vacío (sin columnas predefinidas)
        return pd.DataFrame()

def escribir_csv(archivo: str, df: pd.DataFrame):
    """Guarda un DataFrame en la carpeta data como CSV."""
    asegurar_carpeta_data()
    ruta = os.path.join(CARPETA_DATA, archivo)
    df.to_csv(ruta, index=False)

def generar_id(archivo: str, columna_id: str = 'id') -> int:
    """
    Lee el archivo CSV, encuentra el máximo ID en la columna dada y retorna el siguiente.
    Si el archivo no existe o está vacío, retorna 1.
    """
    df = leer_csv(archivo)
    if df.empty or columna_id not in df.columns:
        return 1
    else:
        return int(df[columna_id].max()) + 1