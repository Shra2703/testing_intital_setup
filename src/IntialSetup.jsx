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

  // Fetch available devices and automatically select the first available devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);

        // Automatically select the first available microphone, camera, and speaker
        const firstMic = deviceList.find((device) => device.kind === 'audioinput');
        const firstCamera = deviceList.find((device) => device.kind === 'videoinput');
        const firstSpeaker = deviceList.find((device) => device.kind === 'audiooutput');

        if (firstMic) setSelectedMic(firstMic.deviceId);
        if (firstCamera) setSelectedCamera(firstCamera.deviceId);
        if (firstSpeaker) setSelectedSpeaker(firstSpeaker.deviceId);
      } catch (err) {
        console.error('Error enumerating devices:', err);
        setError('Unable to fetch devices. Please check your browser settings.');
      }
    };

    fetchDevices();
  }, []);

  // Automatically start the camera preview when the selectedCamera changes
  useEffect(() => {
    if (selectedCamera) {
      startCameraPreview();
    }
  }, [selectedCamera]);

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
          let level = Math.max(...dataArray);

          // Normalize the level to a percentage between 0 and 100
          level = Math.min(100, (level / 255) * 100);
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
      const audio = new Audio('/test-sound2.mp3');
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

      <div>
        <label>Select Camera:</label>
        <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
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
            <select value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)}>
              {devices.filter((device) => device.kind === 'audioinput').map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId}`}
                </option>
              ))}
            </select>

        {/* Microphone level indicator */}
        <div style={{ width: '200px', height: '20px', background: '#ccc', position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'green',
              position: 'absolute',
              left: `-${microphoneLevel}%`,
              transition: 'left 0.1s linear',
            }}
          />
        </div>
      </div>

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
    </div>
  );
};

export default DeviceSetup;
