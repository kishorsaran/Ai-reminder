import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, MotionValue } from 'motion/react';
import { Board, Note, AppData } from '../types';
import { Plus, ChevronLeft, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { saveBoard, deleteBoard, saveNote, deleteNote } from '../utils/firestore';

const PASTEL_COLORS = [
  '#FFF5E1', // Light Yellow
  '#FFE4E1', // Misty Rose
  '#E0FFFF', // Light Cyan
  '#F0FFF0', // Honeydew
  '#F5F5DC', // Beige
  '#E6E6FA', // Lavender
];

interface PinnedNotesProps {
  data: AppData;
  userId: string;
  onFocusModeChange?: (isFocused: boolean) => void;
}

export default function PinnedNotesCanvas({ data, userId, onFocusModeChange }: PinnedNotesProps) {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const boards = data.boards || [];

  useEffect(() => {
    if (onFocusModeChange) {
      onFocusModeChange(activeBoardId !== null);
    }
    // Cleanup when unmounting
    return () => {
      if (onFocusModeChange) {
        onFocusModeChange(false);
      }
    };
  }, [activeBoardId, onFocusModeChange]);

  const createBoard = () => {
    const newBoard: Board = {
      id: Date.now().toString(),
      name: `Board ${boards.length + 1}`,
      createdAt: new Date().getTime(),
    };
    saveBoard(userId, newBoard);
  };

  const handleDeleteBoard = (id: string) => {
    setBoardToDelete(id);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      deleteBoard(userId, boardToDelete);
      // Also delete all notes in this board
      const notesInBoard = data.notes.filter(n => n.boardId === boardToDelete);
      notesInBoard.forEach(n => deleteNote(userId, n.id));
      setBoardToDelete(null);
    }
  };

  const cancelDeleteBoard = () => {
    setBoardToDelete(null);
  };

  const startEditingBoard = (board: Board) => {
    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
  };

  const saveBoardName = (board: Board) => {
    if (editingBoardName.trim() && editingBoardName !== board.name) {
      saveBoard(userId, { ...board, name: editingBoardName.trim() });
    }
    setEditingBoardId(null);
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

  if (activeBoard) {
    return (
      <BoardCanvas 
        board={activeBoard} 
        notes={data.notes.filter(n => n.boardId === activeBoard.id)}
        userId={userId}
        onClose={() => setActiveBoardId(null)}
      />
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl heading-primary text-primary">Pinned Notes</h2>
          <p className="text-xs text-secondary mt-1">Creative workspace for your ideas</p>
        </div>
        <button 
          onClick={createBoard}
          className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-inner border border-white/5"
        >
          <Plus size={20} className="text-primary" />
        </button>
      </div>
      
      {boards.length === 0 ? (
        <div className="glass-panel p-6 rounded-2xl text-center border-dashed border-white/20">
          <p className="text-secondary text-sm">No boards yet. Create one to pin notes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {boards.map(board => {
            const noteCount = data.notes.filter(n => n.boardId === board.id).length;
            return (
              <div 
                key={board.id}
                onClick={() => {
                  if (editingBoardId !== board.id) {
                    setActiveBoardId(board.id);
                  }
                }}
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all flex flex-col group relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
                
                {editingBoardId === board.id ? (
                  <input
                    type="text"
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    onBlur={() => saveBoardName(board)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveBoardName(board);
                      if (e.key === 'Escape') setEditingBoardId(null);
                    }}
                    className="text-primary font-medium text-base mb-1 bg-transparent border-b border-white/30 focus:outline-none focus:border-white w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className="text-primary font-medium text-base mb-1">{board.name}</h3>
                )}
                
                <p className="text-xs text-secondary">{noteCount} notes</p>
                
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEditingBoard(board); }}
                    className="p-1.5 text-secondary hover:text-primary hover:bg-white/20 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                    className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {boardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border border-[#3b82f6]/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold text-primary">Delete Board</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this board? All notes inside it will be lost. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteBoard}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBoard}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BoardCanvas({ board, notes, userId, onClose }: { board: Board, notes: Note[], userId: string, onClose: () => void }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [paletteNoteId, setPaletteNoteId] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  
  const canvasX = useMotionValue(0);
  const canvasY = useMotionValue(0);
  const canvasScale = useMotionValue(1);

  useEffect(() => {
    if (viewportRef.current) {
      const { clientWidth, clientHeight } = viewportRef.current;
      canvasX.set(-(4000 - clientWidth) / 2);
      canvasY.set(-(4000 - clientHeight) / 2);
    }
  }, [canvasX, canvasY]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const currentScale = canvasScale.get();
        const zoomSensitivity = 0.005;
        const delta = -e.deltaY * zoomSensitivity;
        let newScale = currentScale * (1 + delta);
        newScale = Math.max(0.5, Math.min(newScale, 2.5));

        const rect = viewport.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        
        const scaleRatio = newScale / currentScale;
        
        const newX = pointerX - (pointerX - canvasX.get()) * scaleRatio;
        const newY = pointerY - (pointerY - canvasY.get()) * scaleRatio;

        canvasScale.set(newScale);
        canvasX.set(newX);
        canvasY.set(newY);
      } else {
        // Pan
        canvasX.set(canvasX.get() - e.deltaX);
        canvasY.set(canvasY.get() - e.deltaY);
      }
    };

    let initialDistance = 0;
    let initialScale = 1;
    let initialCenter = { x: 0, y: 0 };
    let initialCanvasX = 0;
    let initialCanvasY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsZooming(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        initialScale = canvasScale.get();
        initialCanvasX = canvasX.get();
        initialCanvasY = canvasY.get();
        
        const rect = viewport.getBoundingClientRect();
        initialCenter = {
          x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
          y: (touch1.clientY + touch2.clientY) / 2 - rect.top
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        
        let newScale = initialScale * (currentDistance / initialDistance);
        newScale = Math.max(0.5, Math.min(newScale, 2.5));
        
        const scaleRatio = newScale / initialScale;
        
        const newX = initialCenter.x - (initialCenter.x - initialCanvasX) * scaleRatio;
        const newY = initialCenter.y - (initialCenter.y - initialCanvasY) * scaleRatio;

        canvasScale.set(newScale);
        canvasX.set(newX);
        canvasY.set(newY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsZooming(false);
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);
    viewport.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [canvasX, canvasY, canvasScale]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left - canvasX.get()) / canvasScale.get() - 110; // Center note (220/2)
    const y = (e.clientY - rect.top - canvasY.get()) / canvasScale.get() - 110;

    const newNote: Note = {
      id: Date.now().toString(),
      boardId: board.id,
      content: 'Double click to edit',
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
      x,
      y,
      updatedAt: new Date().getTime(),
    };

    saveNote(userId, newNote);
  };

  const updateNote = (note: Note, updates: Partial<Note>) => {
    saveNote(userId, { ...note, ...updates, updatedAt: new Date().getTime() });
  };

  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteNote(userId, noteToDelete);
      setNoteToDelete(null);
    }
  };

  const cancelDeleteNote = () => {
    setNoteToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617] font-sans">
      {/* Header */}
      <div className="h-16 bg-[#020617]/80 backdrop-blur-md border-b border-[#3b82f6]/20 flex items-center px-4 shadow-sm z-20">
        <button onClick={onClose} className="p-2 mr-3 hover:bg-white/10 rounded-full text-primary transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-primary flex-1 tracking-tight">{board.name}</h2>
        <span className="text-xs font-medium text-secondary bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Double tap to add note</span>
      </div>

      {/* Canvas Viewport */}
      <div 
        ref={viewportRef}
        className="flex-1 relative overflow-hidden touch-none"
        onPointerDown={(e) => {
          if (e.target === viewportRef.current || e.target === canvasRef.current) {
            setEditingNoteId(null);
            setPaletteNoteId(null);
          }
        }}
      >
        <motion.div
          ref={canvasRef}
          drag={!isZooming}
          dragConstraints={viewportRef}
          dragElastic={0.5}
          onDoubleClick={handleDoubleClick}
          style={{
            width: 4000,
            height: 4000,
            x: canvasX,
            y: canvasY,
            scale: canvasScale,
            transformOrigin: '0 0',
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            cursor: isZooming ? 'zoom-in' : 'grab'
          }}
          whileTap={{ cursor: isZooming ? 'zoom-in' : 'grabbing' }}
          className="absolute"
        >
          {notes.map(note => (
            <NoteItem 
              key={note.id} 
              note={note} 
              updateNote={updateNote} 
              deleteNote={handleDeleteNote}
              isEditing={editingNoteId === note.id}
              setEditing={(isEditing) => {
                setEditingNoteId(isEditing ? note.id : null);
                if (isEditing) setPaletteNoteId(null);
              }}
              isPaletteOpen={paletteNoteId === note.id}
              setPaletteOpen={(isOpen) => {
                setPaletteNoteId(isOpen ? note.id : null);
                if (isOpen) setEditingNoteId(null);
              }}
              canvasScale={canvasScale}
            />
          ))}
        </motion.div>
      </div>

      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border border-[#3b82f6]/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold text-primary">Delete Note</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteNote}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNote}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteItem({ note, updateNote, deleteNote, isEditing, setEditing, isPaletteOpen, setPaletteOpen, canvasScale }: { 
  note: Note, 
  updateNote: (note: Note, updates: Partial<Note>) => void,
  deleteNote: (id: string) => void,
  isEditing: boolean,
  setEditing: (val: boolean) => void,
  isPaletteOpen: boolean,
  setPaletteOpen: (val: boolean) => void,
  canvasScale: MotionValue<number>
}) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [localContent, setLocalContent] = useState(note.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalContent(note.content);
    }
  }, [note.content, isEditing]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(note, { content: newContent });
    }, 500);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isEditing || isPaletteOpen) return;
    longPressTimer.current = setTimeout(() => {
      setPaletteOpen(true);
    }, 400);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const showPalette = isEditing || isPaletteOpen;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onDragStart={cancelLongPress}
      onDragEnd={(e, info) => {
        cancelLongPress();
        updateNote(note, { 
          x: note.x + info.offset.x / canvasScale.get(), 
          y: note.y + info.offset.y / canvasScale.get() 
        });
      }}
      initial={{ x: note.x, y: note.y, scale: 0.8, opacity: 0 }}
      animate={{ x: note.x, y: note.y, scale: 1, opacity: 1 }}
      whileDrag={{ scale: 1.03, boxShadow: '0 15px 35px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        position: 'absolute',
        backgroundColor: note.color,
        transition: 'background-color 200ms ease',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
        borderRadius: '16px',
        width: '220px',
        minHeight: '220px',
        padding: '28px 20px 20px',
        cursor: isEditing ? 'default' : 'grab',
        color: '#2D3748'
      }}
      className="flex flex-col group"
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Delete button */}
      <button 
        onClick={() => deleteNote(note.id)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-black/30 hover:text-red-500 hover:bg-black/5 rounded-full transition-all"
      >
        <Trash2 size={14} />
      </button>

      {/* Edit button */}
      <button 
        onClick={() => setEditing(!isEditing)}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 p-1.5 text-black/30 hover:text-blue-500 hover:bg-black/5 rounded-full transition-all"
      >
        <Edit2 size={14} />
      </button>

      {isEditing ? (
        <div className="flex-1 flex flex-col mt-3 space-y-3">
          <textarea 
            value={localContent}
            onChange={handleContentChange}
            className="text-sm bg-transparent border-none focus:outline-none resize-none flex-1 px-1 text-gray-700 leading-relaxed"
            placeholder="Description"
            autoFocus
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col mt-3 pointer-events-none">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
        </div>
      )}

      {/* Color Palette */}
      {showPalette && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-xl px-3 py-2 flex items-center gap-2 z-50 border border-black/5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {PASTEL_COLORS.map(color => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation();
                updateNote(note, { color });
              }}
              className={`w-7 h-7 rounded-full border shadow-sm transition-transform hover:scale-110 ${note.color === color ? 'border-black/30 scale-110' : 'border-black/5'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
