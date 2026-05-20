const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "and",
  "or",
  "it",
  "this",
  "that",
  "my",
  "our",
  "with",
  "from",
  "by",
  "be",
  "as",
]);

const NORMALIZATION_MAP = {
  netwrok: "network",
  ntework: "network",
  internte: "internet",
  issu: "issue",
  problm: "problem",
  buses: "bus",
  buss: "bus",
  uncomfort: "comfort",
  uncomfortable: "comfort",
  comforts: "comfort",
  labs: "lab",
};

const natural = require("natural");

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => NORMALIZATION_MAP[token] || token)
    .map((token) => natural.PorterStemmer.stem(token))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function normalizeSentence(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => NORMALIZATION_MAP[token] || token)
    .map((token) => natural.PorterStemmer.stem(token))
    .filter((token) => token.length > 1)
    .join(" ");
}

function normalizeComplaintType(value = "") {
  return value.toLowerCase().trim();
}

function termFrequency(tokens) {
  const freq = {};
  tokens.forEach((token) => {
    freq[token] = (freq[token] || 0) + 1;
  });
  return freq;
}

function buildTfidfVectors(targetText, candidateTexts) {
  const docs = [targetText, ...candidateTexts].map((t) => tokenize(t));
  const docCount = docs.length;

  const df = {};
  docs.forEach((tokens) => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach((token) => {
      df[token] = (df[token] || 0) + 1;
    });
  });

  return docs.map((tokens) => {
    const tf = termFrequency(tokens);
    const vector = {};

    Object.keys(tf).forEach((term) => {
      const idf = Math.log((docCount + 1) / ((df[term] || 0) + 1)) + 1;
      vector[term] = tf[term] * idf;
    });

    return vector;
  });
}

function cosineSimilarity(vecA, vecB) {
  const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  terms.forEach((term) => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (!magA || !magB) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function tokenOverlapSimilarity(textA = "", textB = "") {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));

  if (!tokensA.size || !tokensB.size) {
    return 0;
  }

  let overlap = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      overlap += 1;
    }
  });

  const smallerSetSize = Math.min(tokensA.size, tokensB.size);
  return overlap / smallerSetSize;
}

function getBestDuplicateMatch(
  targetText,
  complaints,
  threshold = 0.58,
  targetComplaintType = ""
) {
  if (!complaints.length) {
    return null;
  }

  const normalizedTargetType = normalizeComplaintType(targetComplaintType);
  const filteredComplaints = normalizedTargetType
    ? complaints.filter(
        (complaint) =>
          normalizeComplaintType(complaint.complaintType || complaint.category || "") ===
          normalizedTargetType
      )
    : complaints;

  if (!filteredComplaints.length) {
    return null;
  }

  const candidateTexts = filteredComplaints.map((complaint) => complaint.description || "");
  const vectors = buildTfidfVectors(targetText, candidateTexts);
  const sourceVector = vectors[0];

  let best = null;

  filteredComplaints.forEach((complaint, index) => {
    const cosineScore = cosineSimilarity(sourceVector, vectors[index + 1]);
    const sourceNorm = normalizeSentence(targetText);
    const targetNorm = normalizeSentence(complaint.description || "");
    const textScore = natural.JaroWinklerDistance(sourceNorm, targetNorm);
    const overlapScore = tokenOverlapSimilarity(targetText, complaint.description || "");
    const score = Math.max(cosineScore, textScore, overlapScore);
    if (!best || score > best.score) {
      best = { complaint, score };
    }
  });

  if (!best || best.score < threshold) {
    return null;
  }

  return best;
}

module.exports = {
  getBestDuplicateMatch,
};
