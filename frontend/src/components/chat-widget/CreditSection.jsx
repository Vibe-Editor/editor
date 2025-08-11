import React from "react";
import CreditWidget from "../CreditWidget";

const CreditSection = ({ isAuthenticated, creditDeductionMessage }) => {
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Credit Widget Section */}
      <div className='px-3 py-2 bg-gray-900/50 border-b border-gray-800'>
        <CreditWidget />
      </div>

      {/* Credit Deduction Notification */}
      {creditDeductionMessage && (
        <div className='px-3 py-2 bg-green-900/50 border-b border-green-800'>
          <div className='flex items-center gap-2 text-green-200'>
            <span>💰</span>
            <span className='text-xs'>{creditDeductionMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditSection;
