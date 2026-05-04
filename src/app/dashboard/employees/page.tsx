'use client';

import React, { useState, useEffect } from 'react';
import { createEmployee, fetchEmployees, deleteEmployee } from '@/actions/employees';
import { getUserProfile } from '@/actions/auth';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function EmployeesPage() {
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function init() {
      const profile = await getUserProfile();
      setUser(profile);
      loadEmployees();
    }
    init();
  }, []);


  async function loadEmployees() {
    setLoading(true);
    const data = await fetchEmployees();
    setEmployees(data as Employee[]);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEmployee(formData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Employee created successfully!' });
      (e.target as HTMLFormElement).reset();
      loadEmployees();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create employee' });
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    
    const result = await deleteEmployee(id);
    if (result.success) {
      loadEmployees();
      setMessage({ type: 'success', text: 'Employee deleted successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete employee' });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink tracking-tight">Employee Management</h1>
          <p className="text-steel mt-1">Manage your warehouse staff and access levels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-steel/10 shadow-sm overflow-hidden sticky top-8">
            <div className="p-6 border-b border-steel/10 bg-porcelain/50">
              <h2 className="font-bold text-deep-ink flex items-center">
                <svg className="w-5 h-5 mr-2 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add New Staff
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-jade/10 text-jade border border-jade/20' : 'bg-cinnabar/10 text-cinnabar border border-cinnabar/20'}`}>
                  {message.text}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-porcelain border border-steel/20 rounded-xl text-deep-ink focus:ring-2 focus:ring-jade/20 focus:border-jade outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john@stackbox.ai"
                  className="w-full px-4 py-2.5 bg-porcelain border border-steel/20 rounded-xl text-deep-ink focus:ring-2 focus:ring-jade/20 focus:border-jade outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Role</label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-2.5 bg-porcelain border border-steel/20 rounded-xl text-deep-ink focus:ring-2 focus:ring-jade/20 focus:border-jade outline-none transition-all appearance-none"
                >
                  <option value="Employee">Employee</option>
                  {user?.role === 'Owner' && (
                    <>
                      <option value="Manager">Manager</option>
                      <option value="Owner">Owner</option>
                    </>
                  )}
                </select>
              </div>


              <div>
                <label className="block text-xs font-bold text-steel uppercase tracking-wider mb-1.5">Initial Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-porcelain border border-steel/20 rounded-xl text-deep-ink focus:ring-2 focus:ring-jade/20 focus:border-jade outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-deep-ink text-white font-bold rounded-xl hover:bg-deep-ink/90 transition-all shadow-lg shadow-deep-ink/10 flex items-center justify-center disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Employee Account'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Employee List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-steel/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-steel/10 bg-porcelain/50">
              <h2 className="font-bold text-deep-ink flex items-center">
                <svg className="w-5 h-5 mr-2 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Current Staff
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-steel/10 bg-porcelain/30">
                    <th className="px-6 py-4 text-xs font-bold text-steel uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold text-steel uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-steel uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-steel uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/5">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-steel/10 rounded w-32" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-steel/10 rounded w-20" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-steel/10 rounded w-40" /></td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    ))
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-steel">No employees found.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-porcelain/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-jade/10 text-jade flex items-center justify-center font-bold text-xs mr-3">
                              {emp.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <span className="font-semibold text-deep-ink">{emp.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.role === 'Manager' || emp.role === 'Owner' ? 'bg-jade/10 text-jade' : 'bg-steel/10 text-steel'}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-steel">{emp.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 text-steel hover:text-cinnabar transition-colors"
                            title="Delete Employee"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
