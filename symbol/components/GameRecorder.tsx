import React, { useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Camera, CameraType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import {
  MAX_VIDEO_DURATION,
  DEFAULT_VIDEO_DURATION,
} from "../config/constants";

interface GameRecorderProps {
  onRecordingComplete: (recordingUrl: string) => void;
  maxDuration?: number;
}

export const GameRecorder: React.FC<GameRecorderProps> = ({
  onRecordingComplete,
  maxDuration = DEFAULT_VIDEO_DURATION,
}) => {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const cameraRef = useRef<Camera>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Request permissions on component mount
  React.useEffect(() => {
    requestPermission();
    requestMediaPermission();
  }, []);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start recording function
  const startRecording = async () => {
    if (!cameraRef.current) return;

    setIsRecording(true);
    setRecordingTimer(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTimer((prev) => {
        if (prev >= Math.min(maxDuration, MAX_VIDEO_DURATION)) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: Math.min(maxDuration, MAX_VIDEO_DURATION),
        quality: "720p",
      });

      // Save to media library and get the URI
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      const localUri = asset.uri;

      // Call the callback with the local URI
      onRecordingComplete(localUri);
    } catch (error) {
      console.error("Recording failed:", error);
    } finally {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>We need camera permission to record your game.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={CameraType.front}>
        <View style={styles.buttonContainer}>
          <Text style={styles.timerText}>
            {isRecording
              ? `${recordingTimer}s / ${Math.min(
                  maxDuration,
                  MAX_VIDEO_DURATION
                )}s`
              : "Ready"}
          </Text>
          <TouchableOpacity
            style={[styles.button, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  recordingButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  timerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
