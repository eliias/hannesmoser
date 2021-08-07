const baseSize = 2;
const maxSize = 8;
const numSizes = 6;
const factor = (maxSize - baseSize) / (numSizes - 1);

const sizes = Array.from({ length: 6 })
  .map<number>((_, index) => baseSize + index * factor)
  .reverse();

const colors = {
  highlight: "var(--color-highlight)",
  inverted: "white",
  muted: "#6D6D6D",
  primary: "black",
};

export const theme = {
  colors,
  baseSize,
  sizes,
};
