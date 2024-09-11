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
  const [permissionsGranted, setPermissionsGranted] = useState(false); 

  // Fetch devices and set default ones
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Request camera and microphone access
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Set permissions granted flag to true after permissions are granted
        setPermissionsGranted(true);

        // Fetch device list
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);

        // Automatically select the first camera, microphone, and speaker as default
        const defaultMic = deviceList.find(device => device.kind === 'audioinput');
        const defaultCamera = deviceList.find(device => device.kind === 'videoinput');
        const defaultSpeaker = deviceList.find(device => device.kind === 'audiooutput');

        // Set default selections
        if (defaultMic) setSelectedMic(defaultMic.deviceId);
        if (defaultCamera) setSelectedCamera(defaultCamera.deviceId);
        if (defaultSpeaker) setSelectedSpeaker(defaultSpeaker.deviceId);

      } catch (err) {
        console.error('Error accessing devices:', err);
        setError('Permissions denied. Please allow access to your camera and microphone.');
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedMic) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(audioCtx);
      startMicTest(audioCtx);
    }
  }, [selectedMic]);

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

  const testSpeaker = () => {
    if (selectedSpeaker) {
      const audio = new Audio('/test-sound.mp3'); 
      audio.setSinkId(selectedSpeaker)
        .then(() => {
          audio.play();
        })
        .catch((error) => {
          console.error('Error setting speaker device:', error);
          setError('Error playing test sound. Please check your speaker settings.');
        });
    } else {
      console.error('Speaker not selected');
      setError('Please select a speaker.');
    }
  };

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
    } else {
      console.error('Camera not selected');
      setError('Please select a camera.');
    }
  };

  return (
    <div>
      <h2>Setup Camera, Microphone, and Speaker</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!permissionsGranted && <p>Requesting camera and microphone permissions...</p>}

      {permissionsGranted && (
        <>
          {/* Camera selection */}
          <div>
            <label>Select Camera:</label>
            <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
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
            <select value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)}>
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
            <select value={selectedSpeaker} onChange={(e) => setSelectedSpeaker(e.target.value)}>
              {devices.filter((device) => device.kind === 'audiooutput').map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId}`}
                </option>
              ))}
            </select>
            <button onClick={testSpeaker}>Test Speaker</button>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceSetup;
