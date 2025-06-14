import { useAuth } from '../hooks/useAuth';

export function LoginView() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img src="/logo2.svg" alt="BrandPool" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">BrandPool</h1>
            </div>
            <p className="text-gray-600">
              Decentralized Influencer Marketing Platform
            </p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to BrandPool
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Connect brands with influencers through our decentralized platform.
                Sign in with Internet Identity to get started.
              </p>
            </div>

            <button
              onClick={login}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  Sign in with Internet Identity
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                New to Internet Identity?{' '}
                <a 
                  href="https://identity.ic0.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Create an account
                </a>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">100+</div>
                  <div className="text-xs text-gray-500">Campaigns</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary-600">50+</div>
                  <div className="text-xs text-gray-500">Influencers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">25+</div>
                  <div className="text-xs text-gray-500">Brands</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by Internet Computer Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
