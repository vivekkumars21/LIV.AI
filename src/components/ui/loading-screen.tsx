import { IntraKartLogo } from './intrakart-logo';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <IntraKartLogo variant="full" size="xl" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-white/80 mt-4 text-sm">Loading your design studio...</p>
      </div>
    </div>
  );
}