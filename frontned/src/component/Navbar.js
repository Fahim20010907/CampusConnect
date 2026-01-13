"use client"

import { useState, useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/Authcontext";

const Navbar = () => {
    const { user, logOut } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);

    // Simplified navigation
    const navLinks = [
        { name: "Home", path: "/", icon: "🏠" },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                !event.target.closest('[data-menu-button]')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setIsMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logOut();
            router.push("/login");
            setIsProfileDropdownOpen(false);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <nav className="bg-gradient-to-r from-blue-900 via-blue-700 to-teal-600 shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center flex-shrink-0">
                        <Link
                            href="/"
                            className="flex items-center space-x-3 group"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 ring-2 ring-blue-500">
                                <span className="text-blue-700 font-bold text-xl">CC</span>
                            </div>
                            <div className="hidden lg:block">
                                <h1 className="text-white font-bold text-xl tracking-tight">
                                    CampusConnect
                                </h1>
                                <p className="text-blue-100 text-xs">Career Management Platform</p>
                            </div>
                        </Link>
                    </div>

                    {/* Search Bar - Center Position */}
                    <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
                        <form onSubmit={handleSearch} className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search posts, materials, users..."
                                    className="w-full pl-12 pr-10 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white placeholder-blue-100 border border-white/25 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <svg
                                        className="w-5 h-5 text-blue-100"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
                                    aria-label="Search"
                                >
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Create Post Button */}
                    <button
                        onClick={() => router.push("/create-post")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mr-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create Post</span>
                    </button>

                    {/* Right Section - User Profile */}
                    <div className="flex items-center space-x-4">
                        {/* Desktop Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${pathname === link.path
                                        ? "bg-white/25 text-white shadow-inner"
                                        : "text-blue-100 hover:bg-white/15 hover:text-white"
                                        }`}
                                >
                                    <span className="text-lg">{link.icon}</span>
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            ))}
                        </div>

                        {/* User Profile */}
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center space-x-3 focus:outline-none group"
                                    aria-label="User menu"
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 border-2 border-white/50">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-bold text-lg">
                                                    {getInitials(user.displayName)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-white font-medium text-sm">
                                            {user.displayName || user.email?.split("@")[0]}
                                        </p>
                                        <p className="text-blue-100 text-xs">Student</p>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-white transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-blue-100 overflow-hidden">
                                        {/* Profile Info */}
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center overflow-hidden">
                                                    {user.photoURL ? (
                                                        <img
                                                            src={user.photoURL}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white font-bold text-lg">
                                                            {getInitials(user.displayName)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">
                                                        {user.displayName || "User"}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <Link
                                                href={`/profile/${user.uid}`}
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                                <span>My Profile</span>
                                            </Link>

                                            <Link
                                                href="/dashboard"
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                    />
                                                </svg>
                                                <span>Dashboard</span>
                                            </Link>

                                            <Link
                                                href="/settings"
                                                className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                <span>Settings</span>
                                            </Link>

                                            <div className="border-t border-gray-100 mt-2 pt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                        />
                                                    </svg>
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center space-x-3">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-white hover:text-blue-100 font-medium hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 hover:shadow-lg transition-all duration-300 shadow-md hover:scale-105"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            data-menu-button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/15 transition-colors"
                            aria-label="Menu"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div
                        ref={menuRef}
                        className="lg:hidden bg-white rounded-xl shadow-2xl mt-2 p-4 animate-slideDown border border-blue-100"
                    >
                        {/* Mobile User Info */}
                        {user ? (
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center overflow-hidden">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white font-bold text-lg">
                                                {getInitials(user.displayName)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">
                                            {user.displayName || "User"}
                                        </p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-gray-700 font-medium mb-2">Welcome to CampusConnect</p>
                            </div>
                        )}

                        {/* Mobile Navigation Links */}
                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${pathname === link.path
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-xl">{link.icon}</span>
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            ))}

                            {/* Create Post Button - Mobile */}
                            <button
                                onClick={() => {
                                    router.push("/create-post");
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg mt-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create Post</span>
                            </button>

                            {/* Mobile Additional Links */}
                            <div className="pt-2 border-t border-gray-100">
                                {user ? (
                                    <>
                                        <Link
                                            href={`/profile/${user.uid}`}
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <svg
                                                className="w-5 h-5 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            <span>My Profile</span>
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <svg
                                                className="w-5 h-5 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                />
                                            </svg>
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg mt-2"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-2 pt-2">
                                        <Link
                                            href="/login"
                                            className="block px-4 py-3 text-center bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="block px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add CSS for animation */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;