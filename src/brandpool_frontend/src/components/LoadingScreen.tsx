import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  progress?: number;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  message = "Loading...", 
  submessage,
  progress,
  fullScreen = true 
}: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? "min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md mx-auto">
        {/* Logo and Spinner */}
        <motion.div 
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-200 border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.img 
              src="/logo2.svg" 
              alt="BrandPool" 
              className="absolute inset-0 w-8 h-8 m-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Loading Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          {submessage && (
            <p className="text-gray-300 text-sm mb-6">{submessage}</p>
          )}
        </motion.div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <motion.div 
            className="w-full bg-gray-700 rounded-full h-2 mb-4"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        )}

        {/* Animated Dots */}
        <motion.div 
          className="flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ size = "sm", className = "" }: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-300 rounded-lg p-6 space-y-4">
        <div className="h-4 bg-gray-400 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-400 rounded"></div>
          <div className="h-3 bg-gray-400 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-400 rounded w-20"></div>
          <div className="h-8 bg-gray-400 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
