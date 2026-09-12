import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useFinancasStore } from '../store';
import { formatCurrency, getMonthName } from '../utils';
import { TAG_COLOR_PRESETS } from '../types';
import type { Tag } from '../types';

export default function Tags() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PRESETS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const tags = useFinancasStore((state) => state.tags);
  const transactions = useFinancasStore((state) => state.transactions);
  const addTag = useFinancasStore((state) => state.addTag);
  const deleteTag = useFinancasStore((state) => state.deleteTag);
  const updateTag = useFinancasStore((state) => state.updateTag);
  const reorderTags = useFinancasStore((state) => state.reorderTags);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      setNewTagColor(TAG_COLOR_PRESETS[0]);
      setShowAddTag(false);
    }
  };

  const startEditTag = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setEditingTag(tagId);
      setEditTagName(tag.name);
      setEditTagColor(tag.color);
      setShowMenu(null);
    }
  };

  const handleEditTag = () => {
    if (editingTag && editTagName.trim()) {
      updateTag(editingTag, {
        name: editTagName,
        color: editTagColor,
      });
      setEditingTag(null);
      setEditTagName('');
      setEditTagColor('');
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

  const sortedTags = [...tags].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const filteredTags = sortedTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFiltering = searchQuery.trim().length > 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTags.findIndex((t) => t.id === active.id);
    const newIndex = sortedTags.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedTags, oldIndex, newIndex);
    reorderTags(reordered.map((t) => t.id));
  };

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
            className="px-4 py-2 bg-entrada text-bg-primary font-bold rounded-lg hover:bg-entrada/90 transition"
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
          ) : isFiltering ? (
            <div className="space-y-2">
              {filteredTags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  total={getTagTotal(tag.id)}
                  showMenu={showMenu === tag.id}
                  onToggleMenu={() => setShowMenu(showMenu === tag.id ? null : tag.id)}
                  onEdit={() => startEditTag(tag.id)}
                  onDelete={() => {
                    deleteTag(tag.id);
                    setShowMenu(null);
                  }}
                />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredTags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {filteredTags.map((tag) => (
                    <SortableTagRow
                      key={tag.id}
                      tag={tag}
                      total={getTagTotal(tag.id)}
                      showMenu={showMenu === tag.id}
                      onToggleMenu={() => setShowMenu(showMenu === tag.id ? null : tag.id)}
                      onEdit={() => startEditTag(tag.id)}
                      onDelete={() => {
                        deleteTag(tag.id);
                        setShowMenu(null);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center">
          <div className="w-full md:w-96 bg-card-dark rounded-t-2xl md:rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Editar tag</h2>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Nome</label>
              <input
                type="text"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="Nome da tag"
                className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-3">Cor</label>
              <div className="grid grid-cols-4 gap-3">
                {TAG_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditTagColor(color)}
                    className={`w-full aspect-square rounded-lg transition ${
                      editTagColor === color
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
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={editTagColor}
                  onChange={(e) => setEditTagColor(e.target.value)}
                  placeholder="#7ED957"
                  className="flex-1 bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setEditingTag(null);
                  setEditTagName('');
                  setEditTagColor('');
                }}
                className="flex-1 py-2 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-card-hover/50 transition font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditTag}
                disabled={!editTagName.trim()}
                className="flex-1 py-2 px-4 rounded-lg font-bold text-bg-primary bg-entrada hover:bg-entrada/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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
                {TAG_COLOR_PRESETS.map((color) => (
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
                className="flex-1 py-2 px-4 rounded-lg font-bold text-bg-primary bg-entrada hover:bg-entrada/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

interface TagRowProps {
  tag: Tag;
  total: number;
  showMenu: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dragHandle?: ReactNode;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
}

function TagRow({ tag, total, showMenu, onToggleMenu, onEdit, onDelete, dragHandle, setNodeRef, style }: TagRowProps) {
  const isZero = total === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 rounded-lg transition ${
        isZero ? 'bg-card-hover/20 opacity-50' : 'bg-card-hover/30 hover:bg-card-hover/50'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {dragHandle}
        <div
          className="w-6 h-6 rounded-full border-2"
          style={{ borderColor: tag.color, backgroundColor: tag.color + '20' }}
        />
        <span className="font-semibold text-white">{tag.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-bold text-sm" style={{ color: tag.color }}>
          {formatCurrency(total)}
        </span>
        <div className="relative">
          <button
            onClick={onToggleMenu}
            aria-label="Opções da tag"
            className="text-gray-400 hover:text-white transition p-1"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card-hover border border-card-hover/50 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={onEdit}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-card-hover/50 transition first:rounded-t-lg"
              >
                Editar
              </button>
              <button
                onClick={onDelete}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition last:rounded-b-lg"
              >
                Deletar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableTagRow(props: Omit<TagRowProps, 'dragHandle' | 'setNodeRef' | 'style'>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.tag.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      aria-label="Reordenar tag"
      className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1 touch-none"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return <TagRow {...props} dragHandle={dragHandle} setNodeRef={setNodeRef} style={style} />;
}
