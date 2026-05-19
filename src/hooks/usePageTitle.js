import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTitle = (title) => {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} | Bino CRM` : 'Bino CRM';

        return () => {
            document.title = previousTitle;
        };
    }, [title]);
};

// Component that automatically sets title based on route
export const PageTitleHandler = () => {
    const location = useLocation();

    useEffect(() => {
        const titles = {
            '/': 'Asosiy',
            '/login': 'Kirish',
            '/cities': 'Shaharlar',
            '/buildings': 'Binolar',
            '/homes': 'Uylar',
            '/clients': 'Mijozlar',
            '/contracts': 'Shartnomalar',
            '/leads': 'Leadlar',
        };

        // Find matching title
        let pageTitle = 'Bino CRM';
        for (const [path, title] of Object.entries(titles)) {
            if (location.pathname === path || location.pathname.startsWith(path + '/')) {
                pageTitle = `${title} | Bino CRM`;
                break;
            }
        }

        document.title = pageTitle;
    }, [location.pathname]);

    return null;
};

export default usePageTitle;
