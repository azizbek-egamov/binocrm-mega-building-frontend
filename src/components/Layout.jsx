import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    const { isOpen, isMobile } = useSidebar();

    const getMainClass = () => {
        if (isMobile) return 'main-content mobile';
        return isOpen ? 'main-content sidebar-open' : 'main-content sidebar-closed';
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className={getMainClass()}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
