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

  return (
    <div>
      <div>
        <span>{formatTime(time)}</span>
      </div>
      <div>
        <Button>ラップ</Button>
        <Button>{isActive ? "ストップ" : "スタート"}</Button>
        <Button>リセット</Button>
      </div>

      <div>
        <ul>
          {laps.map((lap, index) => (
            <li key={index}>
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
