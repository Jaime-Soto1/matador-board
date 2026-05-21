import React from "react";
import { Link } from "react-router-dom";
import { HiMiniArrowRightCircle } from "react-icons/hi2";

interface NavbarProps {
  userEmail: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ userEmail }) => {

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    window.location.reload();
  };

  return (
    <nav className="px-8 py-5 flex justify-between items-center bg-zinc-800/50 shadow-md">
      {/* Left: Logo */}
      <div className="flex items-center space-x-4">
        <img
          src="/logo.png"
          alt="Matador Board Logo"
          className="h-[35px] w-auto"
        />
        <span className="text-white text-xl font-semibold">Matador Board</span>
      </div>

      {/* Center: Navigation Links */}
      <div className="flex flex-wrap space-x-3">
      <Link to="/" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          Home
        </Link>
        <Link to="/group" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          Group Management
        </Link>
        <Link to="/documents" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          Documents
        </Link>
        <Link to="/document-list" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          Document List
        </Link>
        <Link to="/profile" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          Profile
        </Link>
        <Link to="/my-boards" className="rounded-full text-md bg-transparent text-white px-5 py-2 hover:bg-zinc-700">
          My Boards
        </Link>

      </div>

      {/* Right: User Info or Sign-in */}
      <div className="flex items-center space-x-4">
        {userEmail ? (
          <div className="flex items-center space-x-2">
            <span className="text-green-300">Logged in as: {userEmail}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg font-semibold text-md bg-red-500 px-5 py-2 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg font-semibold text-md bg-red-500 px-5 py-2 hover:bg-red-600"
          >
            Sign-in <HiMiniArrowRightCircle className="inline ml-1" />
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
