// AI-powered grievance classification and priority scoring engine

export interface Complaint {
  id: string;
  text: string;
  location: string;
  category: string;
  subCategory: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
  department: string;
  status: 'received' | 'assigned' | 'in-progress' | 'resolved';
  sentiment: 'angry' | 'distressed' | 'neutral' | 'calm';
  urgencyKeywords: string[];
  impactLevel: number;
  estimatedAffected: number;
  submittedAt: Date;
  resolvedAt?: Date;
  clusterId?: string;
  impactPrediction: string;
}

// Category mappings
const CATEGORIES = {
  sanitation: { name: 'Sanitation', department: 'Municipal Corporation', icon: '🗑️' },
  roads: { name: 'Roads & Infrastructure', department: 'Public Works Department', icon: '🛣️' },
  water: { name: 'Water Supply', department: 'Water Department', icon: '💧' },
  electricity: { name: 'Electricity', department: 'Power Corporation', icon: '⚡' },
  safety: { name: 'Public Safety', department: 'Police Department', icon: '🚔' },
  healthcare: { name: 'Healthcare', department: 'Health Department', icon: '🏥' },
  education: { name: 'Education', department: 'Education Department', icon: '📚' },
  transport: { name: 'Transport', department: 'Transport Authority', icon: '🚌' },
  environment: { name: 'Environment', department: 'Environment Agency', icon: '🌳' },
  administrative: { name: 'Administrative', department: 'District Collector Office', icon: '📋' },
};

// Urgency keywords with weights
const URGENCY_KEYWORDS: Record<string, number> = {
  'emergency': 10, 'urgent': 9, 'critical': 10, 'danger': 10, 'accident': 10,
  'fire': 10, 'flood': 9, 'collapse': 10, 'death': 10, 'dying': 10,
  'immediately': 8, 'asap': 8, 'now': 7, 'today': 6, 'help': 6,
  'stuck': 7, 'trapped': 10, 'injured': 9, 'bleeding': 9, 'unconscious': 10,
  'ambulance': 9, 'hospital': 7, 'children': 6, 'elderly': 6, 'disabled': 6,
  'days': 4, 'weeks': 5, 'months': 3, 'years': 2,
  'overflow': 6, 'broken': 5, 'not working': 5, 'failed': 5,
  'no water': 7, 'no electricity': 7, 'no power': 7, 'blackout': 8,
  'pothole': 4, 'garbage': 4, 'stink': 5, 'smell': 4,
};

// Sentiment indicators
const SENTIMENT_INDICATORS = {
  angry: ['frustrated', 'angry', 'furious', 'outraged', 'fed up', 'disgusted', 'ridiculous', 'unacceptable', 'shameful'],
  distressed: ['please', 'help', 'desperate', 'worried', 'scared', 'afraid', 'suffering', 'dying', 'begging'],
  neutral: ['request', 'inform', 'report', 'noticed', 'observed'],
  calm: ['suggest', 'recommend', 'would appreciate', 'kindly'],
};

// Category keywords for classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sanitation: ['garbage', 'waste', 'trash', 'dump', 'dirty', 'filth', 'drain', 'sewer', 'sewage', 'stink', 'smell', 'cleaning', 'sweeper'],
  roads: ['road', 'pothole', 'street', 'highway', 'bridge', 'footpath', 'pavement', 'traffic signal', 'streetlight', 'divider'],
  water: ['water', 'supply', 'tap', 'pipeline', 'leak', 'contaminated', 'drinking', 'tank', 'bore', 'well'],
  electricity: ['electricity', 'power', 'light', 'transformer', 'wire', 'pole', 'meter', 'bill', 'blackout', 'outage', 'voltage'],
  safety: ['police', 'crime', 'theft', 'robbery', 'harassment', 'violence', 'fight', 'illegal', 'threat', 'suspicious', 'accident'],
  healthcare: ['hospital', 'clinic', 'doctor', 'medicine', 'ambulance', 'health', 'disease', 'epidemic', 'dengue', 'malaria', 'covid'],
  education: ['school', 'college', 'teacher', 'student', 'education', 'exam', 'admission', 'fees', 'scholarship'],
  transport: ['bus', 'train', 'metro', 'auto', 'taxi', 'fare', 'ticket', 'route', 'station', 'stop'],
  environment: ['tree', 'pollution', 'air', 'noise', 'factory', 'smoke', 'green', 'park', 'animal', 'wildlife'],
  administrative: ['certificate', 'document', 'license', 'permit', 'registration', 'office', 'clerk', 'delay', 'bribe', 'corruption'],
};

// Classify complaint text
export function classifyComplaint(text: string): { category: string; subCategory: string; confidence: number } {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedCategory = 'administrative';
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += keyword.length; // Longer keywords = more specific = higher score
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }
  
  // Determine sub-category based on specific keywords
  let subCategory = 'General Issue';
  const subCategories: Record<string, Record<string, string[]>> = {
    sanitation: {
      'Garbage Collection': ['garbage', 'waste', 'trash', 'collection'],
      'Drainage Issue': ['drain', 'sewer', 'sewage', 'clogged'],
      'Open Defecation': ['defecation', 'toilet', 'public'],
    },
    roads: {
      'Pothole': ['pothole', 'crater', 'hole'],
      'Street Light': ['streetlight', 'light', 'dark'],
      'Traffic Signal': ['traffic signal', 'signal'],
      'Road Damage': ['broken', 'damaged', 'crack'],
    },
    water: {
      'No Water Supply': ['no water', 'supply', 'dry'],
      'Pipeline Leakage': ['leak', 'burst', 'pipeline'],
      'Contaminated Water': ['contaminated', 'dirty', 'color', 'smell'],
    },
    electricity: {
      'Power Outage': ['outage', 'blackout', 'no power', 'no electricity'],
      'Transformer Issue': ['transformer', 'burst', 'fire'],
      'Billing Issue': ['bill', 'meter', 'reading'],
    },
    safety: {
      'Crime Report': ['theft', 'robbery', 'crime'],
      'Harassment': ['harassment', 'stalking', 'threat'],
      'Accident': ['accident', 'collision', 'hit'],
    },
  };
  
  if (subCategories[detectedCategory]) {
    for (const [sub, keywords] of Object.entries(subCategories[detectedCategory])) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        subCategory = sub;
        break;
      }
    }
  }
  
  const confidence = Math.min(0.95, 0.5 + (maxScore / 50));
  
  return { category: detectedCategory, subCategory, confidence };
}

// Analyze sentiment
export function analyzeSentiment(text: string): 'angry' | 'distressed' | 'neutral' | 'calm' {
  const lowerText = text.toLowerCase();
  
  for (const [sentiment, indicators] of Object.entries(SENTIMENT_INDICATORS)) {
    if (indicators.some(ind => lowerText.includes(ind))) {
      return sentiment as 'angry' | 'distressed' | 'neutral' | 'calm';
    }
  }
  
  return 'neutral';
}

// Extract urgency keywords
export function extractUrgencyKeywords(text: string): { keywords: string[]; score: number } {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  let totalScore = 0;
  
  for (const [keyword, weight] of Object.entries(URGENCY_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      totalScore += weight;
    }
  }
  
  return { keywords: foundKeywords, score: totalScore };
}

// Calculate time-based urgency from text
function extractTimeFactor(text: string): number {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/since\s+\d+\s+days?/)) {
    const days = parseInt(lowerText.match(/since\s+(\d+)\s+days?/)?.[1] || '0');
    if (days >= 7) return 3;
    if (days >= 3) return 2;
    return 1;
  }
  
  if (lowerText.match(/since\s+\d+\s+weeks?/)) return 4;
  if (lowerText.match(/since\s+\d+\s+months?/)) return 5;
  
  return 0;
}

// Estimate affected population based on keywords
function estimateAffectedPopulation(text: string, location: string): number {
  const lowerText = text.toLowerCase();
  
  // Area-based estimation
  if (lowerText.includes('entire area') || lowerText.includes('whole colony') || lowerText.includes('full street')) {
    return 500;
  }
  if (lowerText.includes('building') || lowerText.includes('apartment')) {
    return 100;
  }
  if (lowerText.includes('street') || lowerText.includes('road')) {
    return 200;
  }
  if (lowerText.includes('ward') || lowerText.includes('sector')) {
    return 1000;
  }
  
  // Default single household
  return 10;
}

// Calculate priority score and level
export function calculatePriority(
  text: string,
  category: string,
  sentiment: 'angry' | 'distressed' | 'neutral' | 'calm',
  urgencyKeywords: string[],
  urgencyScore: number,
  estimatedAffected: number
): { priority: 'critical' | 'high' | 'medium' | 'low'; score: number } {
  let score = 0;
  
  // Urgency keyword score (max 40 points)
  score += Math.min(40, urgencyScore * 2);
  
  // Sentiment score (max 20 points)
  const sentimentScores = { angry: 15, distressed: 20, neutral: 5, calm: 0 };
  score += sentimentScores[sentiment];
  
  // Category risk factor (max 20 points)
  const categoryRisk: Record<string, number> = {
    safety: 20, healthcare: 18, electricity: 15, water: 14,
    roads: 10, sanitation: 10, transport: 8, education: 6,
    environment: 8, administrative: 4,
  };
  score += categoryRisk[category] || 5;
  
  // Time factor (max 10 points)
  score += extractTimeFactor(text) * 2;
  
  // Impact factor based on affected population (max 10 points)
  if (estimatedAffected >= 500) score += 10;
  else if (estimatedAffected >= 100) score += 7;
  else if (estimatedAffected >= 50) score += 5;
  else score += 2;
  
  // Normalize to 0-100
  score = Math.min(100, score);
  
  // Determine priority level
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (score >= 75) priority = 'critical';
  else if (score >= 50) priority = 'high';
  else if (score >= 25) priority = 'medium';
  else priority = 'low';
  
  return { priority, score };
}

// Generate impact prediction
export function predictImpact(
  category: string,
  priorityScore: number,
  estimatedAffected: number,
  daysUnresolved: number = 0
): string {
  const impacts: Record<string, string[]> = {
    sanitation: [
      'Disease outbreak risk increases by 15% per week',
      'Dengue/malaria breeding grounds may develop',
      'Public health hazard affecting nearby schools and hospitals',
    ],
    roads: [
      'Accident probability increases by 20% daily',
      'Emergency vehicle access compromised',
      'Economic loss from vehicle damage and delays',
    ],
    water: [
      'Waterborne disease outbreak risk',
      'Hygiene crisis affecting ' + estimatedAffected + ' residents',
      'Critical impact on healthcare facilities in area',
    ],
    electricity: [
      'Safety hazards from exposed wiring',
      'Medical equipment failure risk in nearby hospitals',
      'Economic impact on businesses and livelihoods',
    ],
    safety: [
      'Crime escalation risk in unpatrolled areas',
      'Women and children safety compromised',
      'Community trust in governance affected',
    ],
    healthcare: [
      'Patient care delays may cause fatalities',
      'Disease spread to ' + Math.round(estimatedAffected * 1.5) + ' more people',
      'Healthcare system overload imminent',
    ],
  };
  
  const categoryImpacts = impacts[category] || ['General public inconvenience', 'Citizen trust erosion'];
  
  if (priorityScore >= 75) {
    return `⚠️ CRITICAL: ${categoryImpacts[0]}. Immediate action required within 24 hours.`;
  } else if (priorityScore >= 50) {
    return `🔴 HIGH: ${categoryImpacts[1]}. Resolution needed within 48 hours.`;
  } else if (priorityScore >= 25) {
    return `🟡 MEDIUM: ${categoryImpacts[2] || categoryImpacts[0]}. Target resolution: 1 week.`;
  }
  
  return `🟢 LOW: Monitor situation. Standard processing time applicable.`;
}

// Get department for category
export function getDepartment(category: string): string {
  return CATEGORIES[category as keyof typeof CATEGORIES]?.department || 'District Collector Office';
}

// Get category info
export function getCategoryInfo(category: string) {
  return CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.administrative;
}

// Generate unique complaint ID
export function generateComplaintId(): string {
  const prefix = 'SMD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Process a new complaint through the AI pipeline
export function processComplaint(text: string, location: string): Complaint {
  const { category, subCategory, confidence } = classifyComplaint(text);
  const sentiment = analyzeSentiment(text);
  const { keywords: urgencyKeywords, score: urgencyScore } = extractUrgencyKeywords(text);
  const estimatedAffected = estimateAffectedPopulation(text, location);
  const { priority, score: priorityScore } = calculatePriority(
    text, category, sentiment, urgencyKeywords, urgencyScore, estimatedAffected
  );
  const department = getDepartment(category);
  const impactPrediction = predictImpact(category, priorityScore, estimatedAffected);
  
  return {
    id: generateComplaintId(),
    text,
    location,
    category,
    subCategory,
    priority,
    priorityScore,
    department,
    status: 'received',
    sentiment,
    urgencyKeywords,
    impactLevel: Math.round(priorityScore / 25) + 1,
    estimatedAffected,
    submittedAt: new Date(),
    impactPrediction,
  };
}

// Find similar complaints for clustering
export function findSimilarComplaints(newComplaint: Complaint, existingComplaints: Complaint[]): Complaint[] {
  return existingComplaints.filter(complaint => 
    complaint.category === newComplaint.category &&
    complaint.location === newComplaint.location &&
    complaint.status !== 'resolved' &&
    complaint.id !== newComplaint.id
  );
}

// Cluster similar complaints
export function clusterComplaints(complaints: Complaint[]): Map<string, Complaint[]> {
  const clusters = new Map<string, Complaint[]>();
  
  for (const complaint of complaints) {
    const clusterKey = `${complaint.category}-${complaint.location}`;
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(complaint);
  }
  
  return clusters;
}

export { CATEGORIES };
