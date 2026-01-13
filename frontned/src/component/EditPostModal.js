"use client"

import { useState, useEffect } from "react";
import { X, ImagePlus, Loader2, AlertCircle } from "lucide-react";

const EditPostModal = ({ post, isOpen, onClose, onUpdate }) => {
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]); // This stores base64 strings for new images and URLs for existing
    const [existingImages, setExistingImages] = useState([]); // Store original images separately
    const [previewUrls, setPreviewUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    // Initialize with post data
    useEffect(() => {
        if (post) {
            setContent(post.content || "");
            setExistingImages(post.images || []);
            setImages(post.images || []); // For backward compatibility
            setPreviewUrls(post.images || []);
        }
    }, [post]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [previewUrls]);

    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + previewUrls.length > 5) {
            setError("Maximum 5 images allowed");
            return;
        }

        files.forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size must be less than 5MB");
                return;
            }

            const previewUrl = URL.createObjectURL(file);

            // ✅ update previews safely
            setPreviewUrls((prev) => [...prev, previewUrl]);

            const reader = new FileReader();
            reader.onloadend = () => {
                // ✅ functional update (no stale state)
                setImages((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setError("");
    };

    const removeImage = (index) => {

        setPreviewUrls((prev) => {
            const removed = prev[index];
            if (removed?.startsWith("blob:")) {
                URL.revokeObjectURL(removed);
            }
            return prev.filter((_, i) => i !== index);
        });

        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError("Please write something for your post");
            return;
        }

        setLoading(true);
        setError("");
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            // TODO: Replace with actual edit post API endpoint
            // For now, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Prepare final images array - combine existing images that weren't removed with new base64 images
            const finalImages = [...existingImages];

            // Add new base64 images (skip existing URLs)
            images.forEach(image => {
                if (image.startsWith('data:')) {
                    finalImages.push(image);
                }
            });

            const updatedPost = {
                ...post,
                content: content.trim(),
                images: finalImages,
                updatedAt: new Date().toISOString()
            };

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Call update callback
            onUpdate(updatedPost);

            // Close modal after short delay
            setTimeout(() => {
                // Clean up blob URLs
                previewUrls.forEach(url => {
                    if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                    }
                });
                onClose();
            }, 500);

        } catch (err) {
            setError("Failed to update post. Please try again.");
            console.error("Update error:", err);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Close modal
    const handleClose = () => {
        // Clean up blob URLs
        previewUrls.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Edit test</h2>
                        <p className="text-sm text-gray-500 mt-1">Make changes to your post</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* User Info */}
                        <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 overflow-hidden">
                                {post?.author?.profilePicture ? (
                                    <img
                                        src={post.author.profilePicture}
                                        alt={post.author.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                        {post?.author?.name?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {post?.author?.name || "User"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Editing post • {new Date(post?.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Content Textarea */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Post Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What would you like to update?"
                                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                required
                            />
                        </div>

                        {/* Images Section */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Images ({previewUrls.length}/5)
                            </label>

                            {/* Image Upload Button */}
                            <div className="mb-4">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="edit-image-upload"
                                    disabled={loading || previewUrls.length >= 5}
                                />
                                <label
                                    htmlFor="edit-image-upload"
                                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl cursor-pointer transition-all ${loading || previewUrls.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                >
                                    <ImagePlus size={18} className="mr-2 text-blue-500" />
                                    <span className="text-gray-700">Add Images</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-2">
                                    Upload up to 5 images (5MB each)
                                </p>
                            </div>

                            {/* Image Grid */}
                            {previewUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 z-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={loading}
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Upload Progress */}
                        {loading && uploadProgress > 0 && (
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                    Updating...
                                </span>
                            ) : (
                                "Update Post"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPostModal;