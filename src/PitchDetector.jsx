import React, { useEffect, useState } from "react";
import PitchFinder from "pitchfinder";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title);

const PitchDetector = () => {
  const [pitch, setPitch] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [warning, setWarning] = useState("");
  const [data, setData] = useState({
    labels: ['Pitch'],
    datasets: [{
      label: 'Detected Pitch (Hz)',
      data: [0],
      backgroundColor: 'rgba(75,192,192,0.6)',
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 0,
    }]
  });

  const LOW_PITCH_THRESHOLD = 17600; // Example threshold
  const detector = PitchFinder.YIN();

  // Use React ref to hold the AudioContext and related nodes
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const microphoneRef = React.useRef(null);
  const scriptProcessorRef = React.useRef(null);

  const detectPitch = (event) => {
    const buffer = event.inputBuffer.getChannelData(0);
    const pitch = detector(buffer);
    if (pitch) {
      const roundedPitch = Math.round(pitch);
      setPitch(roundedPitch);
      updateGraph(roundedPitch);
      if (roundedPitch < LOW_PITCH_THRESHOLD) {
        setWarning("Please speak in a higher pitch.");
      } else {
        setWarning("");
      }
    } else {
      setPitch(null);
      setWarning("");
    }
  };

  const updateGraph = (pitchValue) => {
    setData((prevData) => ({
      ...prevData,
      datasets: [
        {
          ...prevData.datasets[0],
          data: [pitchValue],
        },
      ],
    }));
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      scriptProcessor.onaudioprocess = detectPitch;

      // Store references to be used later for cleanup
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      scriptProcessorRef.current = scriptProcessor;

      setIsListening(true);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        alert("Microphone access is required for pitch detection.");
      } else {
        console.error("Error accessing microphone", err);
      }
    }
  };

  const stopListening = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current.disconnect();
    }
    if (microphoneRef.current) microphoneRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    scriptProcessorRef.current = null;
    microphoneRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;

    setIsListening(false);
    setPitch(null);
    setWarning("");
  };

  useEffect(() => {
    // Clean up on component unmount
    return () => {
      stopListening();
    };
  }, []);

  const handleStartStop = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Pitch Detection App</h1>
      <button
        onClick={handleStartStop}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
      {pitch !== null && (
        <div style={{ marginTop: "20px", fontSize: "24px" }}>
          Detected Pitch: <strong>{pitch} Hz</strong>
        </div>
      )}
      {warning && (
        <div style={{ marginTop: "10px", color: "red", fontSize: "18px" }}>
          {warning}
        </div>
      )}
      <div style={{ marginTop: '20px', width: '20px', height: '200px', margin: 'auto' }}>
        <Bar
          data={data}
          options={{
            indexAxis: "x",
            scales: {
              x: {
                display: false,
                beginAtZero: true,
                suggestedMax: 1000,
              },
              y: {
                display: false,
              },
            },
            elements: {
              bar: {
                borderWidth: 0,
                barPercentage: 0.5, // Narrower bar width
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  );
};

export default PitchDetector;
