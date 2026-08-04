import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900">The Skill Hearth</h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        Connection as a byproduct of learning together — not the goal itself.
      </p>
      <div className="mt-8 flex gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
            <Link to="/profile">
              <Button variant="secondary" size="lg">
                View my profile
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/register">
              <Button size="lg">Join the Hearth</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
