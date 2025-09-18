import { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

const StoreProvider = ({ children }) => {
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    // Ensure store is initialized
    try {
      const store = useProjectStore.getState();
      console.log('🏪 Store initialized successfully');
      setStoreReady(true);
    } catch (error) {
      console.error('❌ Store initialization failed:', error);
      // Still render children to avoid blocking the app
      setStoreReady(true);
    }
  }, []);

  if (!storeReady) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return children;
};

export default StoreProvider;
