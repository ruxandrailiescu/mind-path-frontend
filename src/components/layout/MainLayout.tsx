import { Outlet } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { Link } from "react-router-dom";
import Loading from "../Loading";

const MainLayout = () => {
  const { currentUser, handleLogout, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                MindPath
              </h1>
            </div>

            <nav className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MindPath. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
