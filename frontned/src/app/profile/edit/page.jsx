// src/app/profile/edit/page.jsx
"use client"

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";
import { getAuth, updateProfile } from "firebase/auth";
import app from "@/config/firebase.config";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "firebase/storage";
import Swal from "sweetalert2";
import Image from "next/image";

const EditProfile = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        department: "",
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setdepartment] = useState('');

    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Predefined departments
    const departmentOptions = [
        "Computer Science",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Business Administration",
        "Economics",
        "Psychology",
        "Biology",
        "Chemistry",
        "Physics",
        "Mathematics",
        "English Literature",
        "History",
        "Political Science",
        "Medicine",
        "Law",
        "Architecture",
        "Fine Arts",
        "Music",
        "Sports Science",
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    // Fetch user data from Firestore
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFormData({
                            name: userData.name || user.displayName || "",
                            bio: userData.bio || "",
                            department: userData.department || "",
                        });
                        if (userData.photoURL) {
                            setImagePreview(userData.photoURL);
                        } else if (user.photoURL) {
                            setImagePreview(user.photoURL);
                        }
                    } else {
                        // Set default from Firebase Auth
                        setFormData({
                            name: user.displayName || "",
                            bio: "",
                            department: "",
                        });
                        if (user.photoURL) {
                            setImagePreview(user.photoURL);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [user, db]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!profileImage) return null;

        try {
            const imageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}`);
            await uploadBytes(imageRef, profileImage);
            const downloadURL = await getDownloadURL(imageRef);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            Swal.fire("Error", "You must be logged in to update profile", "error");
            router.push("/login");
            return;
        }

        setIsSubmitting(true);

        try {
            let photoURL = imagePreview;

            // Upload new image if selected
            if (profileImage) {
                const uploadedURL = await uploadImage();
                if (uploadedURL) {
                    photoURL = uploadedURL;
                }
            }

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: formData.name,
                photoURL: photoURL,
            });

            // Update Firestore user document
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(
                userDocRef,
                {
                    name: formData.name,
                    email: user.email,
                    photoURL: photoURL,
                    bio: formData.bio,
                    department: formData.department,
                    updatedAt: new Date().toISOString(),
                },
                { merge: true }
            );

            Swal.fire({
                icon: "success",
                title: "Profile Updated!",
                text: "Your profile has been updated successfully.",
                timer: 1500,
                showConfirmButton: false,
            });

            // Redirect to profile page
            setTimeout(() => {
                router.push(`/profile/${user.uid}`);
            }, 1600);
        } catch (error) {
            console.error("Error updating profile:", error);
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: error.message || "Failed to update profile. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-gray-600 mt-2">Update your personal information</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Profile Image Upload */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                Profile Picture
                            </label>
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-green-100 border-4 border-white shadow">
                                        {imagePreview ? (
                                            <Image
                                                src={imagePreview}
                                                alt="Profile Preview"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl text-green-600 font-bold">
                                                    {formData.name?.[0]?.toUpperCase() || "U"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="profileImage"
                                        className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 cursor-pointer shadow-lg"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </label>
                                    <input
                                        type="file"
                                        id="profileImage"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Upload a new profile picture. JPG, PNG or GIF (max. 5MB)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileImage(null);
                                            setImagePreview("");
                                        }}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                        Remove photo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Name Field */}
                        <div className="mb-6">
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Department Field */}
                        <div className="mb-6">
                            <label
                                htmlFor="department"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Department
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Select your department</option>
                                {departmentOptions.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Bio Field */}
                        <div className="mb-8">
                            <label
                                htmlFor="bio"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                placeholder="Tell us about yourself..."
                                maxLength="500"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {formData.bio.length}/500 characters
                            </p>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <p className="text-gray-900">{user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Email address cannot be changed
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.push(`/profile/${user.uid}`)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;