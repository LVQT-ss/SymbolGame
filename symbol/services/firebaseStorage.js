import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { Platform } from 'react-native';

/**
 * Upload video to Firebase Storage
 * @param {string} localUri - Local file URI from video recording
 * @param {number|string} userId - User ID for folder organization (can be fallback timestamp)
 * @param {string} gameSessionId - Game session ID for naming
 * @returns {Promise<string>} - Firebase Storage download URL
 */
export const uploadVideoToFirebase = async (localUri, userId, gameSessionId) => {
    try {
        console.log("🔥 Starting Firebase Storage upload...");
        console.log("📁 Local URI:", localUri);
        console.log("👤 User ID:", userId);
        console.log("🎮 Game Session ID:", gameSessionId);

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `game_recording_${gameSessionId}_${timestamp}.mp4`;

        // Create storage path: videos/userId/filename (userId can be actual ID or timestamp)
        const userFolder = userId ? userId.toString() : `guest_${timestamp}`;
        const storagePath = `videos/${userFolder}/${filename}`;

        console.log("📤 Upload path:", storagePath);

        // Create reference to Firebase Storage
        const storageRef = ref(storage, storagePath);

        // Convert video file to blob for upload
        const response = await fetch(localUri);
        const blob = await response.blob();

        console.log("🚀 Starting upload with blob size:", blob.size);

        // Upload file to Firebase Storage
        const uploadResult = await uploadBytes(storageRef, blob, {
            contentType: 'video/mp4',
            customMetadata: {
                userId: userId ? userId.toString() : 'anonymous',
                gameSessionId: gameSessionId ? gameSessionId.toString() : 'unknown',
                uploadedAt: new Date().toISOString(),
                platform: Platform.OS,
                uploadType: 'game_recording'
            }
        });

        console.log("✅ Video uploaded to Firebase Storage successfully!");

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log("🔗 Firebase download URL:", downloadURL);

        return downloadURL;

    } catch (error) {
        console.error("❌ Firebase upload error:", error);

        // Provide detailed error messages
        if (error.code === 'storage/unauthorized') {
            throw new Error('Firebase Storage: Access denied. Please check permissions.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('Upload was canceled.');
        } else if (error.code === 'storage/unknown') {
            throw new Error('Firebase Storage: Unknown error occurred.');
        } else if (error.code === 'storage/invalid-format') {
            throw new Error('Invalid video format. Only MP4 files are supported.');
        } else if (error.code === 'storage/quota-exceeded') {
            throw new Error('Storage quota exceeded. Please try again later.');
        } else {
            throw new Error(`Firebase upload failed: ${error.message}`);
        }
    }
};

/**
 * Delete video from Firebase Storage
 * @param {string} downloadURL - Firebase download URL
 * @returns {Promise<boolean>} - Success status
 */
export const deleteVideoFromFirebase = async (downloadURL) => {
    try {
        console.log("🗑️ Deleting video from Firebase:", downloadURL);

        // Extract storage path from download URL
        const storageRef = ref(storage, downloadURL);

        // Delete the file
        await deleteObject(storageRef);
        console.log("✅ Video deleted from Firebase Storage");

        return true;
    } catch (error) {
        console.error("❌ Error deleting video from Firebase:", error);
        return false;
    }
};

/**
 * Get video metadata from Firebase Storage
 * @param {string} downloadURL - Firebase download URL
 * @returns {Promise<object>} - File metadata
 */
export const getVideoMetadata = async (downloadURL) => {
    try {
        const storageRef = ref(storage, downloadURL);
        const metadata = await getMetadata(storageRef);

        return {
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            customMetadata: metadata.customMetadata
        };
    } catch (error) {
        console.error("❌ Error getting video metadata:", error);
        return null;
    }
}; 