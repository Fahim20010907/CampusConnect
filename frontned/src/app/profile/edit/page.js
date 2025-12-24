// src/app/profile/edit/page.jsx - Fixed version
"use client"

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";
import { getAuth, updateProfile } from "firebase/auth";
import app from "@/config/firebase.config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Swal from "sweetalert2";

const EditProfile = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        department: "",
        role: "student",
        studentId: "",
        year: 1,
        skills: "",
        phone: "",
        linkedin: "",
        github: "",
        twitter: ""
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const auth = getAuth(app);
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

    const roleOptions = [
        { value: "student", label: "Student" },
        { value: "faculty", label: "Faculty" },
        { value: "club_coordinator", label: "Club Coordinator" },
        { value: "admin", label: "Admin" }
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.email) {
                try {
                    setLoading(true);
                    // Fetch user data from MongoDB API
                    const response = await fetch(`http://localhost:5000/api/users/email/${user.email}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            const userData = data.data;
                            setFormData({
                                name: userData.name || user.displayName || "",
                                bio: userData.bio || "",
                                department: userData.department || "",
                                role: userData.role || "student",
                                studentId: userData.studentId || "",
                                year: userData.year || 1,
                                skills: userData.skills?.join(", ") || "",
                                phone: userData.phone || "",
                                linkedin: userData.socialLinks?.linkedin || "",
                                github: userData.socialLinks?.github || "",
                                twitter: userData.socialLinks?.twitter || ""
                            });
                            
                            // Fix: Check if profilePicture exists and is a valid URL
                            if (userData.profilePicture && 
                                (userData.profilePicture.startsWith('http') || 
                                 userData.profilePicture.startsWith('https'))) {
                                setImagePreview(userData.profilePicture);
                            } else if (user.photoURL) {
                                setImagePreview(user.photoURL);
                            } else {
                                // Set default or empty preview
                                setImagePreview("");
                            }
                        }
                    } else {
                        // If user doesn't exist in MongoDB, use Firebase data
                        setFormData({
                            name: user.displayName || "",
                            bio: "",
                            department: "",
                            role: "student",
                            studentId: "",
                            year: 1,
                            skills: "",
                            phone: "",
                            linkedin: "",
                            github: "",
                            twitter: ""
                        });
                        
                        if (user.photoURL) {
                            setImagePreview(user.photoURL);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Fallback to Firebase data
                    setFormData({
                        name: user.displayName || "",
                        bio: "",
                        department: "",
                        role: "student",
                        studentId: "",
                        year: 1,
                        skills: "",
                        phone: "",
                        linkedin: "",
                        github: "",
                        twitter: ""
                    });
                    
                    if (user.photoURL) {
                        setImagePreview(user.photoURL);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        if (user) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Create a hidden file input ref
    const fileInputRef = useState(null);

    const handleImageClick = () => {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageChange(file);
            }
        };
        
        // Append to body and trigger click
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    };

    const handleImageChange = (file) => {
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                Swal.fire({
                    icon: "error",
                    title: "File too large",
                    text: "Please select an image smaller than 5MB",
                });
                return;
            }
            
            setProfileImage(file);
            
            // Create a blob URL for preview
            const blobUrl = URL.createObjectURL(file);
            setImagePreview(blobUrl);
        }
    };

    const uploadImage = async () => {
        if (!profileImage) return null;

        try {
            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `${timestamp}_${profileImage.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const imageRef = ref(storage, `profile-images/${user.uid}/${fileName}`);
            
            console.log("Uploading image to:", imageRef.fullPath);
            
            // Upload the file
            const snapshot = await uploadBytes(imageRef, profileImage);
            console.log("Upload completed:", snapshot);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(imageRef);
            console.log("Download URL:", downloadURL);
            
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            Swal.fire({
                icon: "error",
                title: "Upload Failed",
                text: "Failed to upload image. Please try again.",
            });
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
            let photoURL = null;

            // Upload new image if selected
            if (profileImage) {
                const uploadedURL = await uploadImage();
                if (uploadedURL) {
                    photoURL = uploadedURL;
                } else {
                    // If upload failed, use the existing image
                    photoURL = imagePreview?.startsWith('blob:') ? null : imagePreview;
                }
            } else {
                // Keep existing image (if it's not a blob URL)
                photoURL = imagePreview?.startsWith('blob:') ? null : imagePreview;
            }

            // Update Firebase Auth profile
            if (photoURL && photoURL !== user.photoURL) {
                try {
                    await updateProfile(auth.currentUser, {
                        displayName: formData.name,
                        photoURL: photoURL,
                    });
                } catch (authError) {
                    console.error("Error updating Firebase auth:", authError);
                    // Continue with MongoDB update even if Firebase fails
                }
            }

            // Prepare data for MongoDB
            const userData = {
                name: formData.name,
                email: user.email,
                profilePicture: photoURL || "",
                bio: formData.bio,
                department: formData.department,
                role: formData.role,
                studentId: formData.studentId,
                phone: formData.phone,
                year: formData.year,
                skills: formData.skills.split(",").map(skill => skill.trim()).filter(skill => skill.length > 0),
                socialLinks: {
                    linkedin: formData.linkedin,
                    github: formData.github,
                    twitter: formData.twitter
                }
            };

            // Update user in MongoDB using email-based endpoint
            const response = await fetch(`http://localhost:5000/api/users/email/${user.email}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (!response.ok) {
                // If user doesn't exist in MongoDB, create new user
                if (response.status === 404) {
                    const createResponse = await fetch("http://localhost:5000/api/users", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(userData),
                    });

                    const createResult = await createResponse.json();
                    
                    if (!createResponse.ok) {
                        throw new Error(createResult.message || "Failed to create user profile");
                    }
                } else {
                    throw new Error(result.message || "Failed to update profile");
                }
            }

            Swal.fire({
                icon: "success",
                title: "Profile Updated!",
                text: "Your profile has been updated successfully.",
                timer: 1500,
                showConfirmButton: false,
            });

            // Clean up blob URL if it exists
            if (imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }

            // Redirect to profile page
            setTimeout(() => {
                // Try to fetch the updated user ID
                fetch(`http://localhost:5000/api/users/email/${user.email}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            router.push(`/profile/${data.data._id}`);
                        } else {
                            router.push(`/profile/${user.uid}`);
                        }
                    })
                    .catch(() => {
                        router.push(`/profile/${user.uid}`);
                    });
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

    // Clean up blob URLs on component unmount
    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    if (authLoading || loading) {
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-gray-600 mt-2">Update your personal information</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Profile Image Upload - FIXED VERSION */}
                        <div className="mb-10 text-center">
                            <label className="block text-lg font-semibold text-gray-700 mb-6">
                                Profile Picture
                            </label>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    {/* Main profile image container - clickable */}
                                    <div 
                                        className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 border-8 border-white shadow-xl cursor-pointer hover:border-green-200 transition-all duration-300"
                                        onClick={handleImageClick}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // If image fails to load, show fallback
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-6xl text-green-600 font-bold">
                                                    {formData.name?.[0]?.toUpperCase() || "U"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Camera icon overlay */}
                                    <div 
                                        className="absolute bottom-3 right-3 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-110"
                                        onClick={handleImageClick}
                                    >
                                        <svg
                                            className="w-6 h-6"
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
                                    </div>
                                    
                                    {/* Hidden file input - just for reference, not used directly */}
                                    <input
                                        type="file"
                                        id="profileImage"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) handleImageChange(file);
                                        }}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Click on the profile picture or camera icon to upload
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3">
                                        JPG, PNG or GIF (max. 5MB)
                                    </p>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileImage(null);
                                                setImagePreview("");
                                            }}
                                            className="text-sm text-red-600 hover:text-red-800 hover:underline transition-colors"
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rest of the form remains the same... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Name Field */}
                            <div className="col-span-1">
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            {/* Department Field */}
                            <div className="col-span-1">
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                >
                                    <option value="">Select your department</option>
                                    {departmentOptions.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Field */}
                            <div className="col-span-1">
                                <label
                                    htmlFor="role"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                >
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Student ID Field */}
                            <div className="col-span-1">
                                <label
                                    htmlFor="studentId"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Student ID
                                </label>
                                <input
                                    type="text"
                                    id="studentId"
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                    placeholder="Enter student ID"
                                />
                            </div>

                            {/* Year Field */}
                            <div className="col-span-1">
                                <label
                                    htmlFor="year"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Year
                                </label>
                                <select
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                >
                                    {[1, 2, 3, 4, 5].map((yr) => (
                                        <option key={yr} value={yr}>
                                            Year {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Phone Field */}
                            <div className="col-span-1">
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                    placeholder="Enter phone number"
                                />
                            </div>
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 resize-none"
                                placeholder="Tell us about yourself..."
                                maxLength="500"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {formData.bio.length}/500 characters
                            </p>
                        </div>

                        {/* Skills Field */}
                        <div className="mb-8">
                            <label
                                htmlFor="skills"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Skills (comma separated)
                            </label>
                            <input
                                type="text"
                                id="skills"
                                name="skills"
                                value={formData.skills}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                placeholder="e.g., React, Node.js, Python, UI/UX Design"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Separate skills with commas
                            </p>
                        </div>

                        {/* Social Links */}
                        <div className="mb-10">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        htmlFor="linkedin"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        LinkedIn
                                    </label>
                                    <input
                                        type="url"
                                        id="linkedin"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="github"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        GitHub
                                    </label>
                                    <input
                                        type="url"
                                        id="github"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                        placeholder="https://github.com/username"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="twitter"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Twitter
                                    </label>
                                    <input
                                        type="url"
                                        id="twitter"
                                        name="twitter"
                                        value={formData.twitter}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                        placeholder="https://twitter.com/username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <p className="text-gray-900 font-medium text-lg">{user.email}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Email address cannot be changed
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    if (user.email) {
                                        router.push(`/profile`);
                                    } else {
                                        router.push("/");
                                    }
                                }}
                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-lg"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
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
                                        Saving Changes...
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