import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { uploadExcel } from '../../services/homes';
import { toast } from 'sonner';

const HomeImport = ({ isOpen, onClose, building, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const fileExtension = droppedFile.name.split('.').pop().toLowerCase();
            if (['xlsx', 'xls'].includes(fileExtension)) {
                setFile(droppedFile);
            } else {
                toast.error("Faqat .xlsx yoki .xls fayllarni yuklash mumkin");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !building) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('building', building.id);

        try {
            const res = await uploadExcel(formData);
            toast.success(res.message || "Fayl muvaffaqiyatli yuklandi");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
            setFile(null);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-icon">
                        <ExcelIcon />
                    </div>
                    <div className="modal-header-text">
                        <h3>Exceldan yuklash</h3>
                        <p className="modal-subtitle">{building?.name} binosi uchun</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-form-body">
                        {/* Template download */}
                        <div className="template-download">
                            <div className="template-info">
                                <TemplateIcon />
                                <div>
                                    <span className="template-title">Namuna fayli kerakmi?</span>
                                    <span className="template-desc">Excel faylni to'g'ri tuzish uchun yuklab oling</span>
                                </div>
                            </div>
                            <a
                                href="/xonadonlar_malumotlari_demo.xlsx"
                                download="xonadonlar_namuna.xlsx"
                                className="btn-download"
                            >
                                <DownloadIcon />
                                <span>Yuklab olish</span>
                            </a>
                        </div>

                        {/* Format info */}
                        <div className="format-info">
                            <div className="format-header">
                                <InfoIcon />
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Excel fayl formati
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                                        (Rasmlar uchun fayl nomini yozing: <b>kv1.jpg</b> kabi)
                                    </span>
                                </span>
                            </div>
                            <div className="format-columns">
                                <div className="format-column">
                                    <span className="col-num">1</span>
                                    <span className="col-name">Xonadon raqami</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">2</span>
                                    <span className="col-name">Narx (1 m2)</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">3</span>
                                    <span className="col-name">Maydon (m²)</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">4</span>
                                    <span className="col-name">Loyiha Rasmi</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">5</span>
                                    <span className="col-name">Kadastr Rasmi</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">6</span>
                                    <span className="col-name">Xonalar Soni</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">7</span>
                                    <span className="col-name">Qavat</span>
                                </div>
                                <div className="format-column">
                                    <span className="col-num">8</span>
                                    <span className="col-name">Padez</span>
                                </div>
                            </div>
                        </div>

                        {/* Drop zone */}
                        <div
                            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            {file ? (
                                <div className="file-preview">
                                    <div className="file-icon-wrapper">
                                        <FileIcon />
                                    </div>
                                    <div className="file-info">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-remove-file"
                                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>
                            ) : (
                                <div className="drop-content">
                                    <div className="drop-icon">
                                        <UploadCloudIcon />
                                    </div>
                                    <div className="drop-text">
                                        <span className="drop-title">Faylni bu yerga tashlang</span>
                                        <span className="drop-or">yoki</span>
                                        <span className="drop-browse">kompyuterdan tanlang</span>
                                    </div>
                                    <span className="drop-hint">.xlsx yoki .xls formatida</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Bekor qilish
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading || !file}>
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    <span>Yuklanmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <span>Yuklash</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ExcelIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13l2.5 3L8 19" />
        <path d="M16 13l-2.5 3L16 19" />
    </svg>
);

const TemplateIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const UploadCloudIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 16l-4-4-4 4" />
        <path d="M12 12v9" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export default HomeImport;
