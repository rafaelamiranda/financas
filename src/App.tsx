import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Saldos from './pages/Saldos';
import Totais from './pages/Totais';
import Tags from './pages/Tags';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Saldos />} />
          <Route path="/totais" element={<Totais />} />
          <Route path="/tags" element={<Tags />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
