import "./App.css";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

function App() {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const pausedTime = useRef(0);

  const animate = useCallback(() => {
    if (startTime.current === null) return;

    const elapsedTime = Date.now() - startTime.current + pausedTime.current;
    setTime(elapsedTime);

    animationFrameId.current = requestAnimationFrame(animate);
  }, []);

  const handleStartStop = () => {
    if (isActive) {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
      pausedTime.current = time;
    } else {
      startTime.current = Date.now();
      animationFrameId.current = requestAnimationFrame(animate);
    }
    setIsActive(!isActive);
  };

  const handleLap = () => {
    if (!isActive) return;
    setLaps((prevLaps) => [...prevLaps, time]);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
    setLaps([]);
    if (animationFrameId.current)
      cancelAnimationFrame(animationFrameId.current);
    animationFrameId.current = null;
    startTime.current = null;
    pausedTime.current = 0;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono">
      <div className="text-8xl font-bold mb-8">
        <span>{formatTime(time)}</span>
      </div>
      <div className="space-x-4 mb-3">
        <Button onClick={handleLap} disabled={!isActive && time === 0}>
          ラップ
        </Button>
        <Button onClick={handleStartStop} className="w-24">
          {isActive ? "ストップ" : "スタート"}
        </Button>
        <Button onClick={handleReset} disabled={isActive || time === 0}>
          リセット
        </Button>
      </div>

      <div className="w-80 h-64 overflow-y-auto bg-gray-800 rounded-lg p-4">
        <ul className="space-y-2">
          {laps.map((lap, index) => (
            <li key={index} className="flex justify-center text-lg space-x-6">
              <span>Lap {index + 1}</span>
              <span>{formatTime(lap)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
