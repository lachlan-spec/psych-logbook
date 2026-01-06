// Shared constants across the application
// 8 Core Competencies for Clinical Psychology Endorsement (PBA Guidelines)

export const COMPETENCIES = [
  {
    id: 'knowledge',
    name: 'Knowledge of the Discipline',
    color: 'blue',
    progressColor: '#3b82f6',
    description: 'Core psychological knowledge and theory'
  },
  {
    id: 'ethical',
    name: 'Ethical, Legal and Professional Matters',
    color: 'indigo',
    progressColor: '#6366f1',
    description: 'Professional ethics, legal requirements and conduct'
  },
  {
    id: 'assessment',
    name: 'Psychological Assessment and Measurement',
    color: 'green',
    progressColor: '#10b981',
    description: 'Psychological assessment, testing and evaluation'
  },
  {
    id: 'intervention',
    name: 'Intervention Strategies',
    color: 'purple',
    progressColor: '#8b5cf6',
    description: 'Therapeutic interventions and treatment strategies'
  },
  {
    id: 'research',
    name: 'Research and Evaluation',
    color: 'amber',
    progressColor: '#f59e0b',
    description: 'Research methodology and evidence-based practice'
  },
  {
    id: 'communication',
    name: 'Communication and Interpersonal Relationships',
    color: 'pink',
    progressColor: '#ec4899',
    description: 'Professional communication and relationship skills'
  },
  {
    id: 'diversity',
    name: 'Working with People from Diverse Groups',
    color: 'teal',
    progressColor: '#14b8a6',
    description: 'Cultural competence and working with diversity'
  },
  {
    id: 'lifespan',
    name: 'Practice Across the Lifespan',
    color: 'orange',
    progressColor: '#f97316',
    description: 'Working with clients across all developmental stages'
  }
];

// CPD Tags - Using the same 8 competencies for consistency
// These link CPD activities to competency journals
export const CPD_TAGS = COMPETENCIES.map(comp => ({
  id: comp.id,
  name: comp.name,
  color: comp.color
}));
