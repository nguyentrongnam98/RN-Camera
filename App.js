import React, {PureComponent, useRef, useState, useFocusEffect} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import ImageResizer from 'react-native-image-resizer';

import ImgDetec from "./images/image-detext-face3.png";
const widthDevice = Dimensions.get('window').width;
let flag = null;
const App = () => {

  const cameraRef = useRef(null);
  const [faceDetectionEnabled, setEnableFace] = useState(true);
  const [imgBase64, setImgBase64] = useState(null);
  const [faces, setFaces] = useState([]);
  const [cameraViewSize, setCameraViewSize] = useState(null);
  // useFocusEffect(
  //   React.useCallback(() => {
  //     getUserData('ACTIVE');
  //     setEnableFace(true);
  //     setImgBase64(null);
  //     flag = null;
  //   }, []),
  // );

  const checkPointInsideRectange = pointCheck => {
    let rightCamera = {
      x: cameraViewSize.x + cameraViewSize.width,
      y: cameraViewSize.y + cameraViewSize.height - cameraViewSize.width / 10,
    };

    let leftCamera = {
      x: cameraViewSize.x,
      y: cameraViewSize.y + cameraViewSize.width / 10,
    };

    let conditionOne =
      (pointCheck.x - leftCamera.x) / (rightCamera.x - leftCamera.x) >= 0 &&
      (pointCheck.x - leftCamera.x) / (rightCamera.x - leftCamera.x) <= 1;
    let conditionTwo =
      (pointCheck.y - leftCamera.y) / (rightCamera.y - leftCamera.y) >= 0 &&
      (pointCheck.y - leftCamera.y) / (rightCamera.y - leftCamera.y) <= 1;

    if (conditionOne && conditionTwo) {
      return true;
    } else {
      return false;
    }
  };
  const checkFaceInsideCamera = faceIdPosition => {
    let rightFace = {
      x: faceIdPosition.origin.x + faceIdPosition.size.width,
      y: faceIdPosition.origin.y + faceIdPosition.size.height,
    };

    let leftFace = {
      x: faceIdPosition.origin.x,
      y: faceIdPosition.origin.y,
    };

    let topFace = {
      x: faceIdPosition.origin.x + faceIdPosition.size.width,
      y: faceIdPosition.origin.y,
    };

    let bottomFace = {
      x: faceIdPosition.origin.x,
      y: faceIdPosition.origin.y + faceIdPosition.size.height,
    };

    if (
      checkPointInsideRectange(rightFace) &&
      checkPointInsideRectange(leftFace) &&
      checkPointInsideRectange(topFace) &&
      checkPointInsideRectange(bottomFace)
    ) {
      return true;
    } else {
      return false;
    }
  };
  const onFacesDetected = ({faces}) => {
    setFaces(faces);
    if (!flag && faces?.length == 1) {
      flag = new Date();
    }
    if (flag && new Date().getTime() - flag.getTime() < 2000) {
      return;
    }
    if (faces?.length === 1 && checkFaceInsideCamera(faces[0].bounds)) {
      takePicture();
      setEnableFace(false);
    } else {
      // show warning detect facial
    }
  };
  const takePicture = async () => {
    let arrayImage = [];
    if (interval) {
        clearInterval(interval)
    }
    const options = { quality: 1, base64: true, width: widthDevice * 0.9 };
    interval = setInterval(async function () {
        if (!imgBase64) {

            let data = await cameraRef.current.takePictureAsync(options);
            setImgBase64(data.base64)
            let reSizeImage = await ImageResizer.createResizedImage(data.uri, 256, 256, "JPEG", 100, 0);
            let base64String = await ImgToBase64.getBase64String(reSizeImage.uri)
            arrayImage.push(base64String)
            console.log('arrImg', arrayImage);
        }
        if (arrayImage.length == numberImageVerify) {
            let currentDateTime = getLocalTime();
            clearInterval(interval)
            // set image random
            setLoadingVerify(true)
            // call API verify
            if(isAdmin){
                verifyAdminFacialId(currentDateTime, arrayImage).then(res => {

                    storageUserAdmin(res.data);
                    
                    setConfirm(true);
                    setLoadingConfirm(false);
                    setConfirmSuccess(true);
                    setLoadingVerify(false);

                 })
                .catch(() =>{
                    setImgBase64(null);
                    setPopupReVerify(true);
                    setEnableFace(false);
                    setLoadingVerify(false);
                })
            }else{
                dispatch(verifyFaceId(currentDateTime, arrayImage, onSuccess, onError))
            }   
        }
    }, 2000)
    console.log('arrayImg',arrayImage);

}
  const renderFace = ({bounds, faceID, rollAngle, yawAngle}) => (
    <View
      key={faceID}
      style={[
        {
          transform: [{perspective: 600}],
        },
        {
          ...bounds.size,
          left: bounds.origin.x,
          top: bounds.origin.y,
        },
      ]}>
      <Image
        source={ImgDetec}
        style={{width: '100%', height: '100%', resizeMode: 'contain'}}
      />
    </View>
  );
  const renderFaces = () => (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        top: 0,
      }}
      pointerEvents="none">
      {faces.map(renderFace)}
    </View>
  );
  return (
    <View style={styles.container}>
    <View style={{ flex: 1 }}>
        <View style={styles.settingPosition}>
        </View>
        <View style={styles.containerClock}>
            {/* { isAdmin
            ? <View>
                <Text style={styles.textAdminLogin}>Login For Admin</Text>
                <TouchableOpacity style={styles.buttonToFacial} onPress={() => navigation.dispatch( StackActions.replace("Facial") )}>
                    <Icon name={"arrow-left"} size={18} color={'#ED2121'} />
                    <Text style={styles.textFacialID}>Login For Employee</Text>
                </TouchableOpacity>
            </View>
            : <ClockComponent/>} */}
        </View>
        <View style={styles.containerForm}>
            <Text style={styles.textNoteStyle}>LOOK</Text>
            <View style={styles.cameraContainer}>
                <RNCamera
                    onLayout={event => {
                        const layout = event.nativeEvent.layout;
                        setCameraViewSize(layout)
                    }}
                    ref={cameraRef}
                    onCameraReady={() => setEnableFace(true)}
                    trackingEnabled
                    playSoundOnCapture={false}
                    faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
                    captureAudio={false}
                    ratio={'1:1'}
                    type={RNCamera.Constants.Type.front}
                    flashMode={RNCamera.Constants.FlashMode.off}
                    style={styles.preview}
                    onFacesDetected={faceDetectionEnabled ? onFacesDetected : undefined}
                    faceDetectionLandmarks={
                        RNCamera.Constants.FaceDetection.Landmarks
                            ? RNCamera.Constants.FaceDetection.Landmarks.all
                            : undefined
                    }>
                    {!!faceDetectionEnabled && renderFaces()}
                </RNCamera>
            </View>
            <View style={styles.actionContainer}>
                <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigateStaffPinScreen()}>
                    {/* <Image source={Assets.Images.staffPinWhiteIcon} style={{ width: 70, height: 70 }} /> */}
                </TouchableOpacity>

                <TouchableOpacity style={{ marginLeft: 10 }}>
                    {/* <Image source={Assets.Images.facialIdGreenIcon} style={{ width: 70, height: 70 }} /> */}
                </TouchableOpacity>
            </View>
        </View>
    </View>
    {
      null
    }

    {
       null
    }

    {
       null
    }
    {
      null
    }
</View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      position: 'relative',
  },
  containerClock: {
      flex: 1,
      justifyContent: 'center',
  },
  containerForm: {
      flex: 5,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      width:500,
      height:500
  },
  cameraContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: '#ED2121',
      borderWidth: 2,
      borderRadius: 5,
      overflow: 'hidden',
      width:5000,
      height:500
  },
  confirmContainer: {
      zIndex: 2,
      width: "100%",
      height: "100%",
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: "rgba(52,52,52, 0.9)",
  },
  closeContainer: {
      position: 'absolute',
      right: 0,
      top: 0
  },
  buttonToFacial: {
      position: 'absolute',
      left: 15,
      top: 45,
      flexDirection: 'row',
      padding: 3,
      borderRadius: 4,
      alignItems: 'center',
      backgroundColor: '#ED2121',
  },
  buttonCloseStyle: {
      paddingHorizontal: 15,
      paddingVertical: 10
  },
  buttonCloseMessage: {
    alignSelf: "flex-end",
  },
  preview: {
      width: 0.9 * widthDevice,
      height: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
  },
  androidCameraContainer: {
      width: '80%',
      height: '100%'
  },
  iosCameraContainer: {
      width: '100%',
      height: '100%'
  },
  textAdminLogin: {
      fontSize: 26,
      color: '#ED2121',
      alignSelf: 'center',
  },
  textFacialID: {
      fontSize: 17,
      color: '#ED2121',
      marginHorizontal: 10,
  },
  textNoteStyle: {
      marginVertical: 10,
      fontSize: 15,
      color: '#ED2121',
      height: 20,
      flex: 1,
  },
  actionContainer: {
      flexDirection: 'row',
      minHeight: 90,
      justifyContent: 'center',
      alignItems: 'center',
  },
  loadingViewStyle: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      position: 'absolute',
      justifyContent: 'center',
      backgroundColor: "rgba(52,52,52, 0.7)",
  },
  loadingStyle: {
      padding: 30,
      borderRadius: 10,
      backgroundColor: '#ED2121',
  },
  popupReConfirmVerify: {
      height: 'auto',
      width: 0.9 * widthDevice,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      borderRadius: 10,
      backgroundColor: '#ED2121',
  },
  iconViewStyle: {
      borderWidth: 15,
      justifyContent: 'center',
      alignItems: 'center',
      width: 200,
      height: 200,
      borderRadius: 100
  },
  actionConfirmPopupContainer: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
  },
  usePinTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ED2121'
  },
  cancelButtonTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ED2121'
  },
  tryAgainTextStyle: {
      fontSize: 14,
      fontWeight: 'bold',
      color:'#ED2121'
  },
  messageStyle: {
      marginVertical: 10,
      textAlign: 'center',
      fontWeight: '600'
  },
  settingPosition: {
      position: "absolute",
      left: 5,
      top: 5,
      zIndex: 10,
  },
  cancelButtonStyle: {
      backgroundColor: '#ED2121',
      width: '40%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5,
      marginRight: 10,
      paddingVertical: 8
  },
  okButtonStyle: {
      width: '40%',
      backgroundColor: '#ED2121',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 5
  }
})
export default App;
