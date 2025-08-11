import { useState } from "react";
import {
  getTextCreditCost,
  getImageCreditCost,
  getVideoCreditCost,
  formatCreditDeduction,
} from "../lib/pricing";

export const useCreditManagement = () => {
  // Credit deduction notification state
  const [creditDeductionMessage, setCreditDeductionMessage] = useState(null);

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = (
    serviceName,
    model = null,
    count = 1,
    user,
    fetchBalance,
  ) => {
    let credits = 0;
    let message = "";

    switch (serviceName) {
      case "Web Info Processing":
        credits = getTextCreditCost("web-info");
        message = formatCreditDeduction("Web Info Processing", credits);
        break;
      case "Concept Generation":
        credits = getTextCreditCost("concept generator");
        message = formatCreditDeduction("Concept Generation", credits);
        break;
      case "Script Generation":
        credits = getTextCreditCost("script & segmentation") * count;
        message = formatCreditDeduction("Script Generation", credits);
        break;
      case "Image Generation":
        if (model) {
          credits = getImageCreditCost(model) * count;
          message = formatCreditDeduction(
            `Image Generation (${model})`,
            credits,
          );
        } else {
          credits = getImageCreditCost("imagen") * count; // default to imagen
          message = formatCreditDeduction("Image Generation", credits);
        }
        break;
      case "Video Generation":
        if (model) {
          credits = getVideoCreditCost(model, 5) * count; // 8 seconds default
          message = formatCreditDeduction(
            `Video Generation (${model})`,
            credits,
          );
        } else {
          credits = getVideoCreditCost("veo2", 5) * count; // default to veo2
          message = formatCreditDeduction("Video Generation", credits);
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

  // Alternative function that takes a pre-formatted message
  const showCreditDeductionMessage = (message) => {
    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000); // Clear after 3 seconds
  };

  // Helper function to show request failure message
  const showRequestFailed = (serviceName = null) => {
    const message = serviceName
      ? `${serviceName} request failed`
      : "Request failed";
    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000);
  };

  return {
    creditDeductionMessage,
    setCreditDeductionMessage,
    showCreditDeduction,
    showCreditDeductionMessage,
    showRequestFailed,
  };
};
