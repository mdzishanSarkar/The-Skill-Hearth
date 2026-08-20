const db = db.getSiblingDB('the-skill-hearth-local');

// ============================================================
// HELPERS
// ============================================================
function oid() { return new ObjectId(); }
function past(days) { const d = new Date(); d.setDate(d.getDate() - days); return d; }
function future(days) { const d = new Date(); d.setDate(d.getDate() + days); return d; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ============================================================
// EXISTING USERS & CATEGORIES
// ============================================================
const users = db.users.find().toArray();
const categories = db.categories.find().toArray();

if (users.length < 4) { print('ERROR: Need at least 4 users'); quit(1); }

const u1 = users[0]; // tech
const u2 = users[1]; // simonsimok
const u3 = users[2]; // freedrob
const u4 = users[3]; // contentcreation
const allUserIds = [u1._id, u2._id, u3._id, u4._id];

const catByName = {};
categories.forEach(c => { catByName[c.name] = c; });

print('Users: ' + users.map(u => u.displayName).join(', '));
print('Categories: ' + categories.map(c => c.name).join(', '));

// ============================================================
// 1. SKILLS (all 4 users, teach + learn, across categories)
// ============================================================
const skillsData = [
  // u1 - tech
  { userId: u1._id, type: 'teach', cat: 'Digital Literacy', skillName: 'Smartphone Basics', desc: 'Learn to navigate your smartphone with confidence.', proficiency: 'advanced', format: 'either', session: '1hr' },
  { userId: u1._id, type: 'teach', cat: 'Technology & Web', skillName: 'JavaScript / Web Development', desc: 'Build modern web apps with JavaScript.', proficiency: 'advanced', format: 'online', session: '2hr+' },
  { userId: u1._id, type: 'learn', cat: 'Music & Performing Arts', skillName: 'Guitar', desc: 'Want to learn acoustic guitar from scratch.', proficiency: 'beginner', format: 'in-person', session: '1hr' },
  { userId: u1._id, type: 'teach', cat: 'Technology & Web', skillName: 'Intro to Programming', desc: 'Start your coding journey with Python basics.', proficiency: 'intermediate', format: 'online', session: '1hr' },
  // u2 - simonsimok
  { userId: u2._id, type: 'teach', cat: 'Food & Cooking', skillName: 'Baking', desc: 'Artisan bread and pastry techniques.', proficiency: 'intermediate', format: 'in-person', session: '2hr+' },
  { userId: u2._id, type: 'teach', cat: 'Photography & Visual Arts', skillName: 'Photography', desc: 'Composition, lighting, and manual mode.', proficiency: 'advanced', format: 'either', session: '1hr' },
  { userId: u2._id, type: 'learn', cat: 'Textile & Craft', skillName: 'Knitting / Crochet', desc: 'Learn to make scarves and blankets.', proficiency: 'beginner', format: 'in-person', session: '1hr' },
  { userId: u2._id, type: 'teach', cat: 'Photography & Visual Arts', skillName: 'Photo Editing', desc: 'Post-processing with Lightroom and GIMP.', proficiency: 'intermediate', format: 'online', session: '1hr' },
  // u3 - freedrob
  { userId: u3._id, type: 'teach', cat: 'Home & Garden', skillName: 'Basic Plumbing', desc: 'Fix leaks and unblock drains at home.', proficiency: 'advanced', format: 'in-person', session: '2hr+' },
  { userId: u3._id, type: 'teach', cat: 'Home & Garden', skillName: 'Composting', desc: 'Turn kitchen waste into garden gold.', proficiency: 'intermediate', format: 'in-person', session: '1hr' },
  { userId: u3._id, type: 'learn', cat: 'Digital Literacy', skillName: 'Email & Video Calls', desc: 'Stay connected with family online.', proficiency: 'beginner', format: 'either', session: '30min' },
  { userId: u3._id, type: 'teach', cat: 'Home & Garden', skillName: 'Basic Electrical', desc: 'Safe DIY electrical fixes around the house.', proficiency: 'intermediate', format: 'in-person', session: '1hr' },
  // u4 - contentcreation
  { userId: u4._id, type: 'teach', cat: 'Languages & Communication', skillName: 'Conversational Language Practice', desc: 'Practice English and Bengali conversation.', proficiency: 'advanced', format: 'online', session: '1hr' },
  { userId: u4._id, type: 'teach', cat: 'Textile & Craft', skillName: 'Sewing & Mending', desc: 'Hand and machine sewing basics.', proficiency: 'intermediate', format: 'in-person', session: '2hr+' },
  { userId: u4._id, type: 'learn', cat: 'Photography & Visual Arts', skillName: 'Photography', desc: 'Learn mobile and DSLR photography.', proficiency: 'beginner', format: 'either', session: '1hr' },
  { userId: u4._id, type: 'teach', cat: 'Food & Cooking', skillName: 'Meal Prep', desc: 'Plan and batch-cook healthy meals for the week.', proficiency: 'intermediate', format: 'online', session: '1hr' },
];

const insertedSkills = [];
skillsData.forEach(s => {
  const cat = catByName[s.cat];
  const skill = {
    userId: s.userId,
    type: s.type,
    categoryId: cat._id,
    categoryName: s.cat,
    skillName: s.skillName,
    description: s.desc,
    proficiencyLevel: s.proficiency,
    format: s.format,
    sessionLength: s.session,
    isActive: true,
    isDeleted: false,
    isPromoted: Math.random() > 0.7,
    promotionExpiresAt: Math.random() > 0.7 ? future(30) : null,
    media: [],
    location: { city: u1.location.city, neighborhood: u1.location.neighborhood, type: 'Point', coordinates: u1.location.coordinates, radiusPreference: 5 },
    stats: { averageRating: +(Math.random() * 2 + 3).toFixed(1), reviewCount: Math.floor(Math.random() * 15), completedSessionCount: Math.floor(Math.random() * 20) },
    createdAt: past(Math.floor(Math.random() * 60)),
    updatedAt: new Date(),
  };
  const existing = db.skills.findOne({ userId: s.userId, skillName: s.skillName, isDeleted: false });
  if (!existing) {
    const res = db.skills.insertOne(skill);
    insertedSkills.push({ ...skill, _id: res.insertedId });
  } else {
    insertedSkills.push(existing);
  }
});
print('Skills: ' + insertedSkills.length + ' ready');

const teachSkills = insertedSkills.filter(s => s.type === 'teach');
const learnSkills = insertedSkills.filter(s => s.type === 'learn');

// ============================================================
// 2. CONNECTIONS (all status combos between all user pairs)
// ============================================================
const connectionStatuses = ['pending', 'accepted', 'rejected', 'completed', 'withdrawn', 'cancelled'];
const connections = [];
const pairs = [[u1,u2],[u1,u3],[u1,u4],[u2,u3],[u2,u4],[u3,u4]];
pairs.forEach((pair, pi) => {
  connectionStatuses.forEach((status, si) => {
    const skill = teachSkills[si % teachSkills.length];
    const conn = {
      requesterId: pair[0]._id,
      teacherId: pair[1]._id,
      skillId: skill._id,
      status: status,
      message: `Hi! I'd like to connect for ${skill.skillName}.`,
      responseMessage: status === 'accepted' ? 'Sure, let us schedule!' : status === 'rejected' ? 'Not available right now.' : null,
      proposedFormat: skill.format,
      completedAt: status === 'completed' ? past(Math.floor(Math.random() * 30)) : null,
      cancelledBy: status === 'cancelled' ? pair[0]._id : null,
      cancellationReason: status === 'cancelled' ? 'Schedule conflict' : null,
      createdAt: past(Math.floor(Math.random() * 45)),
      updatedAt: new Date(),
    };
    const existing = db.connections.findOne({ requesterId: conn.requesterId, teacherId: conn.teacherId, skillId: conn.skillId, status });
    if (!existing) {
      const res = db.connections.insertOne(conn);
      connections.push({ ...conn, _id: res.insertedId });
    } else {
      connections.push(existing);
    }
  });
});
print('Connections: ' + connections.length + ' ready');

// ============================================================
// 3. MESSAGES (text, system, image, skill_card, voice_note, gif, reactions)
// ============================================================
const messageTypes = ['text', 'system', 'image', 'skill_card', 'voice_note', 'gif'];
const emojiPool = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];
const messages = [];
connections.filter(c => ['accepted', 'completed'].includes(c.status)).slice(0, 12).forEach((conn, i) => {
  const type = messageTypes[i % messageTypes.length];
  const msg = {
    connectionId: conn._id,
    senderId: i % 2 === 0 ? conn.requesterId : conn.teacherId,
    content: type === 'system' ? 'Session scheduled' : `Hello! This is a ${type} message about our session.`,
    type: type,
    imageUrl: type === 'image' ? 'https://example.com/img.jpg' : undefined,
    imagePublicId: type === 'image' ? 'img_pub_123' : undefined,
    voiceNoteUrl: type === 'voice_note' ? 'https://example.com/voice.mp3' : undefined,
    voiceNoteDurationSeconds: type === 'voice_note' ? 45 : undefined,
    gifUrl: type === 'gif' ? 'https://example.com/fun.gif' : undefined,
    reactions: [{ userId: allUserIds[(i+1) % 4], emoji: pick(emojiPool), createdAt: past(1) }],
    readAt: past(0),
    deliveredAt: past(0),
    systemEvent: type === 'system' ? 'session_scheduled' : undefined,
    createdAt: past(Math.floor(Math.random() * 20)),
    updatedAt: new Date(),
  };
  const res = db.messages.insertOne(msg);
  messages.push({ ...msg, _id: res.insertedId });
});
print('Messages: ' + messages.length + ' ready');

// ============================================================
// 4. CONVERSATION SETTINGS
// ============================================================
const convSettings = [];
connections.slice(0, 8).forEach((conn, i) => {
  const themes = ['default', 'sunset', 'ocean', 'forest', 'midnight'];
  const notifs = ['default', 'all', 'mentions_only', 'none'];
  const cs = {
    userId: allUserIds[i % 4],
    conversationId: conn._id.toString(),
    conversationType: 'skill',
    isPinned: i < 2,
    pinnedAt: i < 2 ? past(5) : undefined,
    isMuted: i === 3,
    mutedUntil: i === 3 ? future(7) : undefined,
    isArchived: i === 5,
    archivedAt: i === 5 ? past(3) : undefined,
    customNickname: i < 3 ? `Chat with ${i === 0 ? 'Tech' : i === 1 ? 'Simon' : 'Rob'}` : undefined,
    notificationOverride: notifs[i % 4],
    lastReadMessageId: messages[i % messages.length]?._id,
    lastReadAt: past(1),
    chatTheme: themes[i % 5],
    createdAt: past(30),
    updatedAt: new Date(),
  };
  const existing = db.conversationsettings.findOne({ userId: cs.userId, conversationId: cs.conversationId });
  if (!existing) { db.conversationsettings.insertOne(cs); convSettings.push(cs); }
});
print('ConversationSettings: ' + convSettings.length + ' ready');

// ============================================================
// 5. USER INBOX PREFERENCES
// ============================================================
const inboxPrefs = [];
connections.slice(0, 6).forEach((conn, i) => {
  const pref = {
    userId: allUserIds[i % 4],
    connectionId: conn._id,
    isPinned: i < 2,
    isMuted: i === 3,
    mutedUntil: i === 3 ? future(5) : undefined,
    isArchived: i === 5,
    archivedAt: i === 5 ? past(2) : undefined,
    lastReadAt: past(0),
    createdAt: past(20),
    updatedAt: new Date(),
  };
  const existing = db.userinboxpreferences.findOne({ userId: pref.userId, connectionId: pref.connectionId });
  if (!existing) { db.userinboxpreferences.insertOne(pref); inboxPrefs.push(pref); }
});
print('UserInboxPreferences: ' + inboxPrefs.length + ' ready');

// ============================================================
// 6. REVIEWS (one per completed connection)
// ============================================================
const reviewTags = ['Patient teacher', 'Knowledgeable', 'Great communicator', 'Punctual', 'Encouraging', 'Well prepared'];
const reviews = [];
connections.filter(c => c.status === 'completed').forEach((conn, i) => {
  const rev = {
    connectionId: conn._id,
    reviewerId: conn.requesterId,
    revieweeId: conn.teacherId,
    skillId: conn.skillId,
    rating: Math.floor(Math.random() * 3) + 3,
    content: i % 2 === 0 ? 'Great session! Learned a lot.' : 'Would definitely recommend.',
    tags: [reviewTags[i % reviewTags.length], reviewTags[(i+1) % reviewTags.length]],
    wouldRecommend: true,
    createdAt: past(Math.floor(Math.random() * 15)),
    updatedAt: new Date(),
  };
  const existing = db.reviews.findOne({ connectionId: rev.connectionId });
  if (!existing) { db.reviews.insertOne(rev); reviews.push(rev); }
});
print('Reviews: ' + reviews.length + ' ready');

// ============================================================
// 7. REPORTS
// ============================================================
const reportReasons = ['harassment', 'inappropriate', 'spam', 'fake', 'no-show', 'misleading', 'other'];
const reportStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
const reports = [];
for (let i = 0; i < 4; i++) {
  const rep = {
    reporterId: allUserIds[i],
    targetType: pick(['user', 'skill', 'message', 'review', 'post']),
    targetId: allUserIds[(i + 1) % 4],
    reason: reportReasons[i],
    description: `Report reason #${i + 1}: concern about this content.`,
    status: reportStatuses[i % 4],
    assignedTo: i >= 2 ? u1._id : undefined,
    action: i >= 2 ? pick(['warn', 'suspend', 'no_action']) : undefined,
    resolution: i >= 2 ? 'Reviewed and handled.' : undefined,
    createdAt: past(Math.floor(Math.random() * 10)),
    updatedAt: new Date(),
  };
  db.reports.insertOne(rep);
  reports.push(rep);
}
print('Reports: ' + reports.length + ' ready');

// ============================================================
// 8. NOTIFICATIONS (all 20 types)
// ============================================================
const notifTypes = [
  'request_received', 'new_message', 'friend_request', 'connection_accepted',
  'connection_completed', 'review_received', 'review_replied', 'skill_match',
  'radar_match', 'swap_suggestion', 'group_session_invite', 'group_session_reminder',
  'group_session_full', 'challenge_invite', 'challenge_reminder', 'challenge_completed',
  'mentorship_request', 'mentorship_update', 'weekly_digest', 'system_announcement'
];
const refModels = [
  'Connection', 'Message', 'Friendship', 'Connection', 'Connection',
  'Review', 'Review', 'Skill', 'Skill', 'SkillSwap',
  'GroupSession', 'GroupSession', 'GroupSession', 'Challenge', 'Challenge',
  'Challenge', 'Mentorship', 'Mentorship', null, null
];
const notifications = [];
notifTypes.forEach((type, i) => {
  const n = {
    userId: allUserIds[i % 4],
    type: type,
    referenceId: refModels[i] ? connections[i % connections.length]?._id : undefined,
    referenceModel: refModels[i] || undefined,
    message: `Notification: ${type.replace(/_/g, ' ')}`,
    isRead: i % 3 === 0,
    createdAt: past(Math.floor(Math.random() * 14)),
    updatedAt: new Date(),
  };
  db.notifications.insertOne(n);
  notifications.push(n);
});
print('Notifications: ' + notifications.length + ' ready');

// ============================================================
// 9. TOKEN BLACKLIST
// ============================================================
const tokens = [];
for (let i = 0; i < 6; i++) {
  const t = {
    tokenId: `tok_blacklist_${Date.now()}_${i}`,
    type: i % 2 === 0 ? 'access' : 'refresh',
    expiresAt: future(7),
    createdAt: past(1),
  };
  db.tokenblacklists.insertOne(t);
  tokens.push(t);
}
print('TokenBlacklists: ' + tokens.length + ' ready');

// ============================================================
// 10. BLOCKS
// ============================================================
const blocks = [];
const blockPairs = [[u1._id, u4._id], [u3._id, u4._id]];
blockPairs.forEach(([blocker, blocked]) => {
  const existing = db.blocks.findOne({ blockerId: blocker, blockedId: blocked });
  if (!existing) {
    db.blocks.insertOne({ blockerId: blocker, blockedId: blocked, createdAt: past(5) });
    blocks.push({ blockerId: blocker, blockedId: blocked });
  }
});
print('Blocks: ' + blocks.length + ' ready');

// ============================================================
// 11. SKILL SWAPS (all status combos)
// ============================================================
const swapStatuses = ['suggested', 'accepted', 'declined'];
const swaps = [];
for (let i = 0; i < 3; i++) {
  const sk1 = teachSkills[i % teachSkills.length];
  const sk2 = teachSkills[(i + 3) % teachSkills.length];
  const swap = {
    userAId: allUserIds[i],
    userBId: allUserIds[(i + 1) % 4],
    userATeachesSkillId: sk1._id,
    userBTeachesSkillId: sk2._id,
    status: swapStatuses[i],
    declinedBy: swapStatuses[i] === 'declined' ? allUserIds[(i + 1) % 4] : undefined,
    createdAt: past(Math.floor(Math.random() * 20)),
    updatedAt: new Date(),
  };
  const existing = db.skillswaps.findOne({ userAId: swap.userAId, userBId: swap.userBId, userATeachesSkillId: swap.userATeachesSkillId, userBTeachesSkillId: swap.userBTeachesSkillId });
  if (!existing) { db.skillswaps.insertOne(swap); swaps.push(swap); }
}
print('SkillSwaps: ' + swaps.length + ' ready');

// ============================================================
// 12. GROUP SESSIONS (open, full, completed, cancelled)
// ============================================================
const gsStatuses = ['open', 'full', 'completed', 'cancelled'];
const groupSessions = [];
gsStatuses.forEach((status, i) => {
  const skill = teachSkills[i % teachSkills.length];
  const gs = {
    teacherId: allUserIds[i],
    skillId: skill._id,
    title: `${skill.skillName} Group Session #${i + 1}`,
    description: `A ${status} group session for ${skill.skillName}.`,
    maxParticipants: 5,
    participants: status === 'full' ? allUserIds.slice(0, 5) : allUserIds.slice(0, i + 1),
    format: i % 2 === 0 ? 'in-person' : 'online',
    location: i % 2 === 0 ? 'Community Center, Dhaka' : undefined,
    scheduledAt: status === 'completed' ? past(5) : status === 'cancelled' ? past(10) : future(i + 1),
    status: status,
    sessionType: i % 2 === 0 ? 'regular' : 'workshop',
    chatRoomId: `gs_room_${Date.now()}_${i}`,
    cancelledReason: status === 'cancelled' ? 'Low enrollment' : undefined,
    createdAt: past(Math.floor(Math.random() * 30)),
    updatedAt: new Date(),
  };
  db.groupsessions.insertOne(gs);
  groupSessions.push(gs);
});
print('GroupSessions: ' + groupSessions.length + ' ready');

// ============================================================
// 13. SAVED SEARCHES
// ============================================================
const savedSearches = [];
allUserIds.forEach((uid, i) => {
  const ss = {
    userId: uid,
    name: `Search ${i + 1}`,
    filters: {
      category: categories[i % categories.length].name,
      format: pick(['in-person', 'online', 'either']),
      type: i % 2 === 0 ? 'teach' : 'learn',
      radius: 10,
      availability: ['saturday', 'sunday'],
      proficiencyLevel: 'intermediate',
    },
    alertEnabled: i % 2 === 0,
    matchedSkillIds: [teachSkills[i % teachSkills.length]._id],
    lastAlertSentAt: i % 2 === 0 ? past(2) : undefined,
    createdAt: past(20),
    updatedAt: new Date(),
  };
  db.savedsearches.insertOne(ss);
  savedSearches.push(ss);
});
print('SavedSearches: ' + savedSearches.length + ' ready');

// ============================================================
// 14. COMMUNITY POSTS (with votes)
// ============================================================
const posts = [];
const postData = [
  { author: u1._id, content: 'Just finished a great cooking session! Anyone want to swap skills this weekend?' },
  { author: u2._id, content: 'Looking for someone to teach me knitting. I can trade photography lessons.' },
  { author: u3._id, content: 'Pro tip: Composting is easier than you think. Start with kitchen scraps!' },
  { author: u4._id, content: 'Free English conversation practice every Saturday. Join us!' },
];
postData.forEach((p, i) => {
  const post = {
    authorId: p.author,
    content: p.content,
    city: u1.location.city.toLowerCase(),
    neighborhood: u1.location.neighborhood.toLowerCase(),
    voteScore: Math.floor(Math.random() * 20) - 5,
    userVotes: [
      { userId: allUserIds[(i + 1) % 4], vote: 'up' },
      { userId: allUserIds[(i + 2) % 4], vote: i % 2 === 0 ? 'up' : 'down' },
    ],
    isDeleted: false,
    isFlagged: i === 3,
    flagReason: i === 3 ? 'spam' : undefined,
    createdAt: past(Math.floor(Math.random() * 14)),
    updatedAt: new Date(),
  };
  db.communityposts.insertOne(post);
  posts.push(post);
});
print('CommunityPosts: ' + posts.length + ' ready');

// ============================================================
// 15. ENDORSEMENTS
// ============================================================
const endorsements = [];
const endPairs = [[u2, u1, 0], [u3, u1, 1], [u1, u2, 4], [u4, u3, 8]];
endPairs.forEach(([endorser, endorsee, si]) => {
  const skill = teachSkills[si % teachSkills.length];
  const existing = db.endorsements.findOne({ endorserId: endorser._id, endorseeId: endorsee._id, skillId: skill._id });
  if (!existing) {
    const e = {
      endorserId: endorser._id,
      endorseeId: endorsee._id,
      skillId: skill._id,
      connectionId: connections[0]._id,
      createdAt: past(5),
    };
    db.endorsements.insertOne(e);
    endorsements.push(e);
  }
});
print('Endorsements: ' + endorsements.length + ' ready');

// ============================================================
// 16. AUDIT LOGS
// ============================================================
const auditActions = ['user.login', 'skill.created', 'review.posted', 'connection.completed', 'report.filed', 'user.updated', 'admin.action'];
const auditTargets = ['user', 'skill', 'review', 'connection', 'report', 'user', 'user'];
const auditLogs = [];
auditActions.forEach((action, i) => {
  const log = {
    performedBy: allUserIds[i % 4],
    action: action,
    targetType: auditTargets[i],
    targetId: allUserIds[(i + 1) % 4],
    before: i === 6 ? { status: 'active' } : undefined,
    after: i === 6 ? { status: 'suspended' } : undefined,
    metadata: { ip: '192.168.1.' + (i + 1), userAgent: 'Mozilla/5.0' },
    createdAt: past(Math.floor(Math.random() * 10)),
    updatedAt: new Date(),
  };
  db.auditlogs.insertOne(log);
  auditLogs.push(log);
});
print('AuditLogs: ' + auditLogs.length + ' ready');

// ============================================================
// 17. PASSWORD RESET TOKENS
// ============================================================
for (let i = 0; i < 3; i++) {
  db.passwordresettokens.insertOne({
    userId: allUserIds[i],
    tokenHash: `reset_hash_${Date.now()}_${i}`,
    expiresAt: future(1),
    isUsed: i === 2,
    createdAt: past(1),
  });
}
print('PasswordResetTokens: 3 ready');

// ============================================================
// 18. EMAIL VERIFICATION TOKENS
// ============================================================
for (let i = 0; i < 2; i++) {
  db.emailverificationtokens.insertOne({
    userId: allUserIds[i],
    tokenHash: `email_verify_${Date.now()}_${i}`,
    expiresAt: future(1),
    isUsed: false,
    createdAt: past(0),
  });
}
print('EmailVerificationTokens: 2 ready');

// ============================================================
// 19. REFRESH TOKENS
// ============================================================
for (let i = 0; i < 4; i++) {
  db.refreshtokens.insertOne({
    userId: allUserIds[i],
    tokenHash: `refresh_${Date.now()}_${i}`,
    expiresAt: future(30),
    revokedAt: i === 3 ? past(1) : undefined,
    createdAt: past(5),
  });
}
print('RefreshTokens: 4 ready');

// ============================================================
// 20. OAUTH PROVIDERS
// ============================================================
const oauths = [
  { userId: u1._id, provider: 'google', providerUserId: 'google_tech_123', email: u1.email, displayName: u1.displayName },
  { userId: u4._id, provider: 'google', providerUserId: 'google_cc_456', email: u4.email, displayName: u4.displayName },
];
oauths.forEach(o => {
  const existing = db.oauthproviders.findOne({ provider: o.provider, providerUserId: o.providerUserId });
  if (!existing) db.oauthproviders.insertOne({ ...o, createdAt: past(30) });
});
print('OAuthProviders: 2 ready');

// ============================================================
// 21. TWO-FACTOR SECRETS
// ============================================================
[u1._id, u2._id].forEach((uid, i) => {
  const existing = db.twofactorsecrets.findOne({ userId: uid });
  if (!existing) {
    db.twofactorsecrets.insertOne({
      userId: uid,
      secret: `JBSWY3DPEHPK3PXP_secret_${i}`,
      enabled: i === 0,
      lastUsedAt: past(2),
      createdAt: past(20),
    });
  }
});
print('TwoFactorSecrets: 2 ready');

// ============================================================
// 22. SKILL SUGGESTIONS (all statuses)
// ============================================================
const sugStatuses = ['pending', 'approved', 'rejected'];
const suggestions = [
  { userId: u2._id, skillName: 'Watercolor Painting', categoryName: 'Photography & Visual Arts', status: 'pending', votes: 5 },
  { userId: u3._id, skillName: 'Bike Repair', categoryName: 'Home & Garden', status: 'approved', votes: 12 },
  { userId: u4._id, skillName: 'Poetry Writing', categoryName: 'Languages & Communication', status: 'rejected', votes: 2 },
];
suggestions.forEach(s => {
  const existing = db.skillsuggestions.findOne({ userId: s.userId, skillName: s.skillName });
  if (!existing) {
    db.skillsuggestions.insertOne({
      ...s,
      description: `Suggestion for ${s.skillName}`,
      adminNotes: s.status === 'approved' ? 'Great addition!' : s.status === 'rejected' ? 'Duplicate' : undefined,
      votedBy: allUserIds.slice(0, s.votes % 4),
      reviewedBy: s.status !== 'pending' ? u1._id : undefined,
      reviewedAt: s.status !== 'pending' ? past(3) : undefined,
      createdAt: past(10),
      updatedAt: new Date(),
    });
  }
});
print('SkillSuggestions: 3 ready');

// ============================================================
// 23. SKILL BUNDLES
// ============================================================
const bundles = [
  { name: 'Home Improvement Starter', desc: 'Essential home repair skills.', isOfficial: true, skillIds: insertedSkills.filter(s => s.categoryName === 'Home & Garden').map(s => s._id) },
  { name: 'Creative Arts Bundle', desc: 'Explore your artistic side.', isOfficial: false, skillIds: insertedSkills.filter(s => ['Textile & Craft', 'Photography & Visual Arts'].includes(s.categoryName)).map(s => s._id) },
];
bundles.forEach(b => {
  const existing = db.skillbundles.findOne({ name: b.name });
  if (!existing) {
    db.skillbundles.insertOne({
      name: b.name,
      description: b.desc,
      skillIds: b.skillIds.length ? b.skillIds : [teachSkills[0]._id],
      isOfficial: b.isOfficial,
      createdBy: u1._id,
      votes: Math.floor(Math.random() * 20),
      votedBy: allUserIds.slice(0, 3),
      coverImage: 'https://example.com/bundle.jpg',
      createdAt: past(15),
      updatedAt: new Date(),
    });
  }
});
print('SkillBundles: 2 ready');

// ============================================================
// 24. BLOCK OUT DATES
// ============================================================
const blockDates = [];
allUserIds.forEach((uid, i) => {
  for (let d = 0; d < 3; d++) {
    const date = future(d + 1);
    date.setHours(0,0,0,0);
    const existing = db.blockoutdates.findOne({ userId: uid, date });
    if (!existing) {
      db.blockoutdates.insertOne({
        userId: uid,
        date: date,
        reason: pick(['Vacation', 'Family event', 'Work commitment', 'Personal day']),
        createdAt: past(5),
      });
      blockDates.push({ userId: uid, date });
    }
  }
});
print('BlockOutDates: ' + blockDates.length + ' ready');

// ============================================================
// 25. LEARNER REQUESTS (all statuses)
// ============================================================
const lrStatuses = ['open', 'filled', 'expired', 'deleted'];
const learnerRequests = [];
lrStatuses.forEach((status, i) => {
  const lr = {
    authorId: allUserIds[i],
    skillName: pick(['Piano', 'Yoga', 'Carpentry', 'Digital Marketing']),
    categoryName: categories[i % categories.length].name,
    description: `Looking for someone to teach me. Status: ${status}.`,
    city: u1.location.city.toLowerCase(),
    neighborhood: u1.location.neighborhood.toLowerCase(),
    format: i % 2 === 0 ? 'in-person' : 'online',
    availability: ['weekday evenings', 'weekend mornings'],
    status: status,
    responsesCount: status === 'filled' ? 3 : status === 'expired' ? 0 : Math.floor(Math.random() * 5),
    createdAt: past(Math.floor(Math.random() * 20)),
    updatedAt: new Date(),
  };
  db.learnerrequests.insertOne(lr);
  learnerRequests.push(lr);
});
print('LearnerRequests: ' + learnerRequests.length + ' ready');

// ============================================================
// 26. SESSION NOTES
// ============================================================
const sessionNotes = [];
connections.filter(c => c.status === 'completed').slice(0, 4).forEach((conn, i) => {
  const note = {
    connectionId: conn._id,
    userId: conn.requesterId,
    content: `Session notes #${i + 1}: Covered key topics and practiced exercises.`,
    createdAt: past(5),
    updatedAt: new Date(),
  };
  const existing = db.sessionnotes.findOne({ connectionId: note.connectionId, userId: note.userId });
  if (!existing) { db.sessionnotes.insertOne(note); sessionNotes.push(note); }
});
print('SessionNotes: ' + sessionNotes.length + ' ready');

// ============================================================
// 27. TIPS (all statuses)
// ============================================================
const tipStatuses = ['pending', 'completed', 'failed', 'refunded'];
const tips = [];
tipStatuses.forEach((status, i) => {
  const tip = {
    payerId: allUserIds[i],
    payeeId: allUserIds[(i + 1) % 4],
    connectionId: connections[0]._id,
    amount: (i + 1) * 500,
    currency: 'usd',
    stripePaymentIntentId: `pi_${Date.now()}_${i}`,
    status: status,
    platformFee: Math.floor((i + 1) * 500 * 0.05),
    createdAt: past(Math.floor(Math.random() * 10)),
    updatedAt: new Date(),
  };
  db.tips.insertOne(tip);
  tips.push(tip);
});
print('Tips: ' + tips.length + ' ready');

// ============================================================
// 28. COURSES (draft, published, archived)
// ============================================================
const courseStatuses = ['draft', 'published', 'archived'];
const courses = [];
courseStatuses.forEach((status, i) => {
  const skill = teachSkills[i % teachSkills.length];
  const course = {
    teacherId: allUserIds[i],
    skillId: skill._id,
    title: `${skill.skillName} Mastery Course`,
    description: `A comprehensive course on ${skill.skillName}.`,
    sessions: [
      { title: 'Introduction', description: 'Getting started.', objectives: ['Understand basics'], order: 1, estimatedMinutes: 30 },
      { title: 'Core Concepts', description: 'Deep dive.', objectives: ['Master fundamentals'], order: 2, estimatedMinutes: 45 },
      { title: 'Advanced Topics', description: 'Expert level.', objectives: ['Apply advanced techniques'], order: 3, estimatedMinutes: 60 },
    ],
    maxEnrollments: 20,
    enrollmentCount: status === 'published' ? 8 : status === 'archived' ? 20 : 0,
    status: status,
    totalEstimatedMinutes: 135,
    createdAt: past(30),
    updatedAt: new Date(),
  };
  const existing = db.courses.findOne({ teacherId: course.teacherId, title: course.title });
  if (!existing) { db.courses.insertOne(course); courses.push(course); }
});
print('Courses: ' + courses.length + ' ready');

// ============================================================
// 29. COURSE ENROLLMENTS (all statuses)
// ============================================================
const enrollStatuses = ['enrolled', 'in_progress', 'completed', 'dropped'];
const enrollments = [];
enrollStatuses.forEach((status, i) => {
  if (!courses[i]) return;
  const enrollment = {
    courseId: courses[i]._id,
    learnerId: allUserIds[(i + 1) % 4],
    status: status,
    progress: status === 'completed'
      ? courses[i].sessions.map((s, si) => ({ sessionIndex: si, completed: true, completedAt: past(5), notes: 'Done!' }))
      : status === 'in_progress'
      ? [{ sessionIndex: 0, completed: true, completedAt: past(10) }]
      : [],
    startedAt: past(20),
    completedAt: status === 'completed' ? past(3) : undefined,
    certificateId: status === 'completed' ? `CERT_${Date.now()}` : undefined,
    createdAt: past(20),
    updatedAt: new Date(),
  };
  const existing = db.courseenrollments.findOne({ courseId: enrollment.courseId, learnerId: enrollment.learnerId });
  if (!existing) { db.courseenrollments.insertOne(enrollment); enrollments.push(enrollment); }
});
print('CourseEnrollments: ' + enrollments.length + ' ready');

// ============================================================
// 30. CHALLENGES (all statuses)
// ============================================================
const challengeStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
const challenges = [];
challengeStatuses.forEach((status, i) => {
  const ch = {
    creatorId: allUserIds[i],
    title: `${categories[i % categories.length].name} Challenge #${i + 1}`,
    description: `A ${status} challenge in ${categories[i % categories.length].name}.`,
    skillCategory: categories[i % categories.length].name,
    challengeType: pick(['teach', 'learn', 'both']),
    goalDescription: 'Complete 5 skill sessions',
    goalTarget: 5,
    startDate: status === 'completed' || status === 'cancelled' ? past(30) : future(1),
    endDate: status === 'completed' || status === 'cancelled' ? past(1) : future(30),
    status: status,
    participants: allUserIds.slice(0, i + 2).map(uid => ({
      userId: uid,
      joinedAt: past(20),
      progress: status === 'completed' ? 5 : Math.floor(Math.random() * 5),
      completedAt: status === 'completed' ? past(2) : undefined,
    })),
    badgeName: `${categories[i % categories.length].name} Champion`,
    badgeIcon: '🏆',
    maxParticipants: 50,
    createdAt: past(30),
    updatedAt: new Date(),
  };
  db.challenges.insertOne(ch);
  challenges.push(ch);
});
print('Challenges: ' + challenges.length + ' ready');

// ============================================================
// 31. MENTORSHIPS (all statuses)
// ============================================================
const mentorStatuses = ['pending', 'active', 'paused', 'completed', 'cancelled'];
const mentorships = [];
mentorStatuses.forEach((status, i) => {
  const skill = teachSkills[i % teachSkills.length];
  const m = {
    mentorId: allUserIds[i % 2],
    menteeId: allUserIds[(i + 2) % 4],
    skillId: skill._id,
    status: status,
    goals: [
      { title: 'Goal 1', description: 'Master basics', targetDate: future(30), completed: status === 'completed', completedAt: status === 'completed' ? past(2) : undefined },
      { title: 'Goal 2', description: 'Apply in real projects', targetDate: future(60), completed: false },
    ],
    checkIns: [
      { date: past(10), notes: 'Good progress!', mentorNotes: 'Needs more practice.' },
      { date: past(3), notes: 'Getting better.', mentorNotes: 'On track.' },
    ],
    startDate: status !== 'pending' ? past(20) : undefined,
    targetEndDate: future(60),
    completedAt: status === 'completed' ? past(2) : undefined,
    durationMonths: 3,
    meetingFrequency: pick(['weekly', 'biweekly', 'monthly']),
    createdAt: past(25),
    updatedAt: new Date(),
  };
  db.mentorships.insertOne(m);
  mentorships.push(m);
});
print('Mentorships: ' + mentorships.length + ' ready');

// ============================================================
// 32. SHOWCASES (with likes and comments)
// ============================================================
const showcases = [];
allUserIds.forEach((uid, i) => {
  const sc = {
    userId: uid,
    skillId: insertedSkills[i * 2]?._id,
    title: `Showcase: ${insertedSkills[i * 2]?.skillName || 'My Skill'} Project`,
    description: `Here is my latest project showcasing ${insertedSkills[i * 2]?.skillName || 'my skills'}.`,
    media: [{ url: 'https://example.com/showcase.jpg', publicId: `showcase_${i}`, caption: 'My work' }],
    likes: allUserIds.filter((_, j) => j !== i).map(id => ({ userId: id, createdAt: past(1) })),
    likeCount: 3,
    commentCount: i + 1,
    isDeleted: false,
    createdAt: past(Math.floor(Math.random() * 14)),
    updatedAt: new Date(),
  };
  db.showcases.insertOne(sc);
  showcases.push(sc);
});
print('Showcases: ' + showcases.length + ' ready');

// ============================================================
// 33. WEBHOOKS (all statuses)
// ============================================================
const whStatuses = ['active', 'disabled', 'failed'];
const webhooks = [];
whStatuses.forEach((status, i) => {
  const wh = {
    ownerId: allUserIds[i],
    url: `https://example.com/webhook/${i}`,
    events: ['session.completed', 'member.joined'],
    secret: `wh_secret_${Date.now()}_${i}`,
    status: status,
    failCount: status === 'failed' ? 5 : 0,
    lastTriggeredAt: past(2),
    lastSuccessAt: status !== 'failed' ? past(2) : undefined,
    logs: [
      { event: 'session.completed', payload: { sessionId: '123' }, statusCode: status === 'failed' ? 500 : 200, success: status !== 'failed', error: status === 'failed' ? 'Timeout' : undefined, attemptedAt: past(2) },
    ],
    createdAt: past(15),
    updatedAt: new Date(),
  };
  db.webhooks.insertOne(wh);
  webhooks.push(wh);
});
print('Webhooks: ' + webhooks.length + ' ready');

// ============================================================
// 34. API KEYS (active + revoked)
// ============================================================
const apiKeys = [];
['active', 'revoked'].forEach((status, i) => {
  const key = {
    ownerId: allUserIds[i],
    key: `sk_live_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
    name: `API Key ${i + 1}`,
    scopes: ['skills:read', 'stats:read', 'users:read'],
    status: status,
    rateLimit: 100,
    requestCount: Math.floor(Math.random() * 500),
    lastUsedAt: past(1),
    expiresAt: future(90),
    createdAt: past(30),
    updatedAt: new Date(),
  };
  db.apikeys.insertOne(key);
  apiKeys.push(key);
});
print('ApiKeys: ' + apiKeys.length + ' ready');

// ============================================================
// 35. CALENDAR INTEGRATIONS (all sync statuses)
// ============================================================
const calStatuses = ['active', 'pending', 'error', 'disabled'];
const calendars = [];
calStatuses.forEach((status, i) => {
  const cal = {
    userId: allUserIds[i],
    provider: i % 2 === 0 ? 'google' : 'outlook',
    accessToken: `cal_access_${Date.now()}_${i}`,
    refreshToken: `cal_refresh_${Date.now()}_${i}`,
    calendarId: `cal_id_${i}`,
    calendarName: `${i % 2 === 0 ? 'Google' : 'Outlook'} Calendar`,
    syncStatus: status,
    lastSyncedAt: status === 'active' ? past(0) : status === 'error' ? past(5) : undefined,
    syncToken: status === 'active' ? `sync_token_${i}` : undefined,
    events: [
      { externalId: `ext_${i}`, title: 'Skill Session', start: future(2), end: future(2), description: 'Practice session', location: 'Online', connectionId: connections[0]._id },
    ],
    createdAt: past(20),
    updatedAt: new Date(),
  };
  db.calendarintegrations.insertOne(cal);
  calendars.push(cal);
});
print('CalendarIntegrations: ' + calendars.length + ' ready');

// ============================================================
// 36. BOT INSTALLATIONS (all statuses)
// ============================================================
const botStatuses = ['active', 'disabled', 'error'];
const bots = [];
botStatuses.forEach((status, i) => {
  const bot = {
    externalId: `bot_ext_${i}`,
    name: `${i % 2 === 0 ? 'Slack' : 'Discord'} Bot`,
    platform: i % 2 === 0 ? 'slack' : 'discord',
    accessToken: `bot_access_${Date.now()}_${i}`,
    botToken: `bot_token_${i}`,
    teamId: `team_${i}`,
    teamName: `${i % 2 === 0 ? 'Slack' : 'Discord'} Team ${i}`,
    channelId: `ch_${i}`,
    channelName: `#skill-${i % 2 === 0 ? 'slack' : 'discord'}`,
    installedBy: allUserIds[i],
    status: status,
    lastUsedAt: status === 'active' ? past(0) : undefined,
    commandCount: Math.floor(Math.random() * 100),
    createdAt: past(15),
    updatedAt: new Date(),
  };
  db.botinstallations.insertOne(bot);
  bots.push(bot);
});
print('BotInstallations: ' + bots.length + ' ready');

// ============================================================
// 37. FRIENDSHIPS (all statuses)
// ============================================================
const friendStatuses = ['pending', 'accepted', 'declined', 'blocked'];
const friendships = [];
const friendPairs = [[u1,u2],[u2,u3],[u1,u4],[u3,u4]];
friendStatuses.forEach((status, i) => {
  if (!friendPairs[i]) return;
  const [req, add] = friendPairs[i];
  const existing = db.friendships.findOne({ requesterId: req._id, addresseeId: add._id });
  if (!existing) {
    const f = {
      requesterId: req._id,
      addresseeId: add._id,
      status: status,
      requesterTier: 'friend',
      addresseeTier: status === 'accepted' ? 'close_friend' : 'friend',
      showStreakTo: { requester: true, addressee: status === 'accepted' },
      metVia: pick(['skill_session', 'friend_request', 'group_session']),
      sharedSkillId: teachSkills[i % teachSkills.length]._id,
      directMessageRoomId: status === 'accepted' ? `dm_${req._id}_${add._id}` : undefined,
      acceptedAt: status === 'accepted' ? past(5) : undefined,
      declinedAt: status === 'declined' ? past(3) : undefined,
      expiresAt: status === 'pending' ? future(7) : undefined,
      createdAt: past(10),
      updatedAt: new Date(),
    };
    db.friendships.insertOne(f);
    friendships.push(f);
  }
});
print('Friendships: ' + friendships.length + ' ready');

// ============================================================
// 38. ACTIVITY EVENTS (all 15 event types)
// ============================================================
const eventTypes = [
  'skill_added', 'skill_updated', 'session_completed', 'session_scheduled',
  'review_received', 'badge_earned', 'level_up', 'friend_added',
  'swap_completed', 'group_joined', 'challenge_joined', 'mentorship_started',
  'course_completed', 'showcase_posted', 'journal_entry'
];
const subjectTypes = [
  'skill', 'skill', 'connection', 'connection',
  'review', 'badge', 'streak', 'friendship',
  'swap', 'group_session', 'challenge', 'mentorship',
  'skill', 'skill', 'connection'
];
const activityEvents = [];
eventTypes.forEach((type, i) => {
  const ev = {
    actorId: allUserIds[i % 4],
    eventType: type,
    subjectType: subjectTypes[i],
    subjectId: connections[0]._id,
    preview: {
      title: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subtitle: `${type.replace(/_/g, ' ')} activity`,
      emoji: ['📚', '✏️', '✅', '📅', '⭐', '🏅', '🆙', '👋', '🔄', '👥', '🎯', '🤝', '🎓', '📸', '📝'][i],
    },
    visibility: pick(['public', 'friends', 'close_friends', 'private']),
    reactions: [{ userId: allUserIds[(i + 1) % 4], emoji: pick(emojiPool), createdAt: past(1) }],
    commentCount: Math.floor(Math.random() * 5),
    expiresAt: future(90),
    createdAt: past(Math.floor(Math.random() * 14)),
    updatedAt: new Date(),
  };
  db.activityevents.insertOne(ev);
  activityEvents.push(ev);
});
print('ActivityEvents: ' + activityEvents.length + ' ready');

// ============================================================
// 39. STREAKS (all 3 types)
// ============================================================
const streakTypes = ['teaching', 'learning', 'logging'];
const streaks = [];
streakTypes.forEach((type, i) => {
  allUserIds.forEach((uid, j) => {
    const existing = db.streaks.findOne({ userId: uid, type });
    if (!existing) {
      const s = {
        userId: uid,
        type: type,
        currentStreak: Math.floor(Math.random() * 30) + 1,
        longestStreak: Math.floor(Math.random() * 60) + 5,
        lastActivityDate: past(0),
        streakStartDate: past(30),
        frozenUntil: undefined,
        freezesUsed: 0,
        freezesAvailable: 3,
        milestones: [7, 14, 30],
        createdAt: past(60),
        updatedAt: new Date(),
      };
      db.streaks.insertOne(s);
      streaks.push(s);
    }
  });
});
print('Streaks: ' + streaks.length + ' ready');

// ============================================================
// 40. DIRECT MESSAGES
// ============================================================
const dms = [];
for (let i = 0; i < 6; i++) {
  const dm = {
    senderId: allUserIds[i % 4],
    recipientId: allUserIds[(i + 1) % 4],
    content: `Direct message #${i + 1}: Hey, how are you?`,
    readAt: i < 4 ? past(0) : undefined,
    isDeleted: i === 5,
    createdAt: past(Math.floor(Math.random() * 7)),
    updatedAt: new Date(),
  };
  db.directmessages.insertOne(dm);
  dms.push(dm);
}
print('DirectMessages: ' + dms.length + ' ready');

// ============================================================
// 41. SKILL JOURNALS
// ============================================================
const journals = [];
connections.slice(0, 4).forEach((conn, i) => {
  const j = {
    userId: conn.requesterId,
    connectionId: conn._id,
    prompt: pick(['What did you learn today?', 'What was challenging?', 'What would you do differently?']),
    content: `Journal entry #${i + 1}: Today's session was very productive. I learned new techniques.`,
    mood: Math.floor(Math.random() * 3) + 3,
    isHighlighted: i < 2,
    createdAt: past(Math.floor(Math.random() * 10)),
    updatedAt: new Date(),
  };
  db.skilljournals.insertOne(j);
  journals.push(j);
});
print('SkillJournals: ' + journals.length + ' ready');

// ============================================================
// 42. REQUEST TEMPLATES
// ============================================================
const templates = [];
categories.slice(0, 4).forEach((cat, i) => {
  const t = {
    title: `${cat.name} Template`,
    intro: `Hi! I'm interested in ${cat.name}.`,
    body: `I'd love to learn or teach skills in ${cat.name}. Let us connect!`,
    categoryId: cat._id,
    categoryName: cat.name,
    isActive: true,
    createdBy: allUserIds[i],
    createdAt: past(20),
    updatedAt: new Date(),
  };
  db.requesttemplates.insertOne(t);
  templates.push(t);
});
print('RequestTemplates: ' + templates.length + ' ready');

// ============================================================
// 43. SKILL RADARS
// ============================================================
const radars = [];
allUserIds.forEach((uid, i) => {
  const existing = db.skillradars.findOne({ userId: uid });
  if (!existing) {
    const r = {
      userId: uid,
      signals: [
        { type: 'search', category: categories[i % categories.length].name, skillName: 'cooking', format: 'in-person', timestamp: past(3), weight: 0.8 },
        { type: 'view', category: categories[(i+1) % categories.length].name, skillName: 'photography', format: 'online', timestamp: past(2), weight: 0.5 },
        { type: 'connection_request', category: categories[(i+2) % categories.length].name, skillName: 'plumbing', format: 'in-person', timestamp: past(1), weight: 0.9 },
      ],
      intents: [
        {
          category: categories[i % categories.length].name,
          inferredSkillNames: ['cooking', 'baking'],
          confidence: 0.75,
          preferredFormat: 'in-person',
          preferredRadius: 10,
          reasoning: 'Based on search and view signals',
          status: 'active',
          matchCount: Math.floor(Math.random() * 10),
        },
      ],
      manualRadars: [
        {
          name: 'My Radar',
          filters: { category: categories[i % categories.length].name, format: 'in-person', type: 'teach' },
          lastAlertedAt: past(1),
          alertedSkillIds: [teachSkills[i % teachSkills.length]._id],
        },
      ],
      createdAt: past(30),
      updatedAt: new Date(),
    };
    db.skillradars.insertOne(r);
    radars.push(r);
  }
});
print('SkillRadars: ' + radars.length + ' ready');

// ============================================================
// 44. SWAP READY MATCHES (all statuses)
// ============================================================
const srmStatuses = ['available', 'hidden', 'proposed', 'accepted', 'declined'];
const swapMatches = [];
srmStatuses.forEach((status, i) => {
  if (teachSkills[i] && teachSkills[(i + 2) % teachSkills.length]) {
    const existing = db.swapreadymatches.findOne({
      userAId: allUserIds[i % 4],
      userBId: allUserIds[(i + 1) % 4],
      userATeachesSkillId: teachSkills[i % teachSkills.length]._id,
      userBTeachesSkillId: teachSkills[(i + 2) % teachSkills.length]._id,
    });
    if (!existing) {
      const m = {
        userAId: allUserIds[i % 4],
        userBId: allUserIds[(i + 1) % 4],
        userATeachesSkillId: teachSkills[i % teachSkills.length]._id,
        userBTeachesSkillId: teachSkills[(i + 2) % teachSkills.length]._id,
        status: status,
        lastMatchDate: past(3),
        createdAt: past(10),
        updatedAt: new Date(),
      };
      db.swapreadymatches.insertOne(m);
      swapMatches.push(m);
    }
  }
});
print('SwapReadyMatches: ' + swapMatches.length + ' ready');

// ============================================================
// 45. SKILL DEMAND SNAPSHOTS
// ============================================================
const snap1 = {
  skills: [
    { skillName: 'Cooking', categoryName: 'Food & Cooking', demandScore: 85, topRegions: [{ name: 'Dhaka', count: 42 }, { name: 'Chittagong', count: 18 }] },
    { skillName: 'Photography', categoryName: 'Photography & Visual Arts', demandScore: 72, topRegions: [{ name: 'Dhaka', count: 35 }, { name: 'Sylhet', count: 12 }] },
    { skillName: 'Plumbing', categoryName: 'Home & Garden', demandScore: 65, topRegions: [{ name: 'Dhaka', count: 28 }] },
    { skillName: 'English', categoryName: 'Languages & Communication', demandScore: 90, topRegions: [{ name: 'Dhaka', count: 55 }, { name: 'Rajshahi', count: 22 }] },
  ],
  windowStart: past(7),
  windowEnd: past(0),
  createdAt: past(0),
  updatedAt: new Date(),
};
const existingSnap = db.skilldemandsnapshots.findOne({});
if (!existingSnap) db.skilldemandsnapshots.insertOne(snap1);
print('SkillDemandSnapshots: 1 ready');

// ============================================================
// 46. MIGRATION LOGS (already has data, add one more)
// ============================================================
const existingMigration = db.migrationlogs.findOne({ name: 'seedAllData_v1' });
if (!existingMigration) {
  db.migrationlogs.insertOne({
    name: 'seedAllData_v1',
    completedAt: new Date(),
    migrated: 0,
    users: users.length,
  });
}
print('MigrationLogs: updated');

// ============================================================
// FINAL SUMMARY
// ============================================================
print('\n========== SEED COMPLETE ==========');
const allColls = db.getCollectionNames();
allColls.forEach(coll => {
  const count = db[coll].countDocuments();
  print(coll + ': ' + count + ' documents');
});
print('Total collections: ' + allColls.length);
