// quickfix-website/client/src/components/common/Modal.js
import React, { useRef, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // For accessible modal dialog
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Reusable Modal Component.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Callback function when the modal is closed.
 * @param {string} props.title - Title of the modal.
 * @param {React.ReactNode} props.children - Content to be displayed inside the modal.
 * @param {string} [props.size='md'] - 'sm', 'md', 'lg', 'xl', 'full' for modal width.
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking outside closes the modal.
 */
function Modal({ isOpen, onClose, title, children, size = 'md', closeOnOverlayClick = true }) {
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Determine modal width based on size prop
  const getModalWidthClass = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case 'full': return 'max-w-full w-full mx-4'; // Full width with some margin
      default: return 'max-w-md';
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={closeOnOverlayClick ? handleClose : () => {}}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Modal panel */}
              <Dialog.Panel
                ref={modalRef}
                className={`w-full ${getModalWidthClass()} transform overflow-hidden rounded-lg bg-cardBackground dark:bg-gray-800 text-left align-middle shadow-xl transition-all`}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-border dark:border-gray-700">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-textDefault dark:text-white">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {children}
                </div>

                {/* Optional: Modal Footer for action buttons, can be added via children */}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;