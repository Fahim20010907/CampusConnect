"use client"

import { useContext, useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import app from "../../config/firebase.config";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";

const Login = () => {
  const { signIn, loading } = useContext(AuthContext);
  const [error, setError] = useState("");
  const router = useRouter();
  const auth = getAuth(app);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  // Function to create/update user in MongoDB
  const syncUserToDatabase = async (userData) => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.displayName || userData.name || "User",
          email: userData.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync user data");
      }

      return await response.json();
      console.log("response",response)
    } catch (error) {
      console.error("Error syncing user to database:", error);
      // Don't throw error here - user can still log in even if sync fails
    }
  };

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    
    try {
      // Sign in with Firebase
      await signIn(email, password);
      
      // Get current user from Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Sync user data to MongoDB
        await syncUserToDatabase({
          name: currentUser.displayName || email.split('@')[0],
          email: currentUser.email,
        });
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Successfully logged in",
        showConfirmButton: false,
        timer: 1500,
      });
      
      router.push(from);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle Google login
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Sync Google user to MongoDB
      if (result.user) {
        await syncUserToDatabase({
          name: result.user.displayName,
          email: result.user.email,
        });
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Successfully logged in",
        showConfirmButton: false,
        timer: 1500,
      });
      
      router.push(from);
    } catch (error) {
      setError(error.message);
    }
  };

  // Optional: Add Facebook login handler if you implement it
  const handleFacebookSignIn = async () => {
    // You would need to implement Facebook auth and sync here
    setError("Facebook login not implemented yet");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Login Form Section - 780px */}
      <div className="w-[780px] bg-white p-12 rounded-l-2xl shadow-lg">
        <div className="flex items-center mb-2">
          <svg
            className="w-10 h-10 mr-3 text-[#005623]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            ></path>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">
            CampusConnect — Social Platform for Students
          </h1>
        </div>
        
        <h2 className="text-3xl text-[#008e48] font-bold text-center mt-[45px] mb-8">
          Sign In to CampusConnect — the social platform for students
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center bg-[#F2EEEE] justify-center w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-300"
            title="Sign in with Google"
          >
            <svg
              className="w-6 h-6 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814c-1.784-1.664-4.153-2.675-6.735-2.675-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.496 10-10 0-.67-.069-1.325-.201-1.955h-9.799z" />
            </svg>
          </button>
          
          <button
            onClick={handleFacebookSignIn}
            className="flex items-center bg-[#F2EEEE] justify-center w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-300"
            title="Sign in with Facebook"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="29"
              viewBox="0 0 26 29"
              fill="none"
            >
              <path
                d="M6.49995 16.9525V29H15.925V16.9525H22.9531L24.4156 11.4131H15.925V9.45332C15.925 6.525 17.5743 5.40352 21.8318 5.40352C23.1562 5.40352 24.2206 5.42617 24.8381 5.47148V0.447461C23.6762 0.226562 20.8325 0 19.1912 0C10.5056 0 6.49995 2.86035 6.49995 9.02851V11.4131H1.13745V16.9525H6.49995Z"
                fill="black"
              />
            </svg>
          </button>
        </div>
        
        <p className="text-center text-gray-500 mb-8">or use your email account</p>
        
        <form onSubmit={handleLogin} className="max-w-md mx-auto">
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-1"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full pl-10 pr-4 bg-[#D9D9D9] placeholder-black py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full pl-10 pr-4 py-3 border bg-[#D9D9D9] placeholder-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-8">
            <Link
              href="/forgot-password"
              className="text-sm text-[#005623] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#005623] text-white py-3 rounded-lg font-medium hover:bg-[#00451c] transition duration-300 disabled:opacity-70"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
      
      {/* Welcome Section - 500px */}
      <div className="w-[500px] h-[670px] bg-[#005623] p-12 rounded-r-2xl shadow-lg flex flex-col items-center justify-center text-white">
        <h2 className="text-4xl font-bold mb-4">Hello Friends!</h2>
        <p className="text-xl mb-8 opacity-90">
          Enter your personal details and start journey with us
        </p>
        <Link href="/signup">
          <button className="border-2 border-white rounded-full px-8 py-3 font-medium hover:bg-white hover:text-[#005623] transition duration-300 w-max">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Login;