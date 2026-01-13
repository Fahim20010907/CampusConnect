"use client"

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";
import { getAuth } from "firebase/auth";
import app from "@/config/firebase.config";
import Swal from "sweetalert2";

const ProfilePage = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const router = useRouter();
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth(app);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                
                // If we have a MongoDB ID in params, fetch by ID
                if (id && id.length === 24) {
                    // Fetch from MongoDB by ID
                    const mongoResponse = await fetch(`http://localhost:5000/api/users/${id}`);
                    if (mongoResponse.ok) {
                        const mongoData = await mongoResponse.json();
                        if (mongoData.success) {
                            setMongoUser(mongoData.data);
                        }
                    }
                }
                // If user is logged in and viewing own profile
                else if (user && user.email) {
                    // Fetch from MongoDB by email
                    const mongoResponse = await fetch(`http://localhost:5000/api/users/email/${user.email}`);
                    if (mongoResponse.ok) {
                        const mongoData = await mongoResponse.json();
                        if (mongoData.success) {
                            setMongoUser(mongoData.data);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load profile data. Please try again.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id, user]);

    const getUserData = () => {
        return mongoUser || user;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    const userData = getUserData();
    if (!userData) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isOwnProfile = user?.uid === id || (mongoUser && user?.email === mongoUser.email);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 pt-20 pb-12">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8">
                        {/* Profile Picture */}
                        <div className="relative -mt-16 md:-mt-20">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-gradient-to-br from-white to-emerald-100">
                                {userData.profilePicture || userData.photoURL ? (
                                    <img
                                        src={userData.profilePicture || userData.photoURL}
                                        alt={userData.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-6xl text-green-600 font-bold">
                                            {userData.name?.[0]?.toUpperCase() || "U"}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {isOwnProfile && (
                                <button
                                    onClick={() => router.push("/profile/edit")}
                                    className="absolute bottom-4 right-4 bg-white text-green-600 p-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-left text-white">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold">{userData.name || userData.displayName}</h1>
                                    <p className="text-emerald-100 mt-1">{userData.email}</p>
                                    {userData.department && (
                                        <div className="mt-3 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {userData.department}
                                        </div>
                                    )}
                                    {userData.role && (
                                        <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500">
                                            {userData.role}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6 md:mt-0 space-x-3">
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => router.push("/profile/edit")}
                                            className="px-8 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-emerald-50 hover:shadow-lg shadow-md transition-all duration-300"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            {userData.bio && (
                                <p className="mt-6 text-lg max-w-3xl opacity-90">{userData.bio}</p>
                            )}

                            {/* Stats */}
                            <div className="mt-8 flex justify-center md:justify-start space-x-12">
                                <div className="text-center">
                                    <p className="text-3xl font-bold">0</p>
                                    <p className="text-emerald-100">Followers</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Department</label>
                                <p className="text-gray-800 text-lg">{userData.department || "Not specified"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Role</label>
                                <p className="text-gray-800 text-lg capitalize">{userData.role || "Student"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                                <p className="text-gray-800 text-lg">{userData.email}</p>
                            </div>
                            {userData.skills && userData.skills.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Skills</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(userData.skills) 
                                            ? userData.skills.map((skill, index) => (
                                                <span key={index} className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm">
                                                    {skill}
                                                </span>
                                            ))
                                            : <p className="text-gray-800">{userData.skills}</p>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Bio</label>
                                <p className="text-gray-800">{userData.bio || "No bio provided"}</p>
                            </div>
                            
                            {/* Social Links */}
                            {(userData.socialLinks || (userData.linkedin || userData.github || userData.twitter)) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Social Links</label>
                                    <div className="space-y-3">
                                        {userData.socialLinks?.linkedin || userData.linkedin ? (
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-blue-700 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                </svg>
                                                <a 
                                                    href={userData.socialLinks?.linkedin || userData.linkedin} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    LinkedIn Profile
                                                </a>
                                            </div>
                                        ) : null}
                                        
                                        {userData.socialLinks?.github || userData.github ? (
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-gray-800 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                </svg>
                                                <a 
                                                    href={userData.socialLinks?.github || userData.github} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-gray-800 hover:underline"
                                                >
                                                    GitHub Profile
                                                </a>
                                            </div>
                                        ) : null}
                                        
                                        {userData.socialLinks?.twitter || userData.twitter ? (
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                                </svg>
                                                <a 
                                                    href={userData.socialLinks?.twitter || userData.twitter} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:underline"
                                                >
                                                    Twitter Profile
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;