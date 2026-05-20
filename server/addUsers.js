require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const bcrypt = require('bcryptjs');
const { predictPriority } = require('./ml/priorityPredictor');
const { getBestDuplicateMatch } = require('./ml/textSimilarity');
const {
  inferComplaintType,
  normalizeComplaintType,
} = require('./ml/complaintTypeResolver');

const ALLOWED_DEPARTMENTS = ['CSE', 'IT', 'EEE', 'ECE', 'CIVIL'];
const ALLOWED_COMPLAINT_TYPES = [
  'Academic',
  'Infrastructure',
  'Hostel',
  'College',
  'Transport',
];

const COMPLAINT_TEMPLATES = {
  Academic: [
    'The exam timetable is not updated and students need immediate clarification.',
    'Faculty has not uploaded internal marks and this is affecting academic planning.',
    'Class schedule and assignment deadlines are clashing and must be corrected soon.',
    'Syllabus coverage is incomplete before exams and students are concerned.',
    'Lecture notes are missing for multiple subjects and this issue is urgent.',
  ],
  Infrastructure: [
    'Classroom projector and wifi are not working during sessions.',
    'Lab computers and internet connectivity are down in the morning.',
    'Power fluctuations in the lab are affecting systems and practical work.',
    'Network outage in blocks is causing repeated disruption.',
    'Fans and lights are not working in multiple classrooms.',
  ],
  Hostel: [
    'Hostel room cleaning and water supply are inconsistent and need attention.',
    'Hostel electricity issue at night is making conditions difficult.',
    'Mess food quality has dropped and hygiene needs improvement.',
    'Warden response is slow for repeated maintenance requests.',
    'Water leakage in hostel floors requires urgent repair.',
  ],
  College: [
    'College notice board is not updated with latest circulars.',
    'Campus administration response for student queries is delayed.',
    'Common areas need better maintenance and cleaner facilities.',
    'Fee section queue management is poor and needs proper arrangement.',
    'College communication on events is not timely.',
  ],
  Transport: [
    'Bus service is arriving late and students are missing classes.',
    'Transport timing is inconsistent in the morning route.',
    'Bus route planning is poor and pickup delays are frequent.',
    'Buses are overcrowded and not comfortable for commute.',
    'Driver delay is creating repeated transport issues.',
  ],
};

const DEMO_COMPLAINTS = [
  {
    complaintType: 'Academic',
    department: 'CSE',
    description: 'The exam timetable is not updated and students need immediate clarification.',
  },
  {
    complaintType: 'Transport',
    department: 'IT',
    description: 'The bus service is arriving late and students are missing classes.',
  },
  {
    complaintType: 'College',
    department: 'EEE',
    description: 'The college notice board is not updated with the latest circulars.',
  },
  {
    complaintType: 'Hostel',
    department: 'ECE',
    description: 'Hostel room cleaning and water supply are inconsistent and need attention.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'CIVIL',
    description: 'Classroom projector and wifi are not working during sessions.',
  },
  {
    complaintType: 'Academic',
    department: 'IT',
    description: 'The exam timetable is not updated and students need immediate clarification.',
  },
  {
    complaintType: 'Transport',
    department: 'EEE',
    description: 'Transport timing is inconsistent in the morning route.',
  },
  {
    complaintType: 'College',
    department: 'ECE',
    description: 'Campus administration response for student queries is delayed.',
  },
  {
    complaintType: 'Hostel',
    department: 'CIVIL',
    description: 'Hostel room cleaning and water supply are inconsistent and need attention.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'CSE',
    description: 'Lab computers and internet connectivity are down in the morning.',
  },
  {
    complaintType: 'Academic',
    department: 'ECE',
    description: 'Faculty has not uploaded internal marks and this is affecting academic planning.',
  },
  {
    complaintType: 'Transport',
    department: 'CIVIL',
    description: 'The bus service is arriving late and students are missing classes.',
  },
  {
    complaintType: 'College',
    department: 'CSE',
    description: 'The college communication on events is not timely.',
  },
  {
    complaintType: 'Hostel',
    department: 'IT',
    description: 'Mess food quality has dropped and hygiene needs improvement.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'EEE',
    description: 'Classroom projector and wifi are not working during sessions.',
  },
  {
    complaintType: 'Academic',
    department: 'CIVIL',
    description: 'Class schedule and assignment deadlines are clashing and must be corrected soon.',
  },
  {
    complaintType: 'Transport',
    department: 'CSE',
    description: 'The bus service is arriving late and students are missing classes.',
  },
  {
    complaintType: 'College',
    department: 'IT',
    description: 'Common areas need better maintenance and cleaner facilities.',
  },
  {
    complaintType: 'Hostel',
    department: 'EEE',
    description: 'Warden response is slow for repeated maintenance requests.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'ECE',
    description: 'Power fluctuations in the lab are affecting systems and practical work.',
  },
  {
    complaintType: 'Academic',
    department: 'CSE',
    description: 'Lecture notes are missing for multiple subjects and this issue is urgent.',
  },
  {
    complaintType: 'Transport',
    department: 'IT',
    description: 'Bus route planning is poor and pickup delays are frequent.',
  },
  {
    complaintType: 'College',
    department: 'EEE',
    description: 'College notice board is not updated with latest circulars.',
  },
  {
    complaintType: 'Hostel',
    department: 'ECE',
    description: 'Water leakage in hostel floors requires urgent repair.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'CIVIL',
    description: 'Network outage in blocks is causing repeated disruption.',
  },
  {
    complaintType: 'Academic',
    department: 'IT',
    description: 'Faculty has not uploaded internal marks and this is affecting academic planning.',
  },
  {
    complaintType: 'Transport',
    department: 'EEE',
    description: 'Buses are overcrowded and not comfortable for commute.',
  },
  {
    complaintType: 'College',
    department: 'ECE',
    description: 'Campus administration response for student queries is delayed.',
  },
  {
    complaintType: 'Hostel',
    department: 'CIVIL',
    description: 'Hostel electricity issue at night is making conditions difficult.',
  },
  {
    complaintType: 'Infrastructure',
    department: 'CSE',
    description: 'Fans and lights are not working in multiple classrooms.',
  },
];

function normalizeAllowedValue(value, allowedValues) {
  const normalizedValue = (value || '').trim().toLowerCase();
  return allowedValues.find(
    (allowedValue) => allowedValue.toLowerCase() === normalizedValue
  );
}

function buildUsers(count = 30) {
  const firstNames = [
    'Aarav',
    'Ishaan',
    'Vivaan',
    'Aditya',
    'Arjun',
    'Kiran',
    'Rahul',
    'Nikhil',
    'Sanjay',
    'Rohan',
    'Asha',
    'Neha',
    'Meera',
    'Kavya',
    'Divya',
  ];
  const lastNames = [
    'Sharma',
    'Verma',
    'Reddy',
    'Kumar',
    'Patel',
    'Nair',
    'Singh',
    'Iyer',
    'Gupta',
    'Joshi',
  ];

  const users = [];
  for (let i = 1; i <= count; i += 1) {
    const first = firstNames[(i - 1) % firstNames.length];
    const last = lastNames[(i - 1) % lastNames.length];
    const name = `${first} ${last}`;
    users.push({
      name,
      email: `student${i}@gmail.com`,
      password: 'Pass@123',
      role: 'user',
    });
  }
  return users;
}

function buildComplaintRequests(users) {
  return users.map((user, index) => ({
    userName: user.name,
    userEmail: user.email,
    department: DEMO_COMPLAINTS[index].department,
    complaintType: DEMO_COMPLAINTS[index].complaintType,
    description: DEMO_COMPLAINTS[index].description,
  }));
}

function deriveUrgency(normalizedDescription) {
  if (
    normalizedDescription.includes('urgent') ||
    normalizedDescription.includes('immediately')
  ) {
    return 'High';
  }

  if (normalizedDescription.includes('soon')) {
    return 'Medium';
  }

  return 'Low';
}

async function processComplaintLikeRoute(payload) {
  const normalizedDepartment = normalizeAllowedValue(
    payload.department,
    ALLOWED_DEPARTMENTS
  );
  const normalizedComplaintType = normalizeAllowedValue(
    payload.complaintType,
    ALLOWED_COMPLAINT_TYPES
  );

  if (!normalizedDepartment || !normalizedComplaintType) {
    return null;
  }

  const normalizedDescription = payload.description.toLowerCase();
  const inferredComplaintType = inferComplaintType(
    normalizedDescription,
    normalizedComplaintType
  );
  const complaintTypeForSave =
    normalizeComplaintType(inferredComplaintType) || normalizedComplaintType;
  const category = complaintTypeForSave;
  const priority = predictPriority(normalizedDescription, complaintTypeForSave);
  const urgency = deriveUrgency(normalizedDescription);

  const existingComplaints = await Complaint.find({
    status: { $ne: 'Duplicate' },
    duplicateOf: null,
  })
    .sort({ createdAt: -1 })
    .limit(250);

  const sameTypeComplaints = existingComplaints.filter(
    (item) =>
      (item.complaintType || '').toLowerCase().trim() ===
      complaintTypeForSave.toLowerCase()
  );

  const duplicateMatch = sameTypeComplaints.length
    ? getBestDuplicateMatch(
        normalizedDescription,
        sameTypeComplaints,
        0.45,
        complaintTypeForSave
      )
    : null;

  const isDuplicate = Boolean(duplicateMatch);

  return Complaint.create({
    userName: payload.userName,
    userEmail: payload.userEmail.toLowerCase(),
    department: normalizedDepartment,
    complaintType: complaintTypeForSave,
    description: payload.description,
    category,
    urgency,
    priority,
    status: isDuplicate ? 'Duplicate' : 'Pending',
    duplicateOf: isDuplicate ? duplicateMatch.complaint._id : null,
    duplicateScore: isDuplicate ? Number(duplicateMatch.score.toFixed(3)) : 0,
  });
}

async function clearDemoData() {
  await Complaint.deleteMany({});
  await User.deleteMany({ role: 'user' });
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await clearDemoData();
    console.log('Old demo users and complaints cleared');

    const users = buildUsers(30);
    const hashedPassword = await bcrypt.hash('Pass@123', 10);

    const createdUsers = [];
    for (const user of users) {
      const createdUser = await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      });
      createdUsers.push(createdUser);
      console.log(`User created: ${user.email}`);
    }

    const complaintRequests = buildComplaintRequests(createdUsers);

    let createdComplaints = 0;
    let duplicateComplaints = 0;

    for (const request of complaintRequests) {
      const savedComplaint = await processComplaintLikeRoute(request);
      if (!savedComplaint) {
        continue;
      }

      createdComplaints += 1;
      if (savedComplaint.status === 'Duplicate') {
        duplicateComplaints += 1;
      }
    }

    console.log(`Users processed: ${createdUsers.length}`);
    console.log(`Complaints created: ${createdComplaints}`);
    console.log(`Duplicates detected: ${duplicateComplaints}`);

    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$complaintType',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log('Complaint counts by type:');
    stats.forEach((entry) => {
      console.log(`- ${entry._id}: ${entry.count}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Disconnect error:', disconnectError.message);
    }
    process.exit(1);
  }
})();
