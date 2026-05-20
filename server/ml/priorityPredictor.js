function predictPriority(description = "", complaintType = "") {
  const normalizedType = (complaintType || "").toLowerCase().trim();

  // Project rule: Academic + Transport are always High.
  if (normalizedType === "academic" || normalizedType === "transport") {
    return "High";
  }

  // Project rule: Hostel + College are Medium.
  if (normalizedType === "hostel" || normalizedType === "college") {
    return "Medium";
  }

  // Project rule: Infrastructure is Low.
  if (normalizedType === "infrastructure") {
    return "Low";
  }

  return "Low";
}

module.exports = {
  predictPriority,
};
