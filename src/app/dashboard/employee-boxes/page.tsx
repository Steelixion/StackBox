'use client';

import React, { useState, useEffect } from 'react';
import { fetchEmployeeBoxes, createBox, deleteBox, addItemToBox, deleteItem } from '@/actions/boxes';
import { fetchEmployees } from '@/actions/employees';
import { getUserProfile } from '@/actions/auth';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  name: string;
  count: number;
  description: string;
}

interface Box {
  id: number;
  box_label: string;
  created_at: string;
  warehouse_users: {
    full_name: string;
    role: string;
    email: string;
  } | null;
  items: Item[];
}

export default function EmployeeBoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Modal states
  const [showAddBox, setShowAddBox] = useState(false);
  const [showAddItem, setShowAddItem] = useState<{boxId: number} | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  useEffect(() => {
    async function init() {
      const profile = await getUserProfile();
      if (!profile || (profile.role !== 'Manager' && profile.role !== 'Owner')) {
        router.push('/dashboard');
        return;
      }
      setUser(profile);
      loadData();
    }
    init();
  }, [router]);

  async function loadData() {
    setLoading(true);
    const [boxData, empData] = await Promise.all([
      fetchEmployeeBoxes(),
      fetchEmployees()
    ]);
    setBoxes(boxData as Box[]);
    setEmployees(empData);
    setLoading(false);
  }

  const handleCreateBox = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const label = formData.get('label') as string;
    const employeeId = formData.get('employeeId') as string;

    const res = await createBox(label, employeeId);
    if (res.success) {
      setShowAddBox(false);
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm('Are you sure you want to delete this box? All items inside will be lost.')) return;
    const res = await deleteBox(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showAddItem) return;
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      count: parseInt(formData.get('count') as string),
      description: formData.get('description') as string,
    };

    const res = await addItemToBox(showAddItem.boxId, itemData);
    if (res.success) {
      setShowAddItem(null);
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Remove this item?')) return;
    const res = await deleteItem(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-steel/10 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-steel/5 rounded-2xl border border-steel/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink tracking-tight">Box Intake Log</h1>
          <p className="text-steel mt-1">Track boxes entered by employees and their contents.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-jade/10 text-jade px-4 py-2 rounded-xl text-sm font-bold flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {boxes.length} Total Boxes
          </div>
          <button 
            onClick={() => setShowAddBox(true)}
            className="bg-deep-ink text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-deep-ink/20 hover:scale-105 transition-all flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Box
          </button>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-steel/20 p-12 text-center">
          <div className="w-16 h-16 bg-porcelain rounded-full flex items-center justify-center mx-auto mb-4 text-steel">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-deep-ink">No boxes found</h3>
          <p className="text-steel mt-1">Employee-entered boxes will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <div key={box.id} className="group bg-white rounded-2xl border border-steel/10 shadow-sm hover:shadow-xl hover:border-jade/30 transition-all duration-300 flex flex-col overflow-hidden relative">
              <button 
                onClick={() => handleDeleteBox(box.id)}
                className="absolute top-4 right-4 p-2 text-steel hover:text-cinnabar transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="p-6 border-b border-steel/5 bg-porcelain/30 group-hover:bg-jade/5 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-deep-ink text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {box.box_label}
                  </div>
                  <span className="text-[10px] text-steel font-medium pr-8">
                    {new Date(box.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-jade/10 text-jade flex items-center justify-center font-bold text-sm mr-3">
                    {box.warehouse_users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-deep-ink">{box.warehouse_users?.full_name || 'Unknown User'}</p>
                    <p className="text-[11px] text-steel uppercase tracking-tight font-bold">{box.warehouse_users?.role || 'Staff'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-steel uppercase tracking-wider flex items-center">
                    Contents
                    <span className="ml-2 w-5 h-5 bg-steel/10 rounded-full flex items-center justify-center text-[10px]">
                      {box.items.length}
                    </span>
                  </h4>
                  <button 
                    onClick={() => setShowAddItem({boxId: box.id})}
                    className="text-[10px] font-bold text-jade hover:underline uppercase tracking-wider"
                  >
                    + Add Item
                  </button>
                </div>
                
                {box.items.length === 0 ? (
                  <p className="text-sm text-steel italic">No items in this box</p>
                ) : (
                  <div className="space-y-3">
                    {box.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-porcelain/50 border border-steel/5 group/item">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-deep-ink truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-white px-2 py-1 rounded border border-steel/10 text-xs font-bold text-jade">
                            x{item.count}
                          </div>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-steel hover:text-cinnabar opacity-0 group-hover/item:opacity-100 transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {box.items.length > 3 && (
                      <p className="text-[10px] text-steel text-center italic">+{box.items.length - 3} more items</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-steel/5 bg-porcelain/10 text-center">
                <button 
                  onClick={() => setSelectedBox(box)}
                  className="text-[11px] font-bold text-jade hover:text-jade/80 uppercase tracking-widest transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Box Modal */}
      {showAddBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 border-b border-steel/10 flex justify-between items-center bg-porcelain/50">
              <h2 className="text-xl font-bold text-deep-ink">Create New Box</h2>
              <button onClick={() => setShowAddBox(false)} className="text-steel hover:text-deep-ink transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateBox} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Box Label</label>
                <input name="label" required placeholder="BX-001" className="w-full px-4 py-3 bg-porcelain border border-steel/20 rounded-xl outline-none focus:ring-2 focus:ring-jade/20 focus:border-jade transition-all text-deep-ink" />
              </div>
              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Assigned Employee</label>
                <select name="employeeId" required className="w-full px-4 py-3 bg-porcelain border border-steel/20 rounded-xl outline-none focus:ring-2 focus:ring-jade/20 focus:border-jade transition-all appearance-none text-deep-ink">
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-deep-ink text-white font-bold rounded-xl shadow-lg shadow-deep-ink/20 hover:scale-[1.02] active:scale-95 transition-all">
                Initialize Box
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 border-b border-steel/10 flex justify-between items-center bg-porcelain/50">
              <h2 className="text-xl font-bold text-deep-ink">Add Item to Box</h2>
              <button onClick={() => setShowAddItem(null)} className="text-steel hover:text-deep-ink transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Item Name</label>
                <input name="name" required placeholder="Circuit Board v2" className="w-full px-4 py-3 bg-porcelain border border-steel/20 rounded-xl outline-none focus:ring-2 focus:ring-jade/20 focus:border-jade transition-all text-deep-ink" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Quantity</label>
                  <input name="count" type="number" min="1" defaultValue="1" required className="w-full px-4 py-3 bg-porcelain border border-steel/20 rounded-xl outline-none focus:ring-2 focus:ring-jade/20 focus:border-jade transition-all text-deep-ink" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Category (Opt)</label>
                  <input name="description" placeholder="Electronics" className="w-full px-4 py-3 bg-porcelain border border-steel/20 rounded-xl outline-none focus:ring-2 focus:ring-jade/20 focus:border-jade transition-all text-deep-ink" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-jade text-deep-ink font-bold rounded-xl shadow-lg shadow-jade/20 hover:scale-[1.02] active:scale-95 transition-all">
                Register Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-steel/10 flex justify-between items-center bg-porcelain/50">
              <div>
                <h2 className="text-2xl font-bold text-deep-ink">{selectedBox.box_label} Details</h2>
                <p className="text-sm text-steel">Created by {selectedBox.warehouse_users?.full_name} on {new Date(selectedBox.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedBox(null)} className="text-steel hover:text-deep-ink transition-colors p-2 bg-white rounded-full shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <h3 className="text-sm font-bold text-steel uppercase tracking-widest mb-6">Inventory Items ({selectedBox.items.length})</h3>
              <div className="space-y-4">
                {selectedBox.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-porcelain border border-steel/10 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl border border-steel/5 flex items-center justify-center text-jade font-bold">
                        {item.count}
                      </div>
                      <div>
                        <p className="font-bold text-deep-ink">{item.name}</p>
                        <p className="text-xs text-steel">{item.description || 'No description provided'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item.id).then(() => setSelectedBox(prev => prev ? {...prev, items: prev.items.filter(i => i.id !== item.id)} : null))}
                      className="p-2 text-steel hover:text-cinnabar transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t border-steel/10 bg-porcelain/50 flex justify-end gap-4">
              <button 
                onClick={() => { setSelectedBox(null); setShowAddItem({boxId: selectedBox.id}); }}
                className="px-6 py-2.5 bg-jade text-deep-ink font-bold rounded-xl text-sm"
              >
                Add Item
              </button>
              <button 
                onClick={() => setSelectedBox(null)}
                className="px-6 py-2.5 bg-deep-ink text-white font-bold rounded-xl text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
