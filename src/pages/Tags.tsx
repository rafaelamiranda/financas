import { useState } from 'react';
import { useFinancasStore } from '../store';
import { formatCurrency, getMonthName } from '../utils';

export default function Tags() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#7ED957');
  const [searchQuery, setSearchQuery] = useState('');

  const tags = useFinancasStore((state) => state.tags);
  const transactions = useFinancasStore((state) => state.transactions);
  const addTag = useFinancasStore((state) => state.addTag);
  const deleteTag = useFinancasStore((state) => state.deleteTag);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName,
        color: newTagColor,
      });
      setNewTagName('');
      setNewTagColor('#7ED957');
      setShowAddTag(false);
    }
  };

  const getTagTotal = (tagId: string): number => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.tag_ids.includes(tagId) &&
          tDate.getFullYear() === year &&
          tDate.getMonth() === month
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const COLOR_PRESETS = [
    '#7ED957', // Green
    '#FF6B6B', // Red
    '#FF69B4', // Pink
    '#ADFF2F', // Lime
    '#9D4EDD', // Purple
    '#00BCD4', // Cyan
    '#FFA500', // Orange
    '#4ECDC4', // Teal
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 md:top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">tags</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-300 min-w-40 text-center">
              {getMonthName(currentDate)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ›
            </button>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Filtrar tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card-hover border border-card-hover/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
            />
          </div>
          <button
            onClick={() => setShowAddTag(true)}
            className="px-4 py-2 bg-entrada text-bg-primary font-bold rounded-lg hover:bg-opacity-90 transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          {filteredTags.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>
                {searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada'}
              </p>
              <p className="text-sm mt-2">Crie uma nova tag para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tag) => {
                const total = getTagTotal(tag.id);
                const isZero = total === 0;

                return (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition ${
                      isZero ? 'bg-card-hover/20 opacity-50' : 'bg-card-hover/30 hover:bg-card-hover/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-6 h-6 rounded-full border-2"
                        style={{ borderColor: tag.color, backgroundColor: tag.color + '20' }}
                      />
                      <span className="font-semibold text-white">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="font-bold text-sm"
                        style={{ color: tag.color }}
                      >
                        {formatCurrency(total)}
                      </span>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="text-gray-400 hover:text-red-400 transition p-1"
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Tag Modal */}
      {showAddTag && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center">
          <div className="w-full md:w-96 bg-card-dark rounded-t-2xl md:rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Criar nova tag</h2>

            {/* Name Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Nome</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="ex: Mercado, Academia..."
                className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-sm text-gray-400 block mb-3">Cor</label>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-full aspect-square rounded-lg transition ${
                      newTagColor === color
                        ? 'ring-2 ring-offset-2 ring-white'
                        : 'hover:opacity-80'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#7ED957"
                  className="flex-1 bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada text-sm"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowAddTag(false)}
                className="flex-1 py-2 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-card-hover/50 transition font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="flex-1 py-2 px-4 rounded-lg font-bold text-bg-primary bg-entrada hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
