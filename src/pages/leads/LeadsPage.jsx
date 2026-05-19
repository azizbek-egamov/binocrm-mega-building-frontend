import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import './Leads.css';
import LeadForm from './LeadForm';

// Icons
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const LeadsPage = () => {
    usePageTitle('Leadlar');
    const navigate = useNavigate();
    const location = useLocation();

    // Total leads count for header
    const [totalLeads, setTotalLeads] = useState(0);

    // Modal State
    const [modal, setModal] = useState({
        open: false,
        lead: null,
        initialStageId: null,
        type: 'create'
    });

    // Refresh trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Redirect to kanban by default
    useEffect(() => {
        if (location.pathname === '/leads' || location.pathname === '/leads/') {
            navigate('kanban', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Handlers
    const openCreateModal = (initialStageId = null) => {
        setModal({ open: true, lead: null, initialStageId, type: 'create' });
    };

    const openEditModal = (lead) => {
        setModal({ open: true, lead, initialStageId: null, type: 'edit' });
    };

    const closeModal = () => {
        setModal({ open: false, lead: null, initialStageId: null, type: 'create' });
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Update total leads count from child
    const updateTotalLeads = (count) => {
        setTotalLeads(count);
    };

    // Determine active tab
    const getActiveTab = () => {
        if (location.pathname.includes('/leads/list')) return 'list';
        return 'kanban';
    };
    const activeTab = getActiveTab();

    return (
        <div className="leads-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">Leadlar</h1>
                        <p className="page-subtitle">Jami {totalLeads} ta lead</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => openCreateModal()}>
                        <PlusIcon />
                        Lead qo'shish
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="leads-tabs">
                <button
                    className={`leads-tab ${activeTab === 'kanban' ? 'active' : ''}`}
                    onClick={() => navigate('/leads/kanban')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                    </svg>
                    Kanban
                </button>
                <button
                    className={`leads-tab ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => navigate('/leads/list')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    Ro'yxat
                </button>
            </div>

            <div className="page-content">
                <Outlet context={{
                    openCreateModal,
                    openEditModal,
                    refreshTrigger,
                    updateTotalLeads
                }} />
            </div>

            {/* Modal */}
            <LeadForm
                isOpen={modal.open}
                onClose={closeModal}
                lead={modal.lead}
                initialStageId={modal.initialStageId}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default LeadsPage;
