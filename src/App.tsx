import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Saldos from './pages/Saldos';
import Totais from './pages/Totais';
import Tags from './pages/Tags';
import Horizonte from './pages/Horizonte';
import Menu from './pages/Menu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Saldos />} />
          <Route path="/totais" element={<Totais />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/horizonte" element={<Horizonte />} />
          <Route path="/settings" element={<Menu />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
