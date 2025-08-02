import React from 'react';
import CreditWidget from './CreditWidget';

const NotificationBanners = ({
  isAuthenticated,
  selectedProject,
  creditDeductionMessage
}) => {
  const SelectedProjectBanner = () => {
    if (!selectedProject) return null;
    return (
      <div className="px-4 py-2 bg-blue-900 text-blue-100 text-sm border-b border-blue-800">
        Working on: <span className="font-semibold">{selectedProject.name}</span>
      </div>
    );
  };

  return (
    <>
      {/* Credit Widget Section */}
      {isAuthenticated && (
        <div className='px-3 py-2 bg-gray-900/50 border-b border-gray-800'>
          <CreditWidget />
        </div>
      )}
      
      {/* Credit Deduction Notification */}
      {creditDeductionMessage && (
        <div className='px-3 py-2 bg-green-900/50 border-b border-green-800'>
          <div className='flex items-center gap-2 text-green-200'>
            <span>💰</span>
            <span className='text-xs'>{creditDeductionMessage}</span>
          </div>
        </div>
      )}
      
      {/* Project banner */}
      {isAuthenticated && <SelectedProjectBanner />}
    </>
  );
};

export default NotificationBanners;