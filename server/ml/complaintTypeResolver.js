const classifier = require("./classifier");

const ALLOWED_COMPLAINT_TYPES = [
  "Academic",
  "Infrastructure",
  "Hostel",
  "College",
  "Transport",
];

const TYPE_KEYWORDS = [
  {
    type: "Transport",
    keywords: [
      "bus",
      "buses",
      "transport",
      "route",
      "pickup",
      "drop",
      "driver",
      "delay",
      "late",
      "timing",
      "commute",
      "comfortable",
      "comfort",
    ],
  },
  {
    type: "Hostel",
    keywords: ["hostel", "room", "mess", "warden", "cleaning", "water supply"],
  },
  {
    type: "Academic",
    keywords: [
      "academic",
      "exam",
      "exams",
      "syllabus",
      "faculty",
      "class",
      "lecture",
      "assignment",
      "internal marks",
    ],
  },
  {
    type: "College",
    keywords: ["college", "campus", "administration", "notice board", "fee"],
  },
  {
    type: "Infrastructure",
    keywords: [
      "infrastructure",
      "wifi",
      "internet",
      "network",
      "projector",
      "computer",
      "lab",
      "electricity",
      "power",
      "fan",
      "light",
      "server",
    ],
  },
];

function normalizeComplaintType(value = "") {
  const normalized = value.toLowerCase().trim();
  return ALLOWED_COMPLAINT_TYPES.find(
    (type) => type.toLowerCase() === normalized
  );
}

function inferComplaintType(description = "", selectedType = "") {
  const normalizedDescription = description.toLowerCase();

  for (const entry of TYPE_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalizedDescription.includes(keyword))) {
      return entry.type;
    }
  }

  const selected = normalizeComplaintType(selectedType);
  if (selected) {
    return selected;
  }

  try {
    const mlType = classifier.classify(normalizedDescription);
    return normalizeComplaintType(mlType) || "General";
  } catch (error) {
    return "General";
  }
}

module.exports = {
  inferComplaintType,
  normalizeComplaintType,
};