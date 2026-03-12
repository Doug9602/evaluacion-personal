import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CandidatosList from './pages/CandidatosList';
import CandidatoForm from './pages/CandidatoForm';
import CargosList from './pages/CargosList';
import CargoForm from './pages/CargoForm';
import TestsList from './pages/TestsList';
import TestForm from './pages/TestForm';
import PreguntasList from './pages/PreguntasList';
import PreguntaForm from './pages/PreguntaForm';
import AplicarTest from './pages/AplicarTest';
import ResponderTest from './pages/ResponderTest';
import ResultadosTest from './pages/ResultadosTest';
import UltimaEvaluacion from './pages/UltimaEvaluacion';
import EvaluacionesCandidato from './pages/EvaluacionesCandidato';
import DetalleEvaluacion from './pages/DetalleEvaluacion';
import EscalasList from './pages/EscalasList';
import EscalaForm from './pages/EscalaForm';
import ReporteCargo from './pages/ReporteCargo';
import RankingEscalas from './pages/RankingEscalas';
import ImportarEvaluacion from './pages/ImportarEvaluacion'; // <-- Nueva importación

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Evaluación Personal</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/candidatos">Candidatos</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/cargos">Cargos</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tests">Tests</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/preguntas">Preguntas</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/aplicar-test">Aplicar Test</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/escalas">Escalas</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/ranking-escalas">Ranking</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/importar">Importar evaluación</Link> {/* Nuevo enlace */}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<h1 className="text-center mt-5">Bienvenido al sistema de evaluación</h1>} />
        
        {/* Rutas de candidatos */}
        <Route path="/candidatos" element={<CandidatosList />} />
        <Route path="/candidatos/nuevo" element={<CandidatoForm />} />
        <Route path="/candidatos/editar/:id" element={<CandidatoForm />} />
        
        {/* Rutas de cargos */}
        <Route path="/cargos" element={<CargosList />} />
        <Route path="/cargos/nuevo" element={<CargoForm />} />
        <Route path="/cargos/editar/:id" element={<CargoForm />} />
        
        {/* Rutas de tests */}
        <Route path="/tests" element={<TestsList />} />
        <Route path="/tests/nuevo" element={<TestForm />} />
        <Route path="/tests/editar/:id" element={<TestForm />} />
        
        {/* Rutas de preguntas */}
        <Route path="/preguntas" element={<PreguntasList />} />
        <Route path="/preguntas/nuevo" element={<PreguntaForm />} />
        <Route path="/preguntas/editar/:id" element={<PreguntaForm />} />
        
        {/* Rutas de aplicación de tests */}
        <Route path="/aplicar-test" element={<AplicarTest />} />
        <Route path="/responder-test/:candidatoId/:testId" element={<ResponderTest />} />
        
        {/* Rutas de resultados */}
        <Route path="/resultados/:candidatoId/:testId" element={<ResultadosTest />} />
        <Route path="/ultima-evaluacion/:candidatoId" element={<UltimaEvaluacion />} />
        
        {/* Rutas para historial de evaluaciones */}
        <Route path="/evaluaciones-candidato/:candidatoId" element={<EvaluacionesCandidato />} />
        <Route path="/detalle-evaluacion/:respuestaId" element={<DetalleEvaluacion />} />
        
        {/* Rutas de escalas */}
        <Route path="/escalas" element={<EscalasList />} />
        <Route path="/escalas/nuevo" element={<EscalaForm />} />
        <Route path="/escalas/editar/:id" element={<EscalaForm />} />
        
        {/* Ruta de reporte por cargo */}
        <Route path="/reporte-cargo/:cargoId" element={<ReporteCargo />} />

        {/* Ruta de ranking por escalas */}
        <Route path="/ranking-escalas" element={<RankingEscalas />} />

        {/* Nueva ruta para importar evaluación */}
        <Route path="/importar" element={<ImportarEvaluacion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;