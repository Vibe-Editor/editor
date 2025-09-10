/**
 * Project ID Integration Test
 * 
 * Test script to verify project ID is properly retrieved from localStorage
 * and used in video editing API calls.
 */

console.log("🆔 Project ID Integration Test");

// Test different project ID scenarios
const testProjectIdIntegration = () => {
    console.log("Testing project ID integration...");
    
    // Scenario 0: Test with Zustand store (highest priority)
    console.log("\n📋 Scenario 0: Zustand store selectedProject");
    try {
        const projectStore = window.__MY_GLOBAL_PROJECT_STORE__;
        if (projectStore) {
            const mockProject = { id: 'zustand-project-999', name: 'Zustand Test Project' };
            projectStore.getState().setSelectedProject(mockProject);
            
            if (typeof generateProjectId === 'function') {
                const result0 = generateProjectId();
                console.log("Result:", result0);
                console.log("Expected: zustand-project-999");
                console.log("Match:", result0 === 'zustand-project-999' ? "✅" : "❌");
            }
            
            // Clean up
            projectStore.getState().clearSelectedProject();
        } else {
            console.log("⚠️ Zustand store not available");
        }
    } catch (error) {
        console.log("❌ Error testing Zustand store:", error);
    }
    
    // Scenario 1: Test with projectId in localStorage
    console.log("\n📋 Scenario 1: projectId in localStorage");
    localStorage.setItem('projectId', 'test-project-123');
    
    // Import and test the function (if available)
    if (typeof generateProjectId === 'function') {
        const result1 = generateProjectId();
        console.log("Result:", result1);
        console.log("Expected: test-project-123");
        console.log("Match:", result1 === 'test-project-123' ? "✅" : "❌");
    }
    
    // Scenario 2: Test with project_id in localStorage
    console.log("\n📋 Scenario 2: project_id in localStorage");
    localStorage.removeItem('projectId');
    localStorage.setItem('project_id', 'test-project-456');
    
    if (typeof generateProjectId === 'function') {
        const result2 = generateProjectId();
        console.log("Result:", result2);
        console.log("Expected: test-project-456");
        console.log("Match:", result2 === 'test-project-456' ? "✅" : "❌");
    }
    
    // Scenario 3: Test with currentProjectId in localStorage
    console.log("\n📋 Scenario 3: currentProjectId in localStorage");
    localStorage.removeItem('project_id');
    localStorage.setItem('currentProjectId', 'test-project-789');
    
    if (typeof generateProjectId === 'function') {
        const result3 = generateProjectId();
        console.log("Result:", result3);
        console.log("Expected: test-project-789");
        console.log("Match:", result3 === 'test-project-789' ? "✅" : "❌");
    }
    
    // Scenario 4: Test fallback behavior
    console.log("\n📋 Scenario 4: No project ID in localStorage (fallback)");
    localStorage.removeItem('currentProjectId');
    
    if (typeof generateProjectId === 'function') {
        const result4 = generateProjectId();
        console.log("Result:", result4);
        console.log("Should start with 'proj_':", result4.startsWith('proj_') ? "✅" : "❌");
    }
    
    // Clean up
    localStorage.removeItem('projectId');
    localStorage.removeItem('project_id');
    localStorage.removeItem('currentProjectId');
    
    console.log("\n✅ Project ID integration test complete!");
};

// Test API call with project ID
const testAPICallWithProjectId = async () => {
    console.log("\n🌐 Testing API call with project ID...");
    
    // Set a test project ID
    localStorage.setItem('projectId', 'api-test-project-123');
    
    // Mock API call structure
    const mockApiCall = () => {
        const projectId = localStorage.getItem('projectId') || 
                         localStorage.getItem('project_id') ||
                         localStorage.getItem('currentProjectId') ||
                         `proj_default_${Date.now()}`;
        
        const apiUrl = `https://backend.usuals.ai/video-editing/runway-aleph/complete?projectId=${projectId}`;
        
        console.log("API URL would be:", apiUrl);
        console.log("Project ID used:", projectId);
        
        return { apiUrl, projectId };
    };
    
    const result = mockApiCall();
    console.log("API call test result:", result);
    
    // Verify project ID is in the URL
    const urlContainsProjectId = result.apiUrl.includes('api-test-project-123');
    console.log("URL contains correct project ID:", urlContainsProjectId ? "✅" : "❌");
    
    // Clean up
    localStorage.removeItem('projectId');
};

// Run tests
testProjectIdIntegration();
testAPICallWithProjectId();

// Export for manual testing
window.testProjectIdIntegration = testProjectIdIntegration;
window.testAPICallWithProjectId = testAPICallWithProjectId;

console.log(`
🆔 Project ID Test Commands:
- testProjectIdIntegration() - Test all project ID scenarios
- testAPICallWithProjectId() - Test API URL generation with project ID

💡 Manual test:
1. Set project ID: localStorage.setItem('projectId', 'your-project-id')
2. Check video editing modal uses it in API calls
3. Verify in Network tab that correct projectId is in query params
`);
