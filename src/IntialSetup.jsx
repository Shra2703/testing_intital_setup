import { useState, useEffect } from 'react';

const DeviceSetup = () => {
  const [devices, setDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);

  // Get available devices on component mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices);
    });
  }, []);

  // Initialize AudioContext for microphone testing
  useEffect(() => {
    if (selectedMic) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(audioCtx);
      startMicTest(audioCtx);
    }
  }, [selectedMic]);

  // Function to test microphone input and display audio levels
  const startMicTest = async (audioCtx) => {
    try {
      if (selectedMic) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedMic } },
        });

        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMicLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const level = Math.max(...dataArray);
          setMicrophoneLevel(level);
          requestAnimationFrame(updateMicLevel);
        };

        updateMicLevel();
      } else {
        console.error('Microphone not selected');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Test speaker with a sample sound
  const testSpeaker = () => {
    if (selectedSpeaker) {
      const audio = new Audio('/test-sound.mp3'); // path to a sample audio file
      audio.setSinkId(selectedSpeaker).then(() => {
        audio.play();
      }).catch((error) => console.error('Error setting speaker device:', error));
    } else {
      console.error('Speaker not selected');
    }
  };

  // Show video from the selected camera
  const startCameraPreview = async () => {
    if (selectedCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedCamera } },
        });
        const videoElement = document.getElementById('cameraPreview');
        videoElement.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    } else {
      console.error('Camera not selected');
    }
  };

  return (
    <div>
      <h2>Setup Camera, Microphone, and Speaker</h2>

      {/* Camera selection */}
      <div>
        <label>Select Camera:</label>
        <select onChange={(e) => setSelectedCamera(e.target.value)}>
          <option value="">Choose Camera</option>
          {devices.filter((device) => device.kind === 'videoinput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
        <button onClick={startCameraPreview}>Start Camera</button>
      </div>
      <video id="cameraPreview" width="400" autoPlay />

      {/* Microphone selection */}
      <div>
        <label>Select Microphone:</label>
        <select onChange={(e) => setSelectedMic(e.target.value)}>
          <option value="">Choose Microphone</option>
          {devices.filter((device) => device.kind === 'audioinput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </option>
          ))}
        </select>

        {/* Audio level indicator */}
        <div>
          <label>Microphone Level:</label>
          <div style={{ width: '100px', height: '10px', background: 'gray' }}>
            <div style={{ width: `${microphoneLevel}%`, height: '10px', background: 'green' }} />
          </div>
        </div>
      </div>

      {/* Speaker selection */}
      <div>
        <label>Select Speaker (Headphones):</label>
        <select onChange={(e) => setSelectedSpeaker(e.target.value)}>
          <option value="">Choose Speaker</option>
          {devices.filter((device) => device.kind === 'audiooutput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${device.deviceId}`}
            </option>
          ))}
        </select>
        <button onClick={testSpeaker}>Test Speaker</button>
      </div>
    </div>
  );
};

export default DeviceSetup;
