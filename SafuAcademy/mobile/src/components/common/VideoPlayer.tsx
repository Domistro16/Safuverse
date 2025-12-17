import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/ThemeContext';
import { Text } from '@components/ui';
import { VIDEO_COMPLETION_THRESHOLD } from '@config/constants';

interface VideoPlayerProps {
  videoUrl: string;
  onProgressUpdate?: (progress: number) => void;
  onWatchComplete?: () => void;
  initialProgress?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onProgressUpdate,
  onWatchComplete,
  initialProgress = 0,
}) => {
  const { colors, spacing } = useTheme();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Seek to initial progress when video loads
    if (videoRef.current && initialProgress > 0 && duration > 0) {
      videoRef.current.setPositionAsync(initialProgress * duration);
    }
  }, [duration, initialProgress]);

  useEffect(() => {
    // Update progress every second
    const interval = setInterval(() => {
      if (isPlaying && duration > 0) {
        const progressPercent = position / duration;
        onProgressUpdate?.(progressPercent);

        // Check if video should be marked as complete
        if (progressPercent >= VIDEO_COMPLETION_THRESHOLD && !hasCompleted) {
          setHasCompleted(true);
          onWatchComplete?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, position, duration, hasCompleted, onProgressUpdate, onWatchComplete]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={[styles.video, { width: screenWidth }]}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls={false}
      />

      {/* Overlay Controls */}
      <View style={styles.overlay}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: `${colors.card}aa` }]}
          onPress={togglePlayPause}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={48}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={[styles.bufferingContainer, { backgroundColor: `${colors.card}aa` }]}>
            <Text variant="bodySmall" color={colors.text}>
              Loading...
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercent}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      {/* Time Display */}
      <View style={[styles.timeContainer, { padding: spacing.sm }]}>
        <Text variant="caption" color={colors.textSecondary}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
        {hasCompleted && (
          <View
            style={[
              styles.completedBadge,
              { backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: 4 },
            ]}
          >
            <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
              Completed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    height: 220,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingContainer: {
    padding: 16,
    borderRadius: 8,
  },
  progressContainer: {
    height: 4,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    borderRadius: 4,
  },
});
