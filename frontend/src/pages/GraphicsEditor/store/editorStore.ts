import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  GraphicElement,
  Connection,
  DataBinding,
  HistoryAction,
  Point,
} from '../types';

interface EditorState {
  // 图形元素
  elements: GraphicElement[];
  connections: Connection[];
  dataBindings: DataBinding[];

  // 选择状态
  selectedIds: string[];
  hoveredId: string | null;

  // 剪贴板
  clipboard: GraphicElement[];

  // 编辑状态
  scale: number;
  offset: Point;
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;

  // 历史记录
  history: HistoryAction[];
  historyIndex: number;

  // 操作方法
  addElement: (element: GraphicElement) => void;
  updateElement: (id: string, updates: Partial<GraphicElement>) => void;
  updateElementSilent: (id: string, updates: Partial<GraphicElement>) => void;
  deleteElements: (ids: string[]) => void;
  clearAll: () => void;
  copyElements: (ids: string[]) => void;
  pasteElements: () => void;

  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;

  selectElement: (ids: string | string[], multi?: boolean) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;

  setScale: (scale: number) => void;
  setOffset: (offset: Point) => void;

  undo: () => void;
  redo: () => void;

  // 计算属性
  canUndo: boolean;
  canRedo: boolean;
}

// 创建唯一ID
const createId = () => `element_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      elements: [],
      connections: [],
      dataBindings: [],

      selectedIds: [],
      hoveredId: null,
      clipboard: [],

      scale: 1,
      offset: { x: 0, y: 0 },
      gridEnabled: true,
      gridSize: 20,
      snapToGrid: true,

      history: [],
      historyIndex: -1,
      
      // 元素操作
      addElement: (element) => set((state) => {
        const newElement = {
          ...element,
          id: element.id || createId(),
        };
        
        state.elements.push(newElement);
        
        // 添加到历史记录
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({
          type: 'add',
          timestamp: Date.now(),
          data: { element: newElement },
        });
        state.historyIndex++;
      }),
      
      updateElement: (id, updates) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index !== -1) {
          const oldElement = { ...state.elements[index] };
          Object.assign(state.elements[index], updates);
          
          // 添加到历史记录
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push({
            type: 'update',
            timestamp: Date.now(),
            data: { 
              id, 
              oldValues: oldElement,
              newValues: state.elements[index],
            },
          });
          state.historyIndex++;
        }
      }),
      
      // 静默更新（不写入历史，用于数据绑定实时刷新）
      updateElementSilent: (id, updates) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index !== -1) {
          Object.assign(state.elements[index], updates);
        }
      }),

      // 复制到剪贴板
      copyElements: (ids) => set((state) => {
        state.clipboard = state.elements
          .filter(el => ids.includes(el.id))
          .map(el => JSON.parse(JSON.stringify(el)));
      }),

      // 从剪贴板粘贴
      pasteElements: () => set((state) => {
        if (state.clipboard.length === 0) return;
        const newIds: string[] = [];
        state.clipboard.forEach((el, i) => {
          const newEl: GraphicElement = {
            ...JSON.parse(JSON.stringify(el)),
            id: `${el.type}_${Date.now()}_${i}`,
            position: { x: el.position.x + 20, y: el.position.y + 20 },
          };
          state.elements.push(newEl);
          newIds.push(newEl.id);
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push({ type: 'add', timestamp: Date.now(), data: { element: newEl } });
          state.historyIndex++;
        });
        state.selectedIds = newIds;
      }),

      deleteElements: (ids) => set((state) => {
        const deletedElements = state.elements.filter(el => ids.includes(el.id));
        state.elements = state.elements.filter(el => !ids.includes(el.id));
        
        // 同时删除相关连接
        const deletedConnections = state.connections.filter(
          conn => ids.includes(conn.source.elementId) || ids.includes(conn.target.elementId)
        );
        state.connections = state.connections.filter(
          conn => !ids.includes(conn.source.elementId) && !ids.includes(conn.target.elementId)
        );
        
        // 清除选择
        state.selectedIds = state.selectedIds.filter(id => !ids.includes(id));
        
        // 添加到历史记录
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({
          type: 'delete',
          timestamp: Date.now(),
          data: { 
            elements: deletedElements,
            connections: deletedConnections,
          },
        });
        state.historyIndex++;
      }),
      
      // 连接操作
      addConnection: (connection) => set((state) => {
        const newConnection = {
          ...connection,
          id: connection.id || createId(),
        };
        
        state.connections.push(newConnection);
      }),
      
      updateConnection: (id, updates) => set((state) => {
        const index = state.connections.findIndex(conn => conn.id === id);
        if (index !== -1) {
          Object.assign(state.connections[index], updates);
        }
      }),
      
      deleteConnection: (id) => set((state) => {
        state.connections = state.connections.filter(conn => conn.id !== id);
      }),
      
      // 清空所有
      clearAll: () => set((state) => {
        state.elements = [];
        state.connections = [];
        state.dataBindings = [];
        state.selectedIds = [];
        state.hoveredId = null;
        state.clipboard = [];
        state.history = [];
        state.historyIndex = -1;
      }),
      
      // 选择操作
      selectElement: (ids, multi = false) => set((state) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        
        if (multi) {
          // 多选模式：切换选择状态
          idArray.forEach(id => {
            const index = state.selectedIds.indexOf(id);
            if (index !== -1) {
              state.selectedIds.splice(index, 1);
            } else {
              state.selectedIds.push(id);
            }
          });
        } else {
          // 单选模式：替换选择
          state.selectedIds = idArray;
        }
      }),
      
      clearSelection: () => set((state) => {
        state.selectedIds = [];
      }),
      
      setHovered: (id) => set((state) => {
        state.hoveredId = id;
      }),
      
      // 视图操作
      setScale: (scale) => set((state) => {
        state.scale = Math.max(0.1, Math.min(5, scale));
      }),
      
      setOffset: (offset) => set((state) => {
        state.offset = offset;
      }),
      
      // 撤销/重做
      undo: () => set((state) => {
        if (state.historyIndex >= 0) {
          const action = state.history[state.historyIndex];
          
          // 执行撤销操作
          switch (action.type) {
            case 'add':
              state.elements = state.elements.filter(
                el => el.id !== action.data.element.id
              );
              break;
              
            case 'delete':
              state.elements.push(...action.data.elements);
              state.connections.push(...(action.data.connections || []));
              break;
              
            case 'update':
              const index = state.elements.findIndex(
                el => el.id === action.data.id
              );
              if (index !== -1) {
                state.elements[index] = action.data.oldValues;
              }
              break;
          }
          
          state.historyIndex--;
        }
      }),
      
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const action = state.history[state.historyIndex];
          
          // 执行重做操作
          switch (action.type) {
            case 'add':
              state.elements.push(action.data.element);
              break;
              
            case 'delete':
              state.elements = state.elements.filter(
                el => !action.data.elements.find((del: GraphicElement) => del.id === el.id)
              );
              state.connections = state.connections.filter(
                conn => !action.data.connections?.find((del: Connection) => del.id === conn.id)
              );
              break;
              
            case 'update':
              const index = state.elements.findIndex(
                el => el.id === action.data.id
              );
              if (index !== -1) {
                state.elements[index] = action.data.newValues;
              }
              break;
          }
        }
      }),
      
      // 计算属性
      get canUndo() {
        return get().historyIndex >= 0;
      },
      
      get canRedo() {
        return get().historyIndex < get().history.length - 1;
      },
    }))
  )
);