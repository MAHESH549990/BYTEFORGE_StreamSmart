
const SAFETY_FACTOR = 0.75;
const MIN_BUFFER_FOR_UPGRADE = 10;
const LOW_BUFFER_THRESHOLD = 3;
const REQUIRED_STABLE_MEASUREMENTS = 3;

export function selectQuality({
  levels,
  bandwidthKbps,
  bufferSeconds,
  previousLevel,
  upgradeStreak,
}) {
  if (!levels?.length) {
    return { selectedLevel: 0, upgradeStreak: 0 };
  }

  // Convert available bandwidth into a conservative estimate.
  const safeBandwidth = bandwidthKbps * SAFETY_FACTOR;

  // Find the highest quality that fits the safe bandwidth.
  let targetLevel = 0;

  levels.forEach((level, index) => {
    const bitrateKbps = level.bitrate / 1000;

    if (bitrateKbps <= safeBandwidth) {
      targetLevel = index;
    }
  });

  // If the buffer is critically low, step down immediately.
  if (bufferSeconds < LOW_BUFFER_THRESHOLD) {
    return {
      selectedLevel: Math.max(0, Math.min(targetLevel, previousLevel - 1)),
      upgradeStreak: 0,
    };
  }

  // Downgrade immediately when the current quality is too high.
  if (targetLevel < previousLevel) {
    return {
      selectedLevel: targetLevel,
      upgradeStreak: 0,
    };
  }

  // Require stable measurements and a healthy buffer before upgrading.
  if (targetLevel > previousLevel) {
    const nextStreak = upgradeStreak + 1;

    if (
      nextStreak >= REQUIRED_STABLE_MEASUREMENTS &&
      bufferSeconds >= MIN_BUFFER_FOR_UPGRADE
    ) {
      return {
        selectedLevel: targetLevel,
        upgradeStreak: 0,
      };
    }

    return {
      selectedLevel: previousLevel,
      upgradeStreak: nextStreak,
    };
  }

  return {
    selectedLevel: previousLevel,
    upgradeStreak: 0,
  };
}
