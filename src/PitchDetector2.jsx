/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { PitchDetector } from 'pitchfinder';

const PitchDetectionApp = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [lowPitchThreshold, setLowPitchThreshold] = useState(100); // Initial threshold
  const [calibratedThreshold, setCalibratedThreshold] = useState(150);
  const [pitchLevel, setPitchLevel] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [avgPitch, setAvgPitch] = useState(null);
  const detectPitch = useRef(PitchDetector.forFloat32Array());

  useEffect(() => {
    // Setup Audio Context
    const initAudio = async () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(audioCtx);

      // Get the audio stream from the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(stream);

      // Setup high-pass filter to remove background noise
      const filteredSource = setupHighPassFilter(audioCtx, source);

      // Setup analyser
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      setAnalyser(analyserNode);
      filteredSource.connect(analyserNode);

      // Start calibration
      calibrateMicrophone(analyserNode);
    };

    initAudio();
  }, []);

  // High-pass filter to remove low-frequency noise (e.g., below 50 Hz)
  const setupHighPassFilter = (audioCtx, source) => {
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(50, audioCtx.currentTime); // Filter out noise below 50 Hz
    source.connect(filter);
    return filter;
  };

  // Calibrate microphone by adjusting the threshold based on the user's voice
  const calibrateMicrophone = (analyser) => {
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    let pitchSum = 0;
    let samples = 0;

    const calibrate = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const pitch = detectPitch.current(dataArray);
      if (pitch) {
        pitchSum += pitch;
        samples += 1;
      }

      if (samples < 100) {
        // Calibrate for 100 samples (~1-2 seconds)
        requestAnimationFrame(calibrate);
      } else {
        const avgPitch = pitchSum / samples;
        const adjustedThreshold = Math.max(avgPitch * 0.8, 100); // Set to 80% of avg or min 100 Hz
        setCalibratedThreshold(adjustedThreshold);
        setIsCalibrating(false);
      }
    };

    calibrate();
  };

  const processAudio = () => {
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    let pitchSum = 0;
    let samples = 0;

    const process = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const pitch = detectPitch.current(dataArray);

      if (pitch) {
        pitchSum += pitch;
        samples += 1;
        const currentAvgPitch = pitchSum / samples;

        if (!avgPitch) {
          setAvgPitch(currentAvgPitch);
        }

        const pitchDeviation = Math.abs(pitch - avgPitch) / avgPitch;

        if (pitchDeviation > 0.2) {
          setWarningMessage('Pitch deviation too high!');
        } else if (pitch < lowPitchThreshold) {
          setWarningMessage('Your pitch is too low!');
        } else {
          setWarningMessage('');
        }

        setPitchLevel(Math.min((pitch / 500) * 100, 100)); // Normalize for bar fluctuation
      }

      requestAnimationFrame(process);
    };

    process();
  };

  useEffect(() => {
    if (analyser && !isCalibrating) {
      processAudio();
    }
  }, [analyser, isCalibrating]);

  return (
    <div>
      <h1>Pitch Detection App</h1>
      {isCalibrating ? (
        <p>Calibrating microphone... Please speak normally.</p>
      ) : (
        <>
          <div style={{ width: '300px', height: '30px', backgroundColor: '#eee', marginBottom: '10px' }}>
            <div
              style={{
                width: `${pitchLevel}%`,
                height: '100%',
                backgroundColor: pitchLevel < 50 ? 'red' : 'green',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <p>{warningMessage}</p>
          <label>Low Pitch Threshold: {lowPitchThreshold} Hz</label>
          <input
            type="range"
            min="50"
            max="300"
            value={lowPitchThreshold}
            onChange={(e) => setLowPitchThreshold(Number(e.target.value))}
          />
        </>
      )}
    </div>
  );
};

export default PitchDetectionApp;
