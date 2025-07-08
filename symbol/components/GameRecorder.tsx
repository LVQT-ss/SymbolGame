import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
  Linking,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import type { CameraType, CameraMountError, VideoQuality } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import {
  MAX_VIDEO_DURATION,
  DEFAULT_VIDEO_DURATION,
} from "../config/constants";

interface GameRecorderProps {
  onRecordingComplete: (recordingUrl: string) => void;
  maxDuration?: number;
  autoStart?: boolean;
  gameStarted?: boolean;
  gameCompleted?: boolean;
}

export const GameRecorder: React.FC<GameRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 10,
  autoStart = false,
  gameStarted = false,
  gameCompleted = false,
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(maxDuration);
  const [showPreview, setShowPreview] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Define hasRequiredPermissions early
  const hasRequiredPermissions =
    cameraPermission?.granted && microphonePermission?.granted;

  useEffect(() => {
    requestPermissions();
  }, []);

  // Auto-start recording when game starts and countdown is done (only once)
  useEffect(() => {
    if (
      autoStart &&
      gameStarted &&
      !isRecording &&
      hasRequiredPermissions &&
      isCameraReady &&
      !hasRecorded
    ) {
      console.log(
        "🎬 Auto-starting ONE 10-second recording for entire game..."
      );
      // Add a small delay to ensure camera is fully ready
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, [
    autoStart,
    gameStarted,
    isRecording,
    hasRequiredPermissions,
    isCameraReady,
    hasRecorded,
  ]);

  // Stop recording when game is completed
  useEffect(() => {
    if (gameCompleted && isRecording) {
      console.log("🏁 Game completed, stopping recording...");
      stopRecording();
    }
  }, [gameCompleted, isRecording]);

  // Recording countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isRecording && recordingTimeLeft > 0) {
      timer = setTimeout(() => {
        setRecordingTimeLeft(recordingTimeLeft - 1);
      }, 1000);
    } else if (isRecording && recordingTimeLeft === 0) {
      console.log("⏰ Recording time limit reached (10 seconds), stopping...");
      stopRecording();
    }
    return () => clearTimeout(timer);
  }, [isRecording, recordingTimeLeft]);

  const requestPermissions = async () => {
    try {
      const cameraStatus = await requestCameraPermission();
      console.log("Camera permission:", cameraStatus);

      const microphoneStatus = await requestMicrophonePermission();
      console.log("Microphone permission:", microphoneStatus);

      const mediaStatus = await requestMediaPermission();
      console.log("Media library permission:", mediaStatus);

      if (!cameraStatus?.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Camera access is required to record your gameplay",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }

      if (!microphoneStatus?.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "Microphone access is required to record audio during gameplay",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }

      if (!mediaStatus?.granted) {
        Alert.alert(
          "Media Library Permission Required",
          "Media library access is required to save your recordings",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  const startRecording = async () => {
    // Enhanced validation
    if (!cameraRef.current) {
      console.log("❌ Camera ref is not available");
      return;
    }

    if (!isCameraReady) {
      console.log("❌ Camera is not ready yet");
      return;
    }

    if (hasRecorded) {
      console.log("❌ Already recorded for this game");
      return;
    }

    if (!cameraPermission?.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to record"
      );
      await requestCameraPermission();
      return;
    }

    if (!microphonePermission?.granted) {
      Alert.alert(
        "Permission Required",
        "Microphone permission is required to record audio"
      );
      await requestMicrophonePermission();
      return;
    }

    try {
      setIsRecording(true);
      setRecordingTimeLeft(maxDuration);

      const options = {
        maxDuration: maxDuration * 1000, // Convert to milliseconds for expo-camera
        quality: "720p" as VideoQuality,
        mute: false,
        videoBitrate: 5 * 1000 * 1000, // 5 Mbps
      };

      console.log(
        "🎬 Starting 10-second game recording with options:",
        options
      );
      console.log("📱 Camera ref current:", !!cameraRef.current);

      const result = await cameraRef.current.recordAsync(options);
      console.log("📹 Recording result:", result);

      if (result?.uri) {
        setHasRecorded(true); // Mark that we've recorded
        onRecordingComplete(result.uri);
        if (mediaPermission?.granted) {
          try {
            await MediaLibrary.saveToLibraryAsync(result.uri);
            console.log("💾 Video saved to media library");
          } catch (saveError) {
            console.log("⚠️ Could not save to media library:", saveError);
          }
        }
      }
    } catch (error) {
      console.error("Failed to record:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert(
        "Recording Error",
        `Failed to record video: ${errorMessage}. Please check permissions and try again.`
      );
    } finally {
      setIsRecording(false);
      setRecordingTimeLeft(maxDuration);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) {
      console.log("❌ Cannot stop recording: Camera ref is not available");
      return;
    }

    try {
      console.log("⏹️ Stopping recording...");
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleCameraReady = () => {
    console.log("📷 Camera is ready");
    setIsCameraReady(true);
  };

  const handleMountError = (error: CameraMountError) => {
    console.error("Camera mount error:", error);
    setIsCameraReady(false);
    Alert.alert(
      "Error",
      "Failed to initialize camera. Please restart the app and try again."
    );
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (!hasRequiredPermissions) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera and microphone permissions are required for recording
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showPreview && (
        <View style={styles.previewContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.previewCamera}
            facing="front"
            mode="video"
            enableTorch={false}
            onCameraReady={handleCameraReady}
            onMountError={handleMountError}
          />

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>{recordingTimeLeft}s</Text>
            </View>
          )}

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!isCameraReady
                ? "Loading..."
                : hasRecorded
                ? "Recorded"
                : isRecording
                ? "Recording..."
                : "Ready"}
            </Text>
          </View>

          {!autoStart && isCameraReady && !hasRecorded && (
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? "⏹️" : "🎬"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.toggleButton} onPress={togglePreview}>
            <Text style={styles.toggleButtonText}>📷</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showPreview && (
        <TouchableOpacity
          style={styles.showPreviewButton}
          onPress={togglePreview}
        >
          <Text style={styles.showPreviewButtonText}>Show Camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  previewContainer: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewCamera: {
    flex: 1,
  },
  recordingIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  recordingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusContainer: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recordButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingButton: {
    backgroundColor: "rgba(255, 0, 0, 0.9)",
  },
  recordButtonText: {
    fontSize: 14,
  },
  toggleButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonText: {
    fontSize: 12,
  },
  showPreviewButton: {
    width: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  showPreviewButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  permissionContainer: {
    width: 120,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    alignItems: "center",
  },
  permissionText: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
