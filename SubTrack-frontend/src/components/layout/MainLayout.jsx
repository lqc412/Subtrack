// src/components/layout/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Fixed import path
import { Home, CreditCard, Settings, LogOut } from 'lucide-react';

export default function MainLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col">
        {/* Top navigation bar */}
        <div className="navbar bg-base-100 shadow-sm">
          <div className="flex-none lg:hidden">
            <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
          
          <div className="flex-1">
            <span className="text-xl font-bold">SubTrack</span>
          </div>
          
          <div className="flex-none">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Profile" />
                </div>
              </label>
              <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li><a onClick={() => navigate('/settings')}>Profile</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
        <aside className="bg-base-200 w-64 h-full">
          <div className="p-4 flex flex-col h-full">
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-primary">SubTrack</h2>
              <p className="text-sm opacity-75">Track your subscriptions</p>
            </div>
            
            <ul className="menu menu-lg p-0 [&_li>*]:rounded-md">
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                  <Home size={18} />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/subscriptions" className={({ isActive }) => isActive ? 'active' : ''}>
                  <CreditCard size={18} />
                  Subscriptions
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                  <Settings size={18} />
                  Settings
                </NavLink>
              </li>
            </ul>
            
            <div className="mt-auto pt-6">
              <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-base-300">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Profile" />
                  </div>
                </div>
                <div>
                  <div className="font-bold">{currentUser?.username || 'User'}</div>
                  <div className="text-xs opacity-70">{currentUser?.email || 'user@example.com'}</div>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}