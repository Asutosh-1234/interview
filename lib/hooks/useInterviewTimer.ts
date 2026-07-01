import { useState, useEffect } from "react";

export function useInterviewTimer(
  duration: number,
  isEnabled: boolean,
  onExpired: () => void
) {
  const [timeLeft, setTimeLeft] = useState<number>(duration);

  useEffect(() => {
    if (duration <= 0 || !isEnabled) return;

    setTimeLeft(duration);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, isEnabled, onExpired]);

  return timeLeft;
}
