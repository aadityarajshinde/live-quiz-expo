const App = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Live Expo Quiz
        </h1>
        <p className="text-xl">Welcome to the quiz app!</p>
        <div className="mt-8 space-y-4">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Get Started
          </button>
          <div className="text-sm text-gray-500">
            Basic app loaded successfully
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;