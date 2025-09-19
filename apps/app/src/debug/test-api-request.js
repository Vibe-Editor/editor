/**
 * Debug script to test the video editing API request directly
 * Run this in the browser console to test the API
 */

async function testVideoEditingAPI() {
  console.log("🧪 Testing Video Editing API Request...");
  
  // Test data
  const testVideoUri = "https://ds0fghatf06yb.cloudfront.net/cmf5bzih908o1p0nlmp1mvk28/videos/cmf5c2rwd08ozp0nld8j81qph";
  const testProjectId = "cmf5bzih908o1p0nlmp1mvk28";
  const testPrompt = "Add snow falling in the background";
  
  // Get auth token
  const authToken = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   sessionStorage.getItem('authToken') ||
                   sessionStorage.getItem('token');
  
  console.log("🔑 Auth token present:", authToken ? "YES" : "NO");
  
  // Construct API URL
  const apiUrl = `https://backend.usuals.ai/video-editing/runway-aleph/complete?projectId=${testProjectId}`;
  
  // Request body
  const requestBody = {
    videoUri: testVideoUri,
    promptText: testPrompt,
    model: "gen4_aleph",
    ratio: "1280:720",
    seed: Math.floor(Math.random() * 1000000),
    references: [],
    contentModeration: {},
    publicFigureThreshold: "auto"
  };
  
  console.log("🚀 API REQUEST DETAILS:");
  console.log("   URL:", apiUrl);
  console.log("   Method: POST");
  console.log("   Headers:", {
    'Content-Type': 'application/json',
    'Authorization': authToken ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'
  });
  console.log("   Body:", JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("📡 API RESPONSE:");
    console.log("   Status:", response.status);
    console.log("   Status Text:", response.statusText);
    console.log("   Headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("❌ ERROR RESPONSE DATA:", errorData);
      return { success: false, error: errorData, status: response.status };
    }
    
    const result = await response.json();
    console.log("✅ SUCCESS RESPONSE DATA:", result);
    console.log("   S3 Key:", result.s3Key);
    console.log("   Video URL:", result.videoUrl);
    console.log("   Credits Used:", result.creditsUsed);
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error("💥 Network/Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

// Test different video URLs
async function testDifferentVideoUrls() {
  console.log("🔍 Testing different video URL patterns...");
  
  const testUrls = [
    "https://ds0fghatf06yb.cloudfront.net/cmf5bzih908o1p0nlmp1mvk28/videos/cmf5c2rwd08ozp0nld8j81qph",
    "https://ds0fghatf06yb.cloudfront.net/cmf5bzih908o1p0nlmp1mvk28/videos/cmf5c2rwd08ozp0nld8j81qph/video.mp4",
    "https://ds0fghatf06yb.cloudfront.net/videos/cmf5c2rwd08ozp0nld8j81qph"
  ];
  
  for (const url of testUrls) {
    console.log(`\n🎯 Testing URL: ${url}`);
    
    // Quick HEAD request to check if URL exists
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      console.log(`   Status: ${headResponse.status} (${headResponse.ok ? 'OK' : 'NOT FOUND'})`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Export functions for console use
window.testVideoEditingAPI = testVideoEditingAPI;
window.testDifferentVideoUrls = testDifferentVideoUrls;

console.log("🔧 Debug functions loaded:");
console.log("   testVideoEditingAPI() - Test the complete API request");
console.log("   testDifferentVideoUrls() - Test if video URLs are accessible");
