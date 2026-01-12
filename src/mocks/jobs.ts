export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  type: string;
  workMode: string;
  location: string;
  experience: string;
  description: string;
  postedAt: string;
  tags: string[];
}

export const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "TechFlow",
    logo: "https://ui-avatars.com/api/?name=TechFlow&background=random",
    salary: "$140k - $180k",
    type: "Full-time",
    workMode: "Remote",
    location: "San Francisco, CA",
    experience: "5+ years",
    description:
      "We are looking for an experienced Frontend Engineer to lead our core product team. You will be working with React, TypeScript, and modern web technologies to build scalable and performant user interfaces.",
    postedAt: "2 days ago",
    tags: ["React", "TypeScript", "Next.js"],
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Creativv",
    logo: "https://ui-avatars.com/api/?name=Creativv&background=random",
    salary: "$120k - $160k",
    type: "Full-time",
    workMode: "Hybrid",
    location: "New York, NY",
    experience: "3+ years",
    description:
      "Join our design team to craft beautiful and intuitive user experiences. You will collaborate closely with product managers and engineers to define and implement innovative solutions.",
    postedAt: "1 day ago",
    tags: ["Figma", "UI/UX", "Design Systems"],
  },
  {
    id: "3",
    title: "Backend Developer",
    company: "DataStream",
    logo: "https://ui-avatars.com/api/?name=DataStream&background=random",
    salary: "$130k - $170k",
    type: "Contract",
    workMode: "Remote",
    location: "Austin, TX",
    experience: "4+ years",
    description:
      "We need a backend specialist to optimize our data processing pipelines. Experience with Node.js, Python, and AWS is essential for this role.",
    postedAt: "3 days ago",
    tags: ["Node.js", "Python", "AWS"],
  },
  {
    id: "4",
    title: "Marketing Manager",
    company: "GrowthHacks",
    logo: "https://ui-avatars.com/api/?name=GrowthHacks&background=random",
    salary: "$90k - $120k",
    type: "Full-time",
    workMode: "On-site",
    location: "Chicago, IL",
    experience: "3+ years",
    description:
      "Lead our marketing initiatives and drive growth. You will be responsible for strategy, execution, and analysis of marketing campaigns across various channels.",
    postedAt: "Just now",
    tags: ["Marketing", "SEO", "Growth"],
  },
  {
    id: "5",
    title: "Mobile Engineer",
    company: "Appify",
    logo: "https://ui-avatars.com/api/?name=Appify&background=random",
    salary: "$135k - $175k",
    type: "Full-time",
    workMode: "Remote",
    location: "Remote",
    experience: "4+ years",
    description:
      "Build the next generation of mobile apps using React Native. We value clean code, performance, and user-centric design.",
    postedAt: "5 days ago",
    tags: ["React Native", "iOS", "Android"],
  },
];
