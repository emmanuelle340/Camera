import React, {useRef, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Video from 'react-native-video';

const App = () => {
  const cameraRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState(RNCamera.Constants.Type.back);
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);
      setPhotoUri(data.uri);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      const options = {
        maxDuration: 60,
        quality: RNCamera.Constants.VideoQuality['1080p'],
      };
      const data = await cameraRef.current.recordAsync(options);
      setVideoUri(data.uri);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleCameraType = () => {
    setCameraType((prevType: any) =>
      prevType === RNCamera.Constants.Type.back
        ? RNCamera.Constants.Type.front
        : RNCamera.Constants.Type.back,
    );
  };

  const requestExternalStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permission to save media',
          message: 'We need your permission to save the media to your gallery',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else if (Platform.OS === 'ios') {
      const status = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (status !== RESULTS.GRANTED) {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return result === RESULTS.GRANTED;
      }
      return true;
    }
    return false;
  };

  const saveMedia = async (uri: string, type: string) => {
    const hasPermission = await requestExternalStoragePermission();
    if (!hasPermission) {
      console.error('Permission denied');
      return;
    }

    const extension = type === 'photo' ? 'jpg' : 'mp4';
    const destPath = `${
      RNFS.PicturesDirectoryPath
    }/media_${Date.now()}.${extension}`;
    try {
      await RNFS.moveFile(uri, destPath);
      console.log(`${type} saved to gallery:`, destPath);
      if (type === 'photo') {
        setPhotoUri(null);
      } else {
        setVideoUri(null);
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  };

  const cancelMedia = (type) => {
    if (type === 'photo') {
      setPhotoUri(null);
    } else {
      setVideoUri(null);
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{uri: photoUri}} style={styles.preview} />
          <View style={styles.buttonContainer}>
            {/* <TouchableOpacity
              onPress={() => editPhoto(photoUri)}
              style={styles.button}>
              <Icon name="edit" size={30} color="#fff" />
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() => saveMedia(photoUri, 'photo')}
              style={styles.button}>
              <Icon name="save" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => cancelMedia('photo')}
              style={styles.button}>
              <Icon name="cancel" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : videoUri ? (
        <View style={styles.previewContainer}>
          <Video
            source={{uri: videoUri}}
            style={styles.preview}
            controls={true}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => saveMedia(videoUri, 'video')}
              style={styles.button}>
              <Icon name="save" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => cancelMedia('video')}
              style={styles.button}>
              <Icon name="cancel" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <RNCamera
            ref={cameraRef}
            style={styles.preview}
            type={cameraType}
            flashMode={RNCamera.Constants.FlashMode.off}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }}
            androidRecordAudioPermissionOptions={{
              title: 'Permission to use audio recording',
              message: 'We need your permission to use your microphone',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={takePicture} style={styles.button}>
              <Icon name="camera" size={30} color="#fff" />
            </TouchableOpacity>
            {isRecording ? (
              <TouchableOpacity onPress={stopRecording} style={styles.button}>
                <Icon name="stop" size={30} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={startRecording} style={styles.button}>
                <Icon name="videocam" size={30} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleCameraType} style={styles.button}>
              <Icon name="switch-camera" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '80%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
  },
  button: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
});

export default App;
