import React from "react";
import { Link } from "react-router";
import { api } from "../api";

function SignUp() {
  // loading state
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
        email: e.target.email.value,
        password: e.target.password.value,
        confirmPassword: e.target.confirmPassword.value,
      };

      // validate each input using reg ex
      const firstNameRegex = /^[a-zA-Z]+$/;
      const lastNameRegex = /^[a-zA-Z]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!firstNameRegex.test(userData.firstName)) {
        alert("First name must contain only letters");
        return;
      }
      if (!lastNameRegex.test(userData.lastName)) {
        alert("Last name must contain only letters");
        return;
      }
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
      if (userData.password !== userData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      setLoading(true);

      const response = await api.register(userData);

      alert("Registration successful");
      window.location.href = "/login";
      setLoading(false);
    } catch (error) {
      let message = "Error during registration";
      if (error.response && error.response.data && error.response.data.error) {
        message = error.response.data.error;
      }
      setLoading(false);
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
          <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-200">Join us today and get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-white mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
                placeholder="John"
              />
            </div>
            <div className="group">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-white mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="group">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
              placeholder="john@example.com"
            />
          </div>

          <div className="group">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
              placeholder="••••••••"
            />
            <p className="mt-1 text-sm text-gray-300">
              Must be at least 8 characters
            </p>
          </div>

          <div className="group">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-white mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 text-white transition duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                className="h-4 w-4 bg-white/5 border-white/10 rounded focus:ring-indigo-400 focus:ring-offset-0"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="terms" className="text-sm text-white">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => alert("Terms of Service clicked")}
                  className="font-medium text-indigo-300 hover:text-indigo-200 transition duration-200"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => alert("Privacy Policy clicked")}
                  className="font-medium text-indigo-300 hover:text-indigo-200 transition duration-200"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg hover:from-indigo-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-200">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-white hover:text-indigo-200 transition duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
