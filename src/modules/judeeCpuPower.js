import { getLocalStorage, setLocalStorage } from "./localStrageOprations";

const measurePiCalculation = (durationMs = 5000) => {
  const startTime = Date.now();
  let pi = 0;
  let sign = 1;
  let divisor = 1;
  let iterations = 0;

  while (Date.now() - startTime < durationMs) {
      pi += (sign * 4) / divisor;
      divisor += 2;
      sign *= -1;
      iterations++;
  }

  return {
      pi,
      iterations
  };
}
const cpuPower = 'cpuPower';
export const judeeCpuPower = (threshold = 149946643 / 5) => {
  if (getLocalStorage(cpuPower)){
    const v = parseInt(getLocalStorage(cpuPower));
    return v > threshold;
  }
  else {
    const v = measurePiCalculation().iterations;
    setLocalStorage(cpuPower, v);
    return getLocalStorage(cpuPower) > threshold;
  }
}