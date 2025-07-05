// quickfix-website/client/src/components/common/Navbar.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { NotificationContext } from '../../context/NotificationContext'; // To show unread count
import { MoonIcon, SunIcon, BellIcon, Bars3Icon, XMarkIcon, UserCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { PAGINATION_DEFAULTS, ROUTES } from '../../utils/constants'; // For routing and constants

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { unreadCount } = useContext(NotificationContext); // Get unread count
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`${ROUTES.SEARCH_RESULTS}?keyword=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(''); // Clear search query after submission
            setIsMobileMenuOpen(false); // Close mobile menu on search
        } else {
            toast.info("Please enter a search term.");
        }
    };

    return (
        <nav className="bg-cardBackground dark:bg-gray-800 text-textDefault dark:text-white shadow-md transition-colors duration-300 relative z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo/Site Title */}
                <Link to={ROUTES.HOME} className="text-2xl font-bold text-primary dark:text-primary-light">
                    QuickFix
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link to={ROUTES.GUIDES} className="hover:text-primary dark:hover:text-primary-light transition-colors duration-200 text-lg">Guides</Link>
                    <Link to={ROUTES.ABOUT} className="hover:text-primary dark:hover:text-primary-light transition-colors duration-200 text-lg">About</Link>
                    <Link to={ROUTES.CONTACT} className="hover:text-primary dark:hover:text-primary-light transition-colors duration-200 text-lg">Contact</Link>
                    {user && user.isPremium && (
                        <Link to={ROUTES.PREMIUM} className="flex items-center hover:text-accent dark:hover:text-accent font-semibold transition-colors duration-200 text-lg">
                            <StarIcon className="h-5 w-5 mr-1 text-accent" /> Premium
                        </Link>
                    )}
                    {user && user.role === 'admin' && (
                        <Link to={ROUTES.ADMIN_DASHBOARD} className="hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors duration-200 text-lg">Admin</Link>
                    )}
                </div>

                {/* Desktop User Actions & Search */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            placeholder="Search guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 rounded-full border border-border bg-gray-100 dark:bg-gray-700 focus:ring-primary focus:border-primary text-textDefault dark:text-white text-sm transition-all duration-200"
                        />
                        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </button>
                    </form>

                    {/* Notification Icon */}
                    {user && (
                        <Link to={ROUTES.NOTIFICATIONS} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                            <BellIcon className="h-6 w-6 text-textDefault dark:text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center -mt-1 -mr-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        {theme === 'light' ? (
                            <MoonIcon className="h-6 w-6 text-yellow-500" />
                        ) : (
                            <SunIcon className="h-6 w-6 text-yellow-300" />
                        )}
                    </button>

                    {/* User Profile/Auth Buttons */}
                    {user ? (
                        <div className="relative group">
                            <button className="flex items-center space-x-2 p-2 rounded-full bg-primary dark:bg-primary-dark hover:bg-primary-dark dark:hover:bg-primary-light transition-colors duration-200 text-white">
                                <UserCircleIcon className="h-7 w-7" />
                                <span className="font-medium hidden lg:inline">{user.username}</span>
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-cardBackground dark:bg-gray-700 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 origin-top-right">
                                <Link to={ROUTES.PROFILE} className="block px-4 py-2 text-textDefault dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Profile</Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex space-x-2">
                            <Link to={ROUTES.LOGIN} className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white dark:text-primary-light dark:hover:bg-primary-dark transition-colors duration-200">Login</Link>
                            <Link to={ROUTES.REGISTER} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-200">Register</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center space-x-2">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        {theme === 'light' ? (
                            <MoonIcon className="h-6 w-6 text-yellow-500" />
                        ) : (
                            <SunIcon className="h-6 w-6 text-yellow-300" />
                        )}
                    </button>
                    {user && (
                         <Link to={ROUTES.NOTIFICATIONS} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                            <BellIcon className="h-6 w-6 text-textDefault dark:text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center -mt-1 -mr-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-md text-textDefault dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light"
                    >
                        {isMobileMenuOpen ? (
                            <XMarkIcon className="h-7 w-7" />
                        ) : (
                            <Bars3Icon className="h-7 w-7" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-cardBackground dark:bg-gray-800 shadow-lg py-4 border-t border-border dark:border-gray-700 transition-all duration-300 ease-in-out transform origin-top">
                    <div className="flex flex-col items-center space-y-4 px-4">
                        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Search guides..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-gray-100 dark:bg-gray-700 focus:ring-primary focus:border-primary text-textDefault dark:text-white text-sm"
                            />
                            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </button>
                        </form>
                        <Link to={ROUTES.GUIDES} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Guides</Link>
                        <Link to={ROUTES.ABOUT} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">About</Link>
                        <Link to={ROUTES.CONTACT} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Contact</Link>
                        {user && user.isPremium && (
                            <Link to={ROUTES.PREMIUM} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg text-accent font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Premium</Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Link to={ROUTES.ADMIN_DASHBOARD} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg text-blue-500 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Admin</Link>
                        )}

                        <div className="w-full border-t border-border dark:border-gray-700 my-2"></div>

                        {user ? (
                            <>
                                <Link to={ROUTES.PROFILE} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Profile</Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="w-full text-center py-2 text-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-800 rounded-md"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col w-full space-y-2">
                                <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg border border-primary text-primary hover:bg-primary hover:text-white dark:text-primary-light dark:hover:bg-primary-dark rounded-md">Login</Link>
                                <Link to={ROUTES.REGISTER} onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 text-lg bg-primary text-white hover:bg-primary-dark rounded-md">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;