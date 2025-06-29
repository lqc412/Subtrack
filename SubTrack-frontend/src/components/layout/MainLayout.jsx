import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, CreditCard, Settings, Mail } from 'lucide-react';
import AvatarDisplay from '../AvatarDisplay'; 
import UserAvatar from '../UserAvatar'; 

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
        {/* 顶部导航栏 */}
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
          
          <div className="flex-none mr-4">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} className="avatar cursor-pointer">
                <div className="w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden">
                  <img 
                    src={currentUser?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li><a onClick={() => navigate('/settings')}>Profile</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 主内容 */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
      
      {/* 侧边栏 */}
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
              <NavLink to="/email-integration" className={({ isActive }) => isActive ? 'active' : ''}>
                <Mail size={18} />
                Email Integration
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
              <div className="rounded-lg bg-base-300 p-2">
                {/* 使用新的UserAvatar组件 */}
                <UserAvatar 
                  user={currentUser}
                  showLogout={true}
                  onLogout={handleLogout}
                  size="md"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}