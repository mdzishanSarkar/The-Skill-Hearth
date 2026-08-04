import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const linkClass = 'text-sm font-medium text-gray-600 hover:text-indigo-600';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          Skill Hearth
        </Link>
        <div className="flex items-center gap-4">
          <NavLink to="/skills" className={linkClass}>
            Browse skills
          </NavLink>
          {isAuthenticated && user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/my-skills" className={linkClass}>
                My skills
              </NavLink>
              <NavLink to="/edit-profile" className={linkClass}>
                Edit Profile
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin/users" className={linkClass}>
                  Admin
                </NavLink>
              )}
              <Link to="/profile" title={user.displayName}>
                <Avatar src={user.avatar || undefined} name={user.displayName} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
