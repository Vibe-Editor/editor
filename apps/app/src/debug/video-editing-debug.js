/**
 * Video Editing Debug Script
 * 
 * Run this in the browser console to debug video editing functionality
 * Usage: Copy and paste this entire script into the browser console
 */

console.log("🎬 Video Editing Debug Script Started");
console.log("🔗 Backend URL: https://backend.usuals.ai");
console.log("🌐 CloudFront URL: https://ds0fghatf06yb.cloudfront.net");

// Debug functions
window.videoEditingDebug = {
    
    // Test 1: Check if components are registered
    checkComponents() {
        console.log("📋 Checking component registration...");
        
        const videoEditModal = customElements.get('video-edit-modal');
        const timelineCanvas = customElements.get('element-timeline-canvas');
        
        console.log("video-edit-modal registered:", !!videoEditModal);
        console.log("element-timeline-canvas registered:", !!timelineCanvas);
        
        return {
            videoEditModal: !!videoEditModal,
            timelineCanvas: !!timelineCanvas
        };
    },
    
    // Test 2: Check if elements exist in DOM
    checkDOMElements() {
        console.log("🔍 Checking DOM elements...");
        
        const modal = document.querySelector('video-edit-modal');
        const timeline = document.querySelector('element-timeline-canvas');
        const menuContainer = document.querySelector('#menuRightClick');
        
        console.log("video-edit-modal in DOM:", !!modal);
        console.log("element-timeline-canvas in DOM:", !!timeline);
        console.log("menuRightClick container in DOM:", !!menuContainer);
        
        return {
            modal: !!modal,
            timeline: !!timeline,
            menuContainer: !!menuContainer
        };
    },
    
    // Test 3: Check timeline state and video elements
    checkTimelineState() {
        console.log("📊 Checking timeline state...");
        
        const timeline = document.querySelector('element-timeline-canvas');
        if (!timeline) {
            console.error("❌ Timeline canvas not found");
            return null;
        }
        
        console.log("Timeline object:", timeline);
        console.log("Timeline.timeline:", timeline.timeline);
        
        // Check project ID in localStorage
        const projectId = localStorage.getItem('projectId') || 
                         localStorage.getItem('project_id') ||
                         localStorage.getItem('currentProjectId');
        console.log("Project ID in localStorage:", projectId);
        
        // Find video elements and their URLs
        const videoElements = {};
        if (timeline.timeline) {
            Object.keys(timeline.timeline).forEach(key => {
                const element = timeline.timeline[key];
                if (element.filetype === 'video') {
                    videoElements[key] = {
                        localpath: element.localpath,
                        blob: element.blob,
                        url: element.url,
                        src: element.src,
                        filetype: element.filetype
                    };
                }
            });
        }
        
        console.log("Video elements found:", videoElements);
        
        // Check for CloudFront URLs
        Object.keys(videoElements).forEach(key => {
            const element = videoElements[key];
            const sources = [element.localpath, element.blob, element.url, element.src];
            const cloudFrontUrl = sources.find(source => 
                source && typeof source === 'string' && source.startsWith('https://ds0fghatf06yb.cloudfront.net')
            );
            if (cloudFrontUrl) {
                console.log(`✅ Video ${key} has CloudFront URL:`, cloudFrontUrl);
            } else {
                console.log(`⚠️ Video ${key} missing CloudFront URL`, sources);
            }
        });
        
        return { videoElements, projectId };
    },
    
    // Test 4: Test modal creation and show
    testModal(videoId = 'test-video') {
        console.log("🎭 Testing modal functionality...");
        
        // Create mock video element
        const mockVideo = {
            filetype: 'video',
            localpath: '/test/sample-video.mp4',
            blob: 'blob:test-url',
            startTime: 0,
            duration: 5000,
            track: 0,
            trim: { startTime: 0, endTime: 5000 }
        };
        
        // Find or create modal
        let modal = document.querySelector('video-edit-modal');
        if (!modal) {
            console.log("Creating new modal element...");
            modal = document.createElement('video-edit-modal');
            document.body.appendChild(modal);
        }
        
        // Mock timeline state
        if (!modal.timelineState) {
            modal.timelineState = { timeline: {} };
        }
        modal.timelineState.timeline[videoId] = mockVideo;
        
        console.log("Calling modal.show()...");
        modal.show(videoId);
        
        return modal;
    },
    
    // Test 5: Test timeline integration
    testTimelineIntegration() {
        console.log("🔗 Testing timeline integration...");
        
        const timeline = document.querySelector('element-timeline-canvas');
        if (!timeline) {
            console.error("❌ Timeline not found");
            return false;
        }
        
        // Check if method exists
        if (typeof timeline.openVideoEditModal !== 'function') {
            console.error("❌ openVideoEditModal method not found");
            return false;
        }
        
        console.log("✅ Timeline integration looks good");
        return true;
    },
    
    // Test 6: Simulate right-click menu
    testRightClickMenu() {
        console.log("🖱️ Testing right-click menu...");
        
        const timeline = document.querySelector('element-timeline-canvas');
        if (!timeline) {
            console.error("❌ Timeline not found");
            return false;
        }
        
        // Mock a video element selection
        timeline.targetId = ['test-video'];
        timeline.timeline = {
            'test-video': {
                filetype: 'video',
                localpath: '/test/video.mp4'
            }
        };
        
        // Test menu generation
        const menuHTML = timeline.videoEditDropdownTemplate();
        console.log("Generated menu HTML:", menuHTML);
        
        return menuHTML.includes('Edit Video with AI');
    },
    
    // Test 7: Simulate double-click
    simulateDoubleClick() {
        console.log("👆 Simulating double-click...");
        
        const timeline = document.querySelector('element-timeline-canvas');
        if (!timeline) {
            console.error("❌ Timeline not found");
            return false;
        }
        
        // Add a test video to timeline
        timeline.timeline = {
            'test-video': {
                filetype: 'video',
                localpath: '/test/video.mp4',
                startTime: 0,
                duration: 5000,
                track: 0,
                trim: { startTime: 0, endTime: 5000 }
            }
        };
        
        // Mock findTarget to return our test video
        const originalFindTarget = timeline.findTarget;
        timeline.findTarget = () => ({
            targetId: 'test-video',
            cursorType: 'move'
        });
        
        // Simulate first click
        timeline.lastClickTime = Date.now() - 100;
        timeline.lastClickTarget = 'test-video';
        
        // Simulate second click (double-click)
        const mockEvent = {
            offsetX: 100,
            offsetY: 50,
            shiftKey: false
        };
        
        console.log("Triggering double-click...");
        timeline._handleMouseDown(mockEvent);
        
        // Restore original method
        timeline.findTarget = originalFindTarget;
        
        return true;
    },
    
    // Test project ID generation
    testProjectId() {
        console.log("🆔 Testing project ID generation...");
        
        // Check Zustand store first
        try {
            const projectStore = window.__MY_GLOBAL_PROJECT_STORE__;
            if (projectStore) {
                const selectedProject = projectStore.getState().selectedProject;
                console.log("Zustand store selectedProject:", selectedProject);
                console.log("Project ID from Zustand:", selectedProject?.id);
            } else {
                console.log("⚠️ Zustand project store not found");
            }
        } catch (error) {
            console.log("❌ Error accessing Zustand store:", error);
        }
        
        // Check localStorage keys
        const keys = ['projectId', 'project_id', 'currentProjectId'];
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            console.log(`localStorage.${key}:`, value);
        });
        
        // Test the generation function (if available)
        if (window.generateProjectId) {
            const generatedId = window.generateProjectId();
            console.log("Generated project ID:", generatedId);
            return generatedId;
        } else {
            console.log("⚠️ generateProjectId function not available in global scope");
            return null;
        }
    },

    // Test setting project in Zustand store
    testSetProject(projectId = 'test-project-123') {
        console.log("🏪 Testing project setting in Zustand store...");
        
        try {
            const projectStore = window.__MY_GLOBAL_PROJECT_STORE__;
            if (projectStore) {
                // Create a mock project
                const mockProject = {
                    id: projectId,
                    name: 'Test Project',
                    description: 'Test project for video editing'
                };
                
                // Set the project
                projectStore.getState().setSelectedProject(mockProject);
                
                // Verify it was set
                const selectedProject = projectStore.getState().selectedProject;
                console.log("Set project:", mockProject);
                console.log("Retrieved project:", selectedProject);
                console.log("Project ID match:", selectedProject?.id === projectId ? "✅" : "❌");
                
                return selectedProject;
            } else {
                console.log("❌ Zustand project store not available");
                return null;
            }
        } catch (error) {
            console.log("❌ Error setting project:", error);
            return null;
        }
    },

    // Test API connectivity
    async testAPIConnectivity() {
        console.log("🌐 Testing API connectivity...");
        
        try {
            // Test basic connectivity first
            const response = await fetch('https://backend.usuals.ai/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log("✅ Backend API is reachable");
                
                // Test video editing endpoint specifically
                console.log("🎬 Testing video editing endpoint...");
                const testResponse = await fetch('https://backend.usuals.ai/video-editing/runway-aleph/complete?projectId=test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token'
                    },
                    body: JSON.stringify({
                        videoUri: 'https://test.com/video.mp4',
                        promptText: 'Test prompt',
                        model: 'gen4_aleph',
                        ratio: '1280:720',
                        seed: 12345,
                        references: [],
                        contentModeration: {},
                        publicFigureThreshold: 'auto'
                    })
                });
                
                console.log(`🎬 Video editing endpoint status: ${testResponse.status}`);
                if (testResponse.status === 401) {
                    console.log("⚠️ Authentication required - this is expected for test");
                }
                
                return true;
            } else {
                console.log(`⚠️ Backend API responded with status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Backend API connection failed: ${error.message}`);
            return false;
        }
    },

    // Run all tests
    async runAllTests() {
        console.log("🚀 Running all video editing tests...");
        console.log("=" .repeat(50));
        
        const results = {
            components: this.checkComponents(),
            domElements: this.checkDOMElements(),
            timelineState: this.checkTimelineState(),
            projectId: this.testProjectId(),
            timelineIntegration: this.testTimelineIntegration(),
            rightClickMenu: this.testRightClickMenu(),
            apiConnectivity: await this.testAPIConnectivity()
        };
        
        console.log("📊 Test Results:", results);
        
        // Try to show modal
        console.log("🎭 Testing modal display...");
        this.testModal();
        
        // Try double-click simulation
        console.log("👆 Testing double-click...");
        this.simulateDoubleClick();
        
        return results;
    }
};

// Auto-run basic checks
console.log("🔧 Running basic checks...");
videoEditingDebug.runAllTests();

console.log(`
🎬 Video Editing Debug Commands Available:
- videoEditingDebug.checkComponents()
- videoEditingDebug.checkDOMElements() 
- videoEditingDebug.checkTimelineState()
- videoEditingDebug.testProjectId()
- videoEditingDebug.testSetProject('project-id')
- videoEditingDebug.testModal()
- videoEditingDebug.testTimelineIntegration()
- videoEditingDebug.testRightClickMenu()
- videoEditingDebug.simulateDoubleClick()
- videoEditingDebug.testAPIConnectivity()
- videoEditingDebug.runAllTests()

💡 To test manually:
1. Right-click on a video in the timeline
2. Look for "Edit Video with AI" option
3. Or double-click on a video element

🆔 To set project ID via Zustand store:
const store = window.__MY_GLOBAL_PROJECT_STORE__;
store.getState().setSelectedProject({id: 'your-project-id', name: 'Test'});

📦 Or via localStorage (fallback):
localStorage.setItem('projectId', 'your-project-id');
`);
