import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      setAuth({ isLoggedIn: false, isAdmin: false, isLoading: false, user: null });
      navigate('/');
    }
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-900'}`;

  return (
    <header className="border-b border-slate-800 bg-slate-950/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-slate-100">
          Online Judge
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink className={linkClass} to="/problems">
            Problems
          </NavLink>
          <NavLink className={linkClass} to="/leaderboard">
            Leaderboard
          </NavLink>

          {auth.isLoggedIn ? (
            <>
              <NavLink className={linkClass} to="/profile">
                Profile
              </NavLink>
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className={linkClass} to="/login">
                Login
              </NavLink>
              <NavLink className={linkClass} to="/register">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
