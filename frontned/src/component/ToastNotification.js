"use client"

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, X, Info } from "lucide-react";

const ToastNotification = ({ type = "info", message, duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        warning: <AlertTriangle size={20} className="text-yellow-500" />,
        info: <Info size={20} className="text-blue-500" />
    };

    const bgColors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        warning: "bg-yellow-50 border-yellow-200",
        info: "bg-blue-50 border-blue-200"
    };

    const textColors = {
        success: "text-green-800",
        error: "text-red-800",
        warning: "text-yellow-800",
        info: "text-blue-800"
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-lg ${bgColors[type]} animate-slide-in`}>
            <div className="flex items-start space-x-3">
                {icons[type]}
                <div className="flex-1 min-w-0">
                    <p className={`font-medium ${textColors[type]}`}>
                        {type === "success" && "Success"}
                        {type === "error" && "Error"}
                        {type === "warning" && "Warning"}
                        {type === "info" && "Information"}
                    </p>
                    <p className={`text-sm mt-1 ${textColors[type]}`}>{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div
                    className="h-1 rounded-full transition-all duration-1000 ease-linear"
                    style={{
                        width: '100%',
                        backgroundColor: type === "success" ? '#10b981' :
                            type === "error" ? '#ef4444' :
                                type === "warning" ? '#f59e0b' : '#3b82f6'
                    }}
                ></div>
            </div>
        </div>
    );
};

export default ToastNotification;