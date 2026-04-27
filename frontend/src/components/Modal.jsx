import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ children, isOpen, onClose, maxWidth = '500px', padding }) => {
    React.useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow || 'unset';
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={(e) => {
            if (e.target.className === 'modal-overlay') onClose();
        }} style={{ zIndex: 10000 }}>
            <div className="modal-content animate-in" style={{ maxWidth, padding }} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
