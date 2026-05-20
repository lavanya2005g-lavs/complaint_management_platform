const natural = require("natural");

const classifier = new natural.BayesClassifier();

// Train category data
classifier.addDocument("water problem in hostel", "Hostel");
classifier.addDocument("room cleaning issue", "Hostel");

classifier.addDocument("bus delay issue", "Transport");
classifier.addDocument("transport timing problem", "Transport");
classifier.addDocument("bus not comfortable", "Transport");
classifier.addDocument("buses are not comfortable", "Transport");
classifier.addDocument("bus service late", "Transport");
classifier.addDocument("bus route delay", "Transport");
classifier.addDocument("bus timing issue", "Transport");

classifier.addDocument("exam issue", "Academic");
classifier.addDocument("faculty problem", "Academic");

classifier.addDocument("wifi not working", "Infrastructure");
classifier.addDocument("server down issue", "Infrastructure");

classifier.train();

module.exports = classifier;
