import React from 'react';

export const ServerLoader = ({ error }: { error?: string | null }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-xl font-semibold text-gray-900">
            {error || 'Connecting to server, Hold tightttt...'}
          </h3>
          <p className="text-gray-500 text-center">
            Please wait while we establish connection with the server. This won't take long...
          </p>
        </div>
      </div>
    </div>
  );
}; 