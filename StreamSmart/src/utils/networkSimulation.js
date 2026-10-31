const DEFAULT_SETTINGS = {
  enabled: false,
  bandwidth: 20,
  latency: 0,
  packetLoss: 0,
};

// Keep settings separate for each logged-in user.
const getStorageKey = () => {
  let userId = "guest";

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    userId = user?.id || "guest";
  } catch (error) {
    console.error("Unable to read current user:", error);
  }

  return `streamsmart_network_simulation_${userId}`;
};

// Get the currently applied network configuration.
export const getNetworkSimulation = () => {
  try {
    const saved = localStorage.getItem(getStorageKey());

    if (!saved) {
      return { ...DEFAULT_SETTINGS };
    }

    const settings = JSON.parse(saved);

    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      enabled: settings.enabled === true,
    };
  } catch (error) {
    console.error("Unable to load network settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
};

// Apply and save a network configuration.
export const applyNetworkSimulation = (settings) => {
  const appliedSettings = {
    enabled: true,
    bandwidth: Math.max(0.5, Number(settings.bandwidth)),
    latency: Math.max(0, Number(settings.latency)),
    packetLoss: Math.min(100, Math.max(0, Number(settings.packetLoss))),
  };

  localStorage.setItem(
    getStorageKey(),
    JSON.stringify(appliedSettings)
  );

  window.dispatchEvent(
    new CustomEvent("streamsmart-network-change", {
      detail: appliedSettings,
    })
  );

  return appliedSettings;
};

// Disable the currently applied simulation.
export const clearNetworkSimulation = () => {
  localStorage.removeItem(getStorageKey());

  window.dispatchEvent(
    new CustomEvent("streamsmart-network-change", {
      detail: { ...DEFAULT_SETTINGS },
    })
  );
};