import React from "react";
import { Link } from "react-router";

import { api } from "../api";

function Login() {
  // loading state
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const userData = {
        email: e.target.email.value,
        password: e.target.password.value,
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!emailRegex.test(userData.email)) {
        alert("Invalid email address");
        return;
      }
      if (!passwordRegex.test(userData.password)) {
        alert(
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
        return;
      }

      setLoading(true);

      const response = await api.login(userData);

      const { token, fullName } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("fullName", fullName);

      alert("Login successful");
      window.location.href = "/";
      setLoading(false);
    } catch (error) {
      setLoading(false);
      let message = "Error during login";
      if (error.response && error.response.data && error.response.data.error) {
        message = error.response.data.error;
      }
      alert(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate-gradient bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float delay-[2s]"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float delay-[4s]"></div>

      <div className="relative bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-200">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
            >
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="group">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                name="remember-me"
                className="h-4 w-4 bg-white/5 border-white/10 rounded focus:ring-indigo-400 focus:ring-offset-0"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-white"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => alert("This is a frontend-only demo")}
              className="text-sm text-white hover:text-indigo-200 transition duration-200"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg hover:from-indigo-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* <p className="mt-8 text-center text-sm text-gray-200">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-white hover:text-indigo-200 transition duration-200"
          >
            Sign up now
          </Link>
        </p> */}
      </div>
    </div>
  );
}

export default Login;
