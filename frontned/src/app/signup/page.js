"use client"

import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import app from "../../config/firebase.config";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const Signup = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = getAuth(app);
    const searchParams = useSearchParams();
    const from = searchParams.get("from") || "/login";

    // Function to create user in MongoDB
    const createUserInDatabase = async (userData) => {
        try {
            const response = await fetch("http://localhost:5000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create user in database");
            }

            return await response.json();
        } catch (error) {
            console.error("Error creating user in database:", error);
            // Don't prevent signup if MongoDB fails, but log it
            return null;
        }
    };

    // Handle email/password signup
    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        if (!form.terms.checked) {
            setError("You must agree to the Terms and Conditions");
            setLoading(false);
            return;
        }

        try {
            console.log("Attempting to create user with:", { email, name });

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Firebase user created:", userCredential.user.uid);

            // Update profile with name
            await updateProfile(userCredential.user, {
                displayName: name
            });
            console.log("Profile updated with name");

            // Create user in MongoDB
            console.log("Creating user in MongoDB...");
            const mongoResponse = await createUserInDatabase({
                name: name,
                email: email,
            });
            console.log("MongoDB response:", mongoResponse);

            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Account created successfully!",
                showConfirmButton: false,
                timer: 1500,
            });

            // Redirect after successful signup
            setTimeout(() => {
                router.push(from);
            }, 1600);

        } catch (error) {
            console.error("Signup error:", error);
            let errorMessage = "An error occurred during signup";

            // Handle Firebase errors
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "This email is already registered";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address";
                    break;
                case "auth/operation-not-allowed":
                    errorMessage = "Email/password signup is not enabled";
                    break;
                case "auth/weak-password":
                    errorMessage = "Password is too weak";
                    break;
                default:
                    errorMessage = error.message || "Unknown error occurred";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle Google signup
    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            setError("");

            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Create user in MongoDB
            if (result.user) {
                await createUserInDatabase({
                    name: result.user.displayName,
                    email: result.user.email,
                });
            }

            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Successfully signed up with Google!",
                showConfirmButton: false,
                timer: 1500,
            });

            setTimeout(() => {
                router.push(from);
            }, 1600);

        } catch (error) {
            console.error("Google signup error:", error);
            let errorMessage = "An error occurred during Google signup";

            if (error.code === "auth/popup-closed-by-user") {
                errorMessage = "Signup cancelled";
            } else if (error.code === "auth/account-exists-with-different-credential") {
                errorMessage = "An account already exists with this email";
            } else {
                errorMessage = error.message || "Unknown error";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle Facebook signup
    const handleFacebookSignUp = async () => {
        setError("Facebook signup not implemented yet");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            {/* Signup Form Section - 780px */}
            <div className="w-[780px] bg-white p-12 rounded-l-2xl shadow-lg">
                <div className="flex items-center mb-2">
                    <svg
                        className="w-10 h-10 mr-3 text-[#005623]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        ></path>
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Health And Sanitation Platform
                    </h1>
                </div>

                <h2 className="text-3xl text-[#008e48] font-bold text-center mt-[45px] mb-8">
                    Create Account
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-center space-x-4 mb-8">
                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="flex items-center bg-[#F2EEEE] justify-center w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-300 disabled:opacity-50"
                        title="Sign up with Google"
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
                        onClick={handleFacebookSignUp}
                        disabled={loading}
                        className="flex items-center bg-[#F2EEEE] justify-center w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-300 disabled:opacity-50"
                        title="Sign up with Facebook"
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

                <p className="text-center text-gray-500 mb-8">or register with email</p>

                <form onSubmit={handleSignup} className="max-w-md mx-auto">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            Full Name
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
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    ></path>
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-4 bg-[#D9D9D9] placeholder-black py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent disabled:opacity-70"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

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
                                disabled={loading}
                                className="w-full pl-10 pr-4 bg-[#D9D9D9] placeholder-black py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent disabled:opacity-70"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
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
                                minLength="6"
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-3 border bg-[#D9D9D9] placeholder-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent disabled:opacity-70"
                                placeholder="Enter your password (min 6 characters)"
                            />
                        </div>
                    </div>

                    <div className="mb-8">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-black mb-1"
                        >
                            Confirm Password
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
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    ></path>
                                </svg>
                            </div>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                minLength="6"
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-3 border bg-[#D9D9D9] placeholder-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005623] focus:border-transparent disabled:opacity-70"
                                placeholder="Confirm your password"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="terms"
                                name="terms"
                                required
                                disabled={loading}
                                className="w-4 h-4 text-[#005623] bg-gray-100 border-gray-300 rounded focus:ring-[#005623] focus:ring-2 disabled:opacity-70"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                                I agree to the{" "}
                                <Link href="/terms" className="text-[#005623] hover:underline">
                                    Terms and Conditions
                                </Link>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#005623] text-white py-3 rounded-lg font-medium hover:bg-[#00451c] transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </span>
                        ) : "Sign Up"}
                    </button>

                    <div className="mt-4 text-center">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#005623] font-medium hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>
            </div>

            {/* Welcome Section - 500px */}
            <div className="w-[500px] h-[670px] bg-[#005623] p-12 rounded-r-2xl shadow-lg flex flex-col items-center justify-center text-white">
                <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-xl mb-8 opacity-90">
                    To keep connected with us please login with your personal info
                </p>
                <Link href="/login">
                    <button className="border-2 border-white rounded-full px-8 py-3 font-medium hover:bg-white hover:text-[#005623] transition duration-300 w-max">
                        Sign In
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default Signup;