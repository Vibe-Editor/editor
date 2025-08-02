import { useState } from "react";
import { getTextCreditCost, getImageCreditCost, getVideoCreditCost, formatCreditDeduction } from "../../lib/pricing";
import { useProjectStore } from "../../store/useProjectStore";

export const useCreditHandling = (user) => {
  const [creditDeductionMessage, setCreditDeductionMessage] = useState(null);
  const { fetchBalance } = useProjectStore();

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = (serviceName, model = null, count = 1) => {
    let credits = 0;
    let message = '';

    switch (serviceName) {
      case 'Web Info Processing':
        credits = getTextCreditCost('web-info');
        message = formatCreditDeduction('Web Info Processing', credits);
        break;
      case 'Concept Generation':
        credits = getTextCreditCost('concept generator');
        message = formatCreditDeduction('Concept Generation', credits);
        break;
      case 'Concept Writer Process':
        // Combined web-info + concept generation
        const webInfoCredits = getTextCreditCost('web-info');
        const conceptCredits = getTextCreditCost('concept generator');
        credits = webInfoCredits + conceptCredits;
        message = formatCreditDeduction('Concept Writer Process', credits);
        break;
      case 'Script Generation':
        credits = getTextCreditCost('script & segmentation') * count;
        message = formatCreditDeduction('Script Generation', credits);
        break;
      case 'Image Generation':
        if (model) {
          credits = getImageCreditCost(model) * count;
          message = formatCreditDeduction(`Image Generation (${model})`, credits);
        } else {
          credits = getImageCreditCost('imagen') * count; // default to imagen
          message = formatCreditDeduction('Image Generation', credits);
        }
        break;
      case 'Video Generation':
        if (model) {
          credits = getVideoCreditCost(model, 5) * count; // 5 seconds default
          message = formatCreditDeduction(`Video Generation (${model})`, credits);
        } else {
          credits = getVideoCreditCost('veo2', 5) * count; // default to veo2
          message = formatCreditDeduction('Video Generation', credits);
        }
        break;
      default:
        message = `Credit deducted for ${serviceName}`;
    }

    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000); // Clear after 3 seconds
    
    // Refresh balance if user is authenticated
    if (user?.id) {
      fetchBalance(user.id);
    }
  };

  // Helper function to show request failure message
  const showRequestFailed = (serviceName = null) => {
    const message = serviceName ? `${serviceName} request failed` : "Request failed";
    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000);
  };

  return {
    creditDeductionMessage,
    setCreditDeductionMessage,
    showCreditDeduction,
    showRequestFailed
  };
};