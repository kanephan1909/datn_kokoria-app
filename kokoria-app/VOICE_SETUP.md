# Voice Recognition Setup

Để sử dụng chức năng voice recognition đầy đủ, bạn cần cài đặt package `@react-native-voice/voice`.

## Cài đặt

```bash
npm install @react-native-voice/voice
# hoặc
yarn add @react-native-voice/voice
```

## Android Setup

Thêm permission vào `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## iOS Setup

Thêm vào `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>App needs access to microphone for voice search</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>App needs access to speech recognition for voice search</string>
```

## Sử dụng

Sau khi cài đặt, mở file `src/hooks/useVoiceRecognition.ts` và uncomment phần code sử dụng `@react-native-voice/voice`, đồng thời xóa phần mock implementation.

