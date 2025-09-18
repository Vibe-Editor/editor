import { useState, useEffect } from 'react';
import FinalWorkingInterface from '../FinalWorkingInterface';
import ProjectEditor from './ProjectEditor';
import StoreProvider from './StoreProvider';
import ErrorBoundary from './ErrorBoundary';

const AppRouter = () => {
  const [currentView, setCurrentView] = useState('chat');

  useEffect(() => {
    const handleOpenProjectEditor = () => {
      setCurrentView('editor');
    };

    const handleCloseProjectEditor = () => {
      setCurrentView('chat');
    };

    window.addEventListener('openProjectEditor', handleOpenProjectEditor);
    window.addEventListener('projectEditor:close', handleCloseProjectEditor);

    return () => {
      window.removeEventListener('openProjectEditor', handleOpenProjectEditor);
      window.removeEventListener('projectEditor:close', handleCloseProjectEditor);
    };
  }, []);

  return (
    <ErrorBoundary>
      <StoreProvider>
        {currentView === 'editor' ? <ProjectEditor /> : <FinalWorkingInterface />}
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default AppRouter;
