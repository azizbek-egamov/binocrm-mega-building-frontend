'use client';

import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();

    // Ochilgan menyu bo'limlari
    const [expandedMenus, setExpandedMenus] = useState(() => {
        const path = location.pathname;
        if (path.startsWith('/buildings')) return ['buildings'];
        if (path.startsWith('/homes')) return ['homes'];
        if (path.startsWith('/clients')) return ['clients'];
        if (path.startsWith('/contracts')) return ['contracts'];
        if (path.startsWith('/leads')) return ['leads'];
        if (path.startsWith('/expenses') || path.startsWith('/expense-categories')) return ['chiqimlar'];
        if (path.startsWith('/incomes')) return ['kirimlar'];
        return [];
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        if (isMobile) closeSidebar();
    };

    const toggleMenu = (menuKey) => {
        setExpandedMenus(prev =>
            prev.includes(menuKey)
                ? prev.filter(k => k !== menuKey)
                : [...prev, menuKey]
        );
    };

    const isMenuExpanded = (menuKey) => expandedMenus.includes(menuKey);
    const isMenuActive = (basePath) => location.pathname.startsWith(basePath);

    // Menyu strukturasi
    const menuItems = [
        {
            type: 'link',
            path: '/',
            icon: <HomeIcon />,
            label: 'Asosiy',
            permission: null // Everyone can see
        },
        {
            type: 'link',
            path: '/cities',
            icon: <CityIcon />,
            label: 'Shaharlar',
            permission: null
        },
        {
            type: 'link',
            path: '/buildings',
            icon: <BuildingIcon />,
            label: 'Binolar',
            permission: null
        },
        {
            type: 'group',
            key: 'homes',
            icon: <HomeAltIcon />,
            label: 'Xonadonlar',
            basePath: '/homes',
            permission: null,
            children: [
                { path: '/homes', label: 'Xonadonlar ro\'yxati' },
                { path: '/homes/create', label: 'Qo\'lda qo\'shish' },
            ]
        },
        {
            type: 'link',
            path: '/clients',
            icon: <UsersIcon />,
            label: 'Mijozlar',
            permission: null
        },
        {
            type: 'group',
            key: 'contracts',
            icon: <FileIcon />,
            label: 'Shartnomalar',
            basePath: '/contracts',
            permission: null,
            children: [
                { path: '/contracts', label: 'Shartnomalar ro\'yxati' },
                { path: '/contracts/create', label: 'Shartnoma qo\'shish' },
            ]
        },
        {
            type: 'link',
            icon: <PhoneIcon />,
            label: 'Leadlar',
            path: '/leads',
            permission: 'can_view_leads'
        },
        {
            type: 'link',
            icon: <FormIcon />,
            label: 'Formalar',
            path: '/forms',
            permission: 'can_view_forms'
        },
        {
            type: 'link',
            path: '/buildings/info',
            icon: <InfoIcon />,
            label: 'Binolar ma\'lumoti',
            permission: 'can_view_buildings_info'
        },
        {
            type: 'link',
            path: '/analytics',
            icon: <PieChartIcon />,
            label: 'Analitika',
            permission: 'can_view_analytics'
        },
        // {
        //     type: 'link',
        //     path: '/sms',
        //     icon: <MessageIcon />,
        //     label: 'SMS Xizmati',
        //     permission: 'can_view_sms'
        // },
        {
            type: 'group',
            key: 'chiqimlar',
            icon: <WalletIcon />,
            label: 'Chiqimlar',
            basePath: '/expenses',
            permission: 'can_view_expenses',
            children: [
                { path: '/expenses', label: 'Xarajatlar' },
                { path: '/expense-categories', label: 'Kategoriyalar' },
                { path: '/expenses/buildings', label: 'Ob\'ektlar tahlili' },
            ]
        },
        {
            type: 'group',
            key: 'kirimlar',
            icon: <TrendingUpIcon />,
            label: 'Kirimlar',
            basePath: '/incomes',
            permission: 'can_view_incomes',
            children: [
                { path: '/incomes', label: 'Tushumlar' },
                { path: '/incomes/categories', label: 'Kategoriyalar' },
                { path: '/incomes/buildings', label: 'Ob\'ektlar tahlili' },
            ]
        },
    ];

    // Filter menu based on permissions
    const filteredMenuItems = menuItems.filter(item => {
        // Superuser gets everything
        if (user?.is_superuser) return true;

        // Items without permission requirement are visible to everyone
        if (!item.permission) return true;

        // Check granular permission
        return user?.permissions?.[item.permission];
    });

    // Foydalanuvchilar menyusi - Superuser yoki Manager (can_view_users) uchun
    if (user?.is_superuser || user?.permissions?.can_view_users) {
        filteredMenuItems.push({
            type: 'link',
            path: '/users',
            icon: <UserIcon />,
            label: 'Foydalanuvchilar'
        });
    }

    return (
        <>
            {/* Overlay - Mobile only - FIXED: Add visible class for pointer-events */}
            {isMobile && isOpen && <div className="sidebar-overlay visible" onClick={closeSidebar} />}

            {/* Mobile Toggle Button - RIGHT side */}
            {isMobile && !isOpen && (
                <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    <MenuIcon />
                </button>
            )}

            {/* Desktop Toggle Button - Always visible, outside sidebar */}
            {!isMobile && (
                <button
                    className={`sidebar-toggle ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
                    onClick={toggleSidebar}
                >
                    {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-inner">

                    <div className="sidebar-header">
                        <div className="logo">
                            <div className="logo-icon"><LogoIcon /></div>
                            <div className="logo-text">
                                <span className="logo-title">Bino</span>
                                <span className="logo-sub">CRM System</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-user">
                        <div className="avatar">
                            {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="user-info">
                            <span className="user-name">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'User'}
                            </span>
                            <span className="user-role">
                                {user?.is_superuser ? 'Superadmin' : user?.is_staff ? 'Admin' : 'Foydalanuvchi'}
                            </span>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <p className="nav-title">MENU</p>
                        <ul className="nav-list">
                            {filteredMenuItems.map((item, index) => (
                                <li key={item.key || item.path} style={{ animationDelay: `${index * 0.05}s` }}>
                                    {item.type === 'link' ? (
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                            end={item.path === '/' || item.path === '/buildings'}
                                            onClick={handleNavClick}
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            <span className="nav-label">{item.label}</span>
                                        </NavLink>
                                    ) : (
                                        <div className="nav-group">
                                            <button
                                                className={`nav-group-toggle ${isMenuActive(item.basePath) ? 'active' : ''} ${isMenuExpanded(item.key) ? 'expanded' : ''}`}
                                                onClick={() => toggleMenu(item.key)}
                                            >
                                                <span className="nav-icon">{item.icon}</span>
                                                <span className="nav-label">{item.label}</span>
                                                <span className="nav-arrow">
                                                    <ChevronDownIcon />
                                                </span>
                                            </button>
                                            <ul className={`nav-submenu ${isMenuExpanded(item.key) ? 'open' : ''}`}>
                                                {item.children.map((child) => (
                                                    <li key={child.path}>
                                                        <NavLink
                                                            to={child.path}
                                                            className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                                                            end
                                                            onClick={handleNavClick}
                                                        >
                                                            {child.label}
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="sidebar-footer">
                        <button className="footer-btn theme-btn" onClick={toggleTheme}>
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                            <span>{theme === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}</span>
                        </button>
                        <button className="footer-btn logout-btn" onClick={handleLogout}>
                            <LogoutIcon />
                            <span>Chiqish</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

// Icons
const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const LogoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21H21" /><path d="M5 21V7L12 3L19 7V21" /><path d="M9 21V15H15V21" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const CityIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M5 21V7l8-4 8 4v14" /><rect x="9" y="9" width="2" height="2" /><rect x="13" y="9" width="2" height="2" />
    </svg>
);

const BuildingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
    </svg>
);

const HomeAltIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const PhoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const SunIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

const PieChartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const WalletIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
    </svg>
);

const MessageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const FormIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
);

const TrendingUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default Sidebar;
