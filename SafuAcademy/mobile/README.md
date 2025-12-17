# SafuAcademy Mobile App

A React Native mobile application for SafuAcademy - Learn Web3 & Blockchain with interactive courses.

## Features

- **Wallet Authentication**: Connect with Web3 wallets via WalletConnect
- **Course Browsing**: Browse and search through available courses
- **Video Learning**: Watch course lessons with progress tracking
- **Interactive Quizzes**: Test your knowledge with lesson quizzes
- **Points System**: Earn points by completing lessons and quizzes
- **Certificates**: Earn on-chain verified certificates upon course completion
- **Dark/Light Theme**: Toggle between dark and light modes
- **Blockchain Integration**: BSC blockchain integration for on-chain verification

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **State Management**: React Query (TanStack Query v5)
- **Web3**: WalletConnect, Viem, Ethers.js
- **Styling**: React Native StyleSheet with custom theme system
- **Storage**: AsyncStorage
- **Video**: Expo AV
- **HTTP Client**: Axios

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/        # Basic UI components (Button, Card, Input, Text)
│   │   └── common/    # Common components (CourseCard, etc.)
│   ├── config/        # App configuration and constants
│   ├── hooks/         # Custom React hooks
│   ├── navigation/    # Navigation setup (Tab & Stack navigators)
│   ├── screens/       # Screen components
│   │   ├── Auth/      # Authentication screen
│   │   ├── Home/      # Home screen
│   │   ├── Courses/   # Courses list screen
│   │   ├── CourseDetails/  # Course details screen
│   │   ├── Profile/   # Profile screen
│   │   └── Points/    # Points dashboard screen
│   ├── services/      # API services
│   ├── theme/         # Theme configuration (colors, typography, spacing)
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── App.tsx           # Root app component
├── babel.config.js   # Babel configuration
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the mobile directory:
```bash
cd SafuAcademy/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Set `EXPO_PUBLIC_API_URL` to your backend API URL
   - Set `EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID` to your WalletConnect project ID

### Running the App

Start the Expo development server:
```bash
npm start
```

This will open Expo DevTools in your browser. You can then:

- **Run on iOS**: Press `i` or scan QR code with Camera app (iOS 11+)
- **Run on Android**: Press `a` or scan QR code with Expo Go app
- **Run on Web**: Press `w` (requires additional web support)

### Platform-Specific Commands

```bash
# Run on Android emulator/device
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run on web
npm run web
```

## Configuration

### Environment Variables

Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=http://your-api-url:3000
EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### API Integration

The app connects to the SafuAcademy backend API. Make sure the backend is running and accessible from your mobile device.

For local development:
- Use your computer's local IP address (e.g., `http://192.168.1.100:3000`)
- Ensure your mobile device is on the same network
- Don't use `localhost` as it refers to the mobile device, not your computer

## Features Implementation Status

### ✅ Completed
- Project setup and configuration
- TypeScript and path aliases
- Theme system (dark/light mode)
- API client with React Query integration
- Core UI components (Button, Card, Input, Text)
- Navigation structure (Tab + Stack navigators)
- Authentication flow (placeholder)
- Home screen with featured courses
- Courses screen with search
- Course details screen
- Profile screen
- Points dashboard screen

### 🚧 In Progress
- Wallet connection with WalletConnect
- Video player integration
- Quiz functionality
- Certificates screen
- Complete Web3 integration

### 📋 Planned
- Offline course downloads
- Push notifications
- AI Chat tutor integration
- Social sharing features

## Architecture

### State Management
- **React Query**: Server state management for API data
- **AsyncStorage**: Local persistence for auth tokens and settings
- **React Context**: Theme and global UI state

### Navigation Flow
```
RootNavigator
  ├── AuthScreen (if not authenticated)
  └── TabNavigator (if authenticated)
      ├── HomeTab (Stack)
      │   ├── Home
      │   └── CourseDetails
      ├── CoursesTab (Stack)
      │   ├── CoursesList
      │   └── CourseDetails
      ├── PointsTab
      └── ProfileTab
```

### API Services
- `authService`: Authentication and user session
- `courseService`: Course management and enrollment
- `lessonService`: Lesson progress and videos
- `userService`: User profile and stats

## Customization

### Theme
Edit `src/theme/colors.ts` to customize the color scheme:
```typescript
export const Colors = {
  light: { ... },
  dark: { ... }
}
```

### Typography
Edit `src/theme/typography.ts` to adjust font sizes and styles.

### Spacing
Edit `src/theme/spacing.ts` to modify spacing and layout values.

## Building for Production

### Android

```bash
# Build APK
expo build:android -t apk

# Build AAB (for Play Store)
expo build:android -t app-bundle
```

### iOS

```bash
# Build IPA (requires Apple Developer account)
expo build:ios
```

### EAS Build (Recommended)

Install EAS CLI:
```bash
npm install -g eas-cli
```

Configure and build:
```bash
eas build:configure
eas build --platform android
eas build --platform ios
```

## Troubleshooting

### Metro bundler issues
```bash
# Clear cache and restart
npx expo start -c
```

### Module resolution errors
```bash
# Clear watchman cache
watchman watch-del-all

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules && npm install
```

### iOS build issues
```bash
# Clear iOS build folder
cd ios && rm -rf build && cd ..

# Reinstall pods (if using bare workflow)
cd ios && pod install && cd ..
```

## Contributing

When contributing to the mobile app:

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test on both iOS and Android
5. Update this README if adding new features or dependencies

## Dependencies

Key dependencies:
- `react-native`: Core framework
- `expo`: Development platform
- `@react-navigation`: Navigation library
- `@tanstack/react-query`: Data fetching and caching
- `axios`: HTTP client
- `@walletconnect/modal-react-native`: Wallet connection
- `viem` & `ethers`: Blockchain interaction
- `expo-av`: Video playback
- `@react-native-async-storage/async-storage`: Local storage
- `react-native-reanimated`: Animations

## License

This project is part of the SafuAcademy platform.

## Support

For issues or questions:
- Check the main SafuAcademy documentation
- Create an issue in the repository
- Contact the development team
