import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Tag } from '../../types';
import { TAG_COLOR_PRESETS } from '../../types';

interface TagsSectionProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onAddTag: (name: string, color: string) => void;
  sortedTags?: Tag[];
}

export default function TagsSection({
  tags,
  selectedTagIds,
  onToggleTag,
  onAddTag,
  sortedTags,
}: TagsSectionProps) {
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PRESETS[0]);

  const displayTags = sortedTags || tags;

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    onAddTag(name, newTagColor);
    setNewTagName('');
    setNewTagColor(TAG_COLOR_PRESETS[0]);
    setShowNewTagForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400">Tags</label>
        <button
          type="button"
          onClick={() => setShowNewTagForm(!showNewTagForm)}
          className="text-xs text-entrada hover:text-entrada/80 transition font-medium flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Nova tag
        </button>
      </div>

      {showNewTagForm && (
        <div className="space-y-2 p-3 bg-card-hover/30 rounded-lg">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nome da tag"
            className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-entrada"
          />
          <div className="flex gap-2 flex-wrap">
            {TAG_COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  newTagColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
            className="w-full py-2 rounded-lg text-sm font-bold text-bg-primary bg-entrada hover:bg-entrada/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              selectedTagIds.includes(tag.id)
                ? 'border-2 border-white'
                : 'border border-white/20 opacity-60 hover:opacity-100'
            }`}
            style={{ color: tag.color, borderColor: selectedTagIds.includes(tag.id) ? tag.color : undefined }}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
