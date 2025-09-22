// Update avatar display within src/components/Navbar.jsx

import AvatarDisplay from './AvatarDisplay'; // Import the avatar component
import { useAuth } from '../context/AuthContext';

export default function Navbar({onSearch}){
  const { currentUser } = useAuth();
  
  const handleSearchChange = (event) => {
    onSearch(event.target.value);
  }

  return(
      <>
        <div className="navbar bg-base-100 shadow-sm">
          <div className="flex-1">
             <a className="btn btn-ghost text-xl">SubTrack</a>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Search" onChange={handleSearchChange} className="input input-bordered w-24 md:w-auto" />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                {/* Replaced with the AvatarDisplay component */}
                <AvatarDisplay 
                  src={currentUser?.profile_image}
                  username={currentUser?.username || 'User'}
                  size="sm" 
                />
              </div>
              <ul
                 tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                <li>
                  <a className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </a>
                </li>
                <li><a>Settings</a></li>
                <li><a>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
</>
  )
}

