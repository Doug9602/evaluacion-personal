from flask import Flask, jsonify
from flask_cors import CORS
from routes.candidatos import candidatos_bp
from routes.cargos import cargos_bp
from routes.evaluadores import evaluadores_bp
from routes.tests import tests_bp
from routes.preguntas import preguntas_bp
from routes.opciones import opciones_bp
from routes.respuestas import respuestas_bp
from routes.resultados import resultados_bp
from routes.escalas import escalas_bp
from routes.reportes import reportes_bp
from routes.envio import envio_bp

app = Flask(__name__)
CORS(app)

# Registrar blueprints
app.register_blueprint(candidatos_bp)
app.register_blueprint(cargos_bp)
app.register_blueprint(evaluadores_bp)
app.register_blueprint(tests_bp)
app.register_blueprint(preguntas_bp)
app.register_blueprint(opciones_bp)
app.register_blueprint(respuestas_bp)
app.register_blueprint(resultados_bp)
app.register_blueprint(escalas_bp)
app.register_blueprint(reportes_bp)
app.register_blueprint(envio_bp)

@app.route('/')
def home():
    return jsonify({"mensaje": "API de Evaluación de Personal funcionando"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)