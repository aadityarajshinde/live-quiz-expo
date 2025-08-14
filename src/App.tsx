import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple login check - in real app this would be authentication
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-purple-600">
          Live Expo Quiz
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          <p className="font-semibold">Admin Access:</p>
          <p>Email: admin@liveexpoquiz.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

const QuizPage = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-purple-600">
              Live Expo Quiz
            </h1>
            <button
              onClick={onLogout}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Question Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Question 1 of 5</h2>
            <div className="mb-6">
              <h3 className="text-lg mb-4">What is the capital of France?</h3>
              <div className="space-y-2">
                {['London', 'Berlin', 'Paris', 'Madrid'].map((option, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">00:35</div>
              <div className="text-sm text-gray-500">Time remaining</div>
            </div>
          </div>

          {/* Leaderboard Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <div className="space-y-3">
              {[
                { name: 'John Doe', score: 4 },
                { name: 'Jane Smith', score: 3 },
                { name: 'Mike Johnson', score: 2 },
                { name: 'Sarah Wilson', score: 2 },
              ].map((player, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <span className="font-bold mr-3">#{index + 1}</span>
                    <span>{player.name}</span>
                  </div>
                  <span className="font-semibold text-purple-600">
                    {player.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isLoggedIn ? 
            <Navigate to="/quiz" replace /> : 
            <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/quiz" 
          element={
            isLoggedIn ? 
            <QuizPage onLogout={handleLogout} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;