"use client"

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthContext } from "@/context/Authcontext";
import { getAuth } from "firebase/auth";
import app from "@/config/firebase.config";
import {
    doc,
    getDoc,
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from "firebase/firestore";
import Swal from "sweetalert2";
import Image from "next/image";

const ProfilePage = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const router = useRouter();
    const [profileUser, setProfileUser] = useState(null);
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("posts");
    const [posts, setPosts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const auth = getAuth(app);
    const db = getFirestore(app);

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
                            setFollowersCount(mongoData.data.followerCount || 0);
                            setFollowingCount(mongoData.data.followingCount || 0);
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
                            setFollowersCount(mongoData.data.followerCount || 0);
                            setFollowingCount(mongoData.data.followingCount || 0);
                        }
                    }
                }

                // Fetch from Firebase Auth if it's the current user's profile
                if (user?.uid === id) {
                    setProfileUser(user);
                }

                // Check if current user is following this profile
                if (user && id && mongoUser) {
                    const isUserFollowing = mongoUser.followers?.some(
                        follower => follower._id === user.uid || follower === user.uid
                    );
                    setIsFollowing(isUserFollowing);
                }

                // Fetch user's posts from Firestore
                const postsQuery = query(
                    collection(db, "posts"),
                    where("userId", "==", id || user?.uid || ""),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );

                const postsSnapshot = await getDocs(postsQuery);
                const postsData = postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPosts(postsData);

                // Fetch user's study materials
                const materialsQuery = query(
                    collection(db, "materials"),
                    where("userId", "==", id || user?.uid || ""),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );

                const materialsSnapshot = await getDocs(materialsQuery);
                const materialsData = materialsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMaterials(materialsData);

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
    }, [id, user, db]);

    const handleFollow = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/users/follow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.uid,
                    targetUserId: mongoUser?._id || id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsFollowing(data.data.isFollowing);
                setFollowersCount(data.data.followerCount);
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: data.message,
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error("Error following/unfollowing:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to update follow status.",
            });
        }
    };

    const getUserData = () => {
        return mongoUser || profileUser;
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
                                    <h1 className="text-3xl md:text-4xl font-bold">{userData.name}</h1>
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
                                    {!isOwnProfile ? (
                                        <>
                                            <button
                                                onClick={handleFollow}
                                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${isFollowing
                                                    ? "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                                                    : "bg-white text-green-600 hover:bg-emerald-50 hover:shadow-lg shadow-md"
                                                    }`}
                                            >
                                                {isFollowing ? "Following" : "Follow"}
                                            </button>
                                            <button className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
                                                Message
                                            </button>
                                        </>
                                    ) : (
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
                                    <p className="text-3xl font-bold">{posts.length}</p>
                                    <p className="text-emerald-100">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{followersCount}</p>
                                    <p className="text-emerald-100">Followers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{followingCount}</p>
                                    <p className="text-emerald-100">Following</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{materials.length}</p>
                                    <p className="text-emerald-100">Materials</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs and Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {["posts", "materials", "about", "followers", "following"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 min-w-max px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === tab
                                    ? "text-green-600 bg-green-50"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-8">
                    {activeTab === "posts" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <div key={post.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                                        <p className="text-gray-800">{post.content}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(post.createdAt?.toDate()).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="p-2 text-gray-400 hover:text-green-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-green-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        {isOwnProfile ? "Share your first post with the campus community!" : "This user hasn't posted anything yet."}
                                    </p>
                                    {isOwnProfile && (
                                        <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            Create First Post
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "materials" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materials.length > 0 ? (
                                materials.map((material) => (
                                    <div key={material.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {material.subject || "General"}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{material.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{material.description}</p>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{material.fileType || "PDF"}</span>
                                            <span>{material.pages || "N/A"} pages</span>
                                        </div>
                                        <button className="mt-4 w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300">
                                            Download
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Study Materials</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        {isOwnProfile ? "Share your first study material to help others!" : "This user hasn't shared any study materials yet."}
                                    </p>
                                    {isOwnProfile && (
                                        <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            Upload Material
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">About</h3>
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
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Student ID</label>
                                        <p className="text-gray-800 text-lg">{userData.studentId || "Not provided"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Year</label>
                                        <p className="text-gray-800 text-lg">{userData.year ? `Year ${userData.year}` : "Not specified"}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Bio</label>
                                        <p className="text-gray-800">{userData.bio || "No bio provided"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Member Since</label>
                                        <p className="text-gray-800">
                                            {userData.createdAt
                                                ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : "N/A"}
                                        </p>
                                    </div>
                                    {userData.skills && userData.skills.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-2">Skills</label>
                                            <div className="flex flex-wrap gap-2">
                                                {userData.skills.map((skill, index) => (
                                                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;