/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';

const DeviceSetup = () => {
  const [devices, setDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [error, setError] = useState(null);

  // Request permissions and fetch devices on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request both camera and microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        // Fetch and list devices after permissions are granted
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);

        // Automatically select the first available microphone and camera
        const defaultMic = deviceList.find((device) => device.kind === 'audioinput');
        const defaultCamera = deviceList.find((device) => device.kind === 'videoinput');

        setSelectedMic(defaultMic?.deviceId || null);
        setSelectedCamera(defaultCamera?.deviceId || null);

        console.log('Media stream granted:', stream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Unable to access camera or microphone. Please check your permissions.');
      }
    };

    requestPermissions();
  }, []);

  // Initialize AudioContext and start mic test if a microphone is selected
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
        setError('Please select a microphone.');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone. Please check your permissions.');
    }
  };

  // Function to start camera preview
  useEffect(() => {
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
          setError('Error accessing camera. Please check your permissions.');
        }
      }
    };

    startCameraPreview();
  }, [selectedCamera]);

  return (
    <div>
      <h2>Setup Camera, Microphone, and Speaker</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Camera selection */}
      <div>
        <label>Select Camera:</label>
        <select value={selectedCamera || ''} onChange={(e) => setSelectedCamera(e.target.value)}>
          {devices.filter((device) => device.kind === 'videoinput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
      <video id="cameraPreview" width="400" autoPlay />

      {/* Microphone selection */}
      <div>
        <label>Select Microphone:</label>
        <select value={selectedMic || ''} onChange={(e) => setSelectedMic(e.target.value)}>
          {devices.filter((device) => device.kind === 'audioinput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </option>
          ))}
        </select>

        {/* Audio level indicator */}
        <div style={{ width: '200px', height: '20px', background: '#ccc', position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              width: `${microphoneLevel}%`,
              height: '100%',
              background: microphoneLevel > 5 ? 'green' : 'gray', // Fluctuates green when detecting sound, gray when silent
              position: 'absolute',
              left: 0,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      </div>
      

      {/* Speaker selection */}
      <div>
        <label>Select Speaker (Headphones):</label>
        <select value={selectedSpeaker || ''} onChange={(e) => setSelectedSpeaker(e.target.value)}>
          {devices.filter((device) => device.kind === 'audiooutput').map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DeviceSetup;
