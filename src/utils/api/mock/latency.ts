const MIN = 150;
const MAX = 300;

export function wait(ms?: number) {
  const delay = ms ?? MIN + Math.random() * (MAX - MIN);
  return new Promise<void>((resolve) => setTimeout(resolve, delay));
}
