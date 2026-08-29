// src/templates.ts

export interface RoleTemplate {
  id: 'frontend' | 'ai' | 'backend' | 'fullstack';
  label: string;
  badge: string;
  subject: string;
  body: string;
}

export const FRESH_TEMPLATE = {
  subject: 'Application for Full Stack Engineer | 3+ Years Experience | React.js, Next.js, Node.js',
  body: `Dear Hiring Team,

I am writing to express my interest in Full Stack Engineer / Full Stack Developer opportunities at your organization.

I am a Full Stack Engineer with 3+ years of experience working with React.js, Next.js, TypeScript, JavaScript, Node.js, Express.js, MongoDB, MySQL, Redis, REST APIs, and Microservices.

In my current role, I work on enterprise, banking, SaaS, and high-volume bill-payment platforms, with hands-on experience in PayU and Razorpay integrations, API development, performance optimization, caching, dashboards, and scalable production applications.

I am looking for an opportunity where I can contribute to building scalable, reliable, and high-performance full-stack applications while continuing to grow as an engineer.

Please find my resume attached for your consideration. I would appreciate the opportunity to discuss any relevant current or upcoming opportunities.

Thank you for your time and consideration.

Best regards,
Satish Kumar Chaubey
Full Stack Engineer | MERN
Ghaziabad, Uttar Pradesh, India
+91 8299805407
satishchaubey02@gmail.com
LinkedIn: linkedin.com/in/satish-chaubey
GitHub: github.com/satishchaubey`
};

export const FOLLOWUP_TEMPLATE = {
  subject: 'Follow-Up: Application for Full Stack Engineer | Satish Kumar Chaubey (3+ Yrs Exp)',
  body: `Dear Hiring Team,

I hope this email finds you well.

I am following up on my previous application for Full Stack Engineer / Full Stack Developer opportunities at your organization. 

I remain very interested in contributing to your engineering team with my 3+ years of experience in React.js, Next.js, Node.js, Express.js, TypeScript, and high-performance SaaS / Fintech platform development.

I have attached my resume again for your quick reference. I would welcome the opportunity to discuss how my background aligns with your current or upcoming technical hiring needs.

Thank you again for your time and consideration.

Best regards,
Satish Kumar Chaubey
Full Stack Engineer | MERN
Ghaziabad, Uttar Pradesh, India
+91 8299805407
satishchaubey02@gmail.com
LinkedIn: linkedin.com/in/satish-chaubey
GitHub: github.com/satishchaubey`
};

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'fullstack',
    label: 'Full Stack Developer',
    badge: 'MERN / Next.js',
    subject: FRESH_TEMPLATE.subject,
    body: FRESH_TEMPLATE.body
  },
  {
    id: 'frontend',
    label: 'Frontend Developer',
    badge: 'React / Next.js',
    subject: FRESH_TEMPLATE.subject,
    body: FRESH_TEMPLATE.body
  },
  {
    id: 'ai',
    label: 'AI Developer',
    badge: 'LLM / GenAI',
    subject: FRESH_TEMPLATE.subject,
    body: FRESH_TEMPLATE.body
  },
  {
    id: 'backend',
    label: 'Backend Developer',
    badge: 'Node.js / Express',
    subject: FRESH_TEMPLATE.subject,
    body: FRESH_TEMPLATE.body
  }
];
