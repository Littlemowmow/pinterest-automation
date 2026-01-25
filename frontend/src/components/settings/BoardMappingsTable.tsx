'use client';

import { useState } from 'react';
import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BoardMapping } from '@/lib/types';

interface BoardMappingsTableProps {
  mappings: BoardMapping[];
  onUpdate: (category: string, data: Partial<BoardMapping>) => void;
  onAdd?: (mapping: BoardMapping) => void;
  onDelete?: (category: string) => void;
}

export function BoardMappingsTable({ mappings, onUpdate, onAdd, onDelete }: BoardMappingsTableProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BoardMapping>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [newMapping, setNewMapping] = useState<Partial<BoardMapping>>({
    category: '',
    board_name: '',
    link_url: '',
  });

  const allSelected = mappings.length > 0 && selectedCategories.size === mappings.length;
  const someSelected = selectedCategories.size > 0 && selectedCategories.size < mappings.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(mappings.map(m => m.category)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSelectOne = (category: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(category);
    } else {
      newSelected.delete(category);
    }
    setSelectedCategories(newSelected);
  };

  const handleBulkDelete = () => {
    if (onDelete) {
      selectedCategories.forEach(category => onDelete(category));
    }
    setSelectedCategories(new Set());
  };

  const handleEdit = (mapping: BoardMapping) => {
    setEditingCategory(mapping.category);
    setEditValues({
      board_name: mapping.board_name,
      link_url: mapping.link_url || '',
    });
  };

  const handleSave = (category: string) => {
    onUpdate(category, editValues);
    setEditingCategory(null);
    setEditValues({});
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValues({});
  };

  const handleAddNew = () => {
    if (onAdd && newMapping.category && newMapping.board_name) {
      onAdd({
        id: crypto.randomUUID(),
        category: newMapping.category.toLowerCase().trim(),
        board_name: newMapping.board_name.trim(),
        link_url: newMapping.link_url?.trim() || undefined,
      });
      setNewMapping({ category: '', board_name: '', link_url: '' });
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewMapping({ category: '', board_name: '', link_url: '' });
    setIsAdding(false);
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-section text-foreground">Board Mappings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Map categories to Pinterest boards. Add as many as you need.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategories.size > 0 && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete ({selectedCategories.size})
            </Button>
          )}
          {!isAdding && onAdd && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Mapping
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="font-medium text-foreground">Category</TableHead>
              <TableHead className="font-medium text-foreground">Board Name</TableHead>
              <TableHead className="font-medium text-foreground">Link URL</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add New Row */}
            {isAdding && (
              <TableRow className="bg-primary/5">
                <TableCell></TableCell>
                <TableCell>
                  <Input
                    value={newMapping.category || ''}
                    onChange={(e) => setNewMapping({ ...newMapping, category: e.target.value })}
                    placeholder="e.g., wedding"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newMapping.board_name || ''}
                    onChange={(e) => setNewMapping({ ...newMapping, board_name: e.target.value })}
                    placeholder="e.g., Wedding Ideas"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newMapping.link_url || ''}
                    onChange={(e) => setNewMapping({ ...newMapping, link_url: e.target.value })}
                    placeholder="Optional link URL"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                      onClick={handleAddNew}
                      disabled={!newMapping.category || !newMapping.board_name}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelAdd}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Existing Mappings */}
            {mappings.map((mapping, index) => (
              <TableRow
                key={mapping.category}
                className={cn(
                  'group',
                  index % 2 === 0 ? 'bg-background' : 'bg-secondary/30',
                  selectedCategories.has(mapping.category) && 'bg-primary/5'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedCategories.has(mapping.category)}
                    onCheckedChange={(checked) => handleSelectOne(mapping.category, checked as boolean)}
                    aria-label={`Select ${mapping.category}`}
                  />
                </TableCell>
                <TableCell className="font-medium capitalize text-foreground">
                  {mapping.category}
                </TableCell>
                <TableCell>
                  {editingCategory === mapping.category ? (
                    <Input
                      value={editValues.board_name || ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, board_name: e.target.value })
                      }
                      className="h-8"
                    />
                  ) : (
                    <span className="text-muted-foreground">{mapping.board_name}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingCategory === mapping.category ? (
                    <Input
                      value={editValues.link_url || ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, link_url: e.target.value })
                      }
                      placeholder="Optional link URL"
                      className="h-8"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {mapping.link_url || '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingCategory === mapping.category ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleSave(mapping.category)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-secondary"
                        onClick={() => handleEdit(mapping)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(mapping.category)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Selection info */}
      {selectedCategories.size > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {selectedCategories.size} of {mappings.length} selected
        </p>
      )}
    </div>
  );
}
