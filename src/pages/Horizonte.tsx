import { TrendingUp } from 'lucide-react';

export default function Horizonte() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="sticky top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6">
        <h1 className="text-2xl font-bold text-white">horizonte</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-6">
        <div className="space-y-3">
          <TrendingUp className="h-10 w-10 mx-auto text-gray-600" />
          <p>Projeção de saldo futuro em breve</p>
          <p className="text-sm max-w-sm">
            Vai consolidar recorrências e médias históricas para prever se haverá saldo negativo nos próximos meses.
          </p>
        </div>
      </div>
    </div>
  );
}
