/** Count-up display. Decimals are kept only when the target number has them. */
export const formatStatValue = (progressValue: number, target: number, suffix?: string) => {
  const shown = Number.isInteger(target)
    ? Math.round(progressValue)
    : Math.round(progressValue * 10) / 10;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Number.isInteger(target) ? 0 : 1,
  }).format(shown);
  return suffix ? `${formatted}${suffix}` : formatted;
};
