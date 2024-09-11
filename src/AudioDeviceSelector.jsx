import { useEffect, useState } from 'react';

const AudioDeviceSelector = () => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  useEffect(() => {
    // Fetch available audio output devices (speakers/headphones)
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setAudioDevices(audioOutputs);
      })
      .catch(error => console.error('Error fetching devices:', error));
  }, []);

  // Function to set the audio output device
  const setAudioOutput = (element, deviceId) => {
    if (typeof element.sinkId !== 'undefined') {
      element.setSinkId(deviceId)
        .then(() => {
          console.log(`Audio output set to device: ${deviceId}`);
        })
        .catch(error => {
          console.error('Error setting audio output:', error);
        });
    } else {
      console.warn('Your browser does not support output device selection.');
    }
  };

  const handleDeviceChange = (event) => {
    const deviceId = event.target.value;
    setSelectedDeviceId(deviceId);

    // Assuming there's an audio element with the id 'audioElement'
    const audioElement = document.getElementById('audioElement');
    setAudioOutput(audioElement, deviceId);
  };

  return (
    <div>
      <h1>Select Speakers/Headphones</h1>
      <select value={selectedDeviceId} onChange={handleDeviceChange}>
        <option value="">Select Output Device</option>
        {audioDevices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Output Device (${device.deviceId})`}
          </option>
        ))}
      </select>

      {/* Example audio element to demonstrate output selection */}
      <audio id="audioElement" controls>
        <source src="your-audio-file.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioDeviceSelector;
