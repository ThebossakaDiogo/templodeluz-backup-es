/**
 * Dados e Schemas do Quiz Play & Win
 * Baseado rigorosamente em docs/reference/schema.json e nas especificações visuais de docs/reference/design.json
 */

export interface OptionItem {
  id: string;
  label: string;
}

export interface QuestionItem {
  id: string;
  prompt: string;
  options: OptionItem[];
  correct_option_id: string;
  explanation: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  icon: "geometry" | "flask" | "atom" | "map" | "dna" | "star";
  accent: "violet" | "pink" | "lavender" | "green";
  subtitle?: string;
  questionCount?: number;
}

export interface RecentQuizItem {
  id: string;
  title: string;
  question_count: number;
  status: "completed" | "incomplete";
  icon: "flask" | "map" | "geometry" | "atom";
  score?: string;
}

export interface QuizDefinition {
  id: string;
  title: string;
  question_count: number;
  time_per_question_seconds: number;
  points_per_correct_answer: number;
  allow_back: boolean;
  questions: QuestionItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  points: number;
  quizzesCompleted: number;
  accuracy: number;
}

export const DEFAULT_USER: UserProfile = {
  id: "user_kenzy",
  name: "Kenzy",
  email: "",
  phone: "",
  avatar: "avatar-default",
  points: 200,
  quizzesCompleted: 14,
  accuracy: 95,
};

export const CATEGORIES: CategoryItem[] = [
  {
    id: "math",
    label: "Math",
    icon: "geometry",
    accent: "violet",
    subtitle: "Raciocínio Lógico & Números",
    questionCount: 20,
  },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: "flask",
    accent: "pink",
    subtitle: "Elementos & Reações",
    questionCount: 15,
  },
  {
    id: "physics",
    label: "Physics",
    icon: "atom",
    accent: "lavender",
    subtitle: "Mecânica & Universo",
    questionCount: 15,
  },
];

export const RECENT_QUIZZES: RecentQuizItem[] = [
  {
    id: "biology",
    title: "Biology",
    question_count: 12,
    status: "completed",
    icon: "flask",
    score: "11/12",
  },
  {
    id: "geography",
    title: "Geography",
    question_count: 20,
    status: "incomplete",
    icon: "map",
    score: "Em andamento",
  },
];

export const MATH_QUIZ: QuizDefinition = {
  id: "math",
  title: "Math",
  question_count: 20,
  time_per_question_seconds: 25,
  points_per_correct_answer: 10,
  allow_back: false,
  questions: [
    {
      id: "q1",
      prompt: "What is 12 + 8?",
      options: [
        { id: "a", label: "18" },
        { id: "b", label: "20" },
        { id: "c", label: "22" },
        { id: "d", label: "24" },
      ],
      correct_option_id: "b",
      explanation: "12 + 8 = 20.",
    },
    {
      id: "q2",
      prompt: "What is 9 × 6?",
      options: [
        { id: "a", label: "45" },
        { id: "b", label: "48" },
        { id: "c", label: "54" },
        { id: "d", label: "56" },
      ],
      correct_option_id: "c",
      explanation: "9 × 6 = 54.",
    },
    {
      id: "q3",
      prompt: "What is 72 ÷ 8?",
      options: [
        { id: "a", label: "8" },
        { id: "b", label: "9" },
        { id: "c", label: "10" },
        { id: "d", label: "12" },
      ],
      correct_option_id: "b",
      explanation: "72 ÷ 8 = 9.",
    },
    {
      id: "q4",
      prompt: "Which number is a prime number?",
      options: [
        { id: "a", label: "21" },
        { id: "b", label: "27" },
        { id: "c", label: "29" },
        { id: "d", label: "33" },
      ],
      correct_option_id: "c",
      explanation: "29 has exactly two positive divisors: 1 and 29.",
    },
    {
      id: "q5",
      prompt: "What is 3² + 4²?",
      options: [
        { id: "a", label: "12" },
        { id: "b", label: "18" },
        { id: "c", label: "24" },
        { id: "d", label: "25" },
      ],
      correct_option_id: "d",
      explanation: "3² + 4² = 9 + 16 = 25.",
    },
    {
      id: "q6",
      prompt: "Which 3 numbers have the same answer whether they're added or multiplied together?",
      options: [
        { id: "a", label: "6, 3 and 4" },
        { id: "b", label: "1, 2 and 3" },
        { id: "c", label: "2, 4 and 6" },
        { id: "d", label: "1, 2 and 4" },
      ],
      correct_option_id: "b",
      explanation: "1 + 2 + 3 = 6 and 1 × 2 × 3 = 6.",
    },
    {
      id: "q7",
      prompt: "What is 15% of 200?",
      options: [
        { id: "a", label: "20" },
        { id: "b", label: "25" },
        { id: "c", label: "30" },
        { id: "d", label: "35" },
      ],
      correct_option_id: "c",
      explanation: "0.15 × 200 = 30.",
    },
    {
      id: "q8",
      prompt: "Solve: x + 7 = 19.",
      options: [
        { id: "a", label: "10" },
        { id: "b", label: "11" },
        { id: "c", label: "12" },
        { id: "d", label: "13" },
      ],
      correct_option_id: "c",
      explanation: "x = 19 − 7 = 12.",
    },
    {
      id: "q9",
      prompt: "What is the perimeter of a square with side length 7?",
      options: [
        { id: "a", label: "14" },
        { id: "b", label: "21" },
        { id: "c", label: "28" },
        { id: "d", label: "49" },
      ],
      correct_option_id: "c",
      explanation: "A square has four equal sides, so 4 × 7 = 28.",
    },
    {
      id: "q10",
      prompt: "What is the value of 5 × (3 + 2)?",
      options: [
        { id: "a", label: "15" },
        { id: "b", label: "20" },
        { id: "c", label: "25" },
        { id: "d", label: "30" },
      ],
      correct_option_id: "c",
      explanation: "3 + 2 = 5, then 5 × 5 = 25.",
    },
    {
      id: "q11",
      prompt: "Which fraction is equivalent to 0.75?",
      options: [
        { id: "a", label: "1/2" },
        { id: "b", label: "2/3" },
        { id: "c", label: "3/4" },
        { id: "d", label: "4/5" },
      ],
      correct_option_id: "c",
      explanation: "3 ÷ 4 = 0.75.",
    },
    {
      id: "q12",
      prompt: "What is the next number in the sequence 2, 4, 8, 16, ...?",
      options: [
        { id: "a", label: "20" },
        { id: "b", label: "24" },
        { id: "c", label: "30" },
        { id: "d", label: "32" },
      ],
      correct_option_id: "d",
      explanation: "Each term doubles, so 16 × 2 = 32.",
    },
    {
      id: "q13",
      prompt: "What is 100 − 37?",
      options: [
        { id: "a", label: "53" },
        { id: "b", label: "63" },
        { id: "c", label: "67" },
        { id: "d", label: "73" },
      ],
      correct_option_id: "b",
      explanation: "100 − 37 = 63.",
    },
    {
      id: "q14",
      prompt: "If a triangle has angles 90° and 35°, what is the third angle?",
      options: [
        { id: "a", label: "45°" },
        { id: "b", label: "50°" },
        { id: "c", label: "55°" },
        { id: "d", label: "65°" },
      ],
      correct_option_id: "c",
      explanation: "Triangle angles total 180°, so 180° − 90° − 35° = 55°.",
    },
    {
      id: "q15",
      prompt: "What is the greatest common factor of 18 and 24?",
      options: [
        { id: "a", label: "3" },
        { id: "b", label: "6" },
        { id: "c", label: "9" },
        { id: "d", label: "12" },
      ],
      correct_option_id: "b",
      explanation: "6 is the largest integer that divides both 18 and 24.",
    },
    {
      id: "q16",
      prompt: "What is 2⁵?",
      options: [
        { id: "a", label: "10" },
        { id: "b", label: "16" },
        { id: "c", label: "25" },
        { id: "d", label: "32" },
      ],
      correct_option_id: "d",
      explanation: "2⁵ = 2 × 2 × 2 × 2 × 2 = 32.",
    },
    {
      id: "q17",
      prompt: "A rectangle is 8 units long and 5 units wide. What is its area?",
      options: [
        { id: "a", label: "13" },
        { id: "b", label: "26" },
        { id: "c", label: "40" },
        { id: "d", label: "80" },
      ],
      correct_option_id: "c",
      explanation: "Area = length × width = 8 × 5 = 40.",
    },
    {
      id: "q18",
      prompt: "What is 1.5 + 2.75?",
      options: [
        { id: "a", label: "3.25" },
        { id: "b", label: "4.00" },
        { id: "c", label: "4.25" },
        { id: "d", label: "4.50" },
      ],
      correct_option_id: "c",
      explanation: "1.50 + 2.75 = 4.25.",
    },
    {
      id: "q19",
      prompt: "If 4 notebooks cost $12, what is the cost of one notebook?",
      options: [
        { id: "a", label: "$2" },
        { id: "b", label: "$3" },
        { id: "c", label: "$4" },
        { id: "d", label: "$6" },
      ],
      correct_option_id: "b",
      explanation: "$12 ÷ 4 = $3.",
    },
    {
      id: "q20",
      prompt: "What is the square root of 144?",
      options: [
        { id: "a", label: "10" },
        { id: "b", label: "11" },
        { id: "c", label: "12" },
        { id: "d", label: "14" },
      ],
      correct_option_id: "c",
      explanation: "12 × 12 = 144.",
    },
  ],
};

export const CHEMISTRY_QUIZ: QuizDefinition = {
  id: "chemistry",
  title: "Chemistry",
  question_count: 5,
  time_per_question_seconds: 25,
  points_per_correct_answer: 10,
  allow_back: false,
  questions: [
    {
      id: "chem_1",
      prompt: "Qual é a fórmula química da água?",
      options: [
        { id: "a", label: "CO2" },
        { id: "b", label: "H2O" },
        { id: "c", label: "NaCl" },
        { id: "d", label: "O2" },
      ],
      correct_option_id: "b",
      explanation: "A água é composta por 2 átomos de hidrogênio e 1 de oxigênio (H2O).",
    },
    {
      id: "chem_2",
      prompt: "Qual elemento tem o símbolo químico 'Au'?",
      options: [
        { id: "a", label: "Prata" },
        { id: "b", label: "Cobre" },
        { id: "c", label: "Ouro" },
        { id: "d", label: "Alumínio" },
      ],
      correct_option_id: "c",
      explanation: "Au vem do latim 'Aurum', que significa Ouro.",
    },
    {
      id: "chem_3",
      prompt: "Qual é o gás mais abundante na atmosfera terrestre?",
      options: [
        { id: "a", label: "Oxigênio" },
        { id: "b", label: "Nitrogênio" },
        { id: "c", label: "Gás Carbônico" },
        { id: "d", label: "Hélio" },
      ],
      correct_option_id: "b",
      explanation: "O Nitrogênio (N2) compõe cerca de 78% da atmosfera.",
    },
    {
      id: "chem_4",
      prompt: "Qual é o pH de uma substância neutra a 25°C?",
      options: [
        { id: "a", label: "0" },
        { id: "b", label: "5" },
        { id: "c", label: "7" },
        { id: "d", label: "14" },
      ],
      correct_option_id: "c",
      explanation: "pH 7 representa a neutralidade absoluta.",
    },
    {
      id: "chem_5",
      prompt: "Qual partícula atômica possui carga negativa?",
      options: [
        { id: "a", label: "Próton" },
        { id: "b", label: "Nêutron" },
        { id: "c", label: "Elétron" },
        { id: "d", label: "Pósitron" },
      ],
      correct_option_id: "c",
      explanation: "Os elétrons orbitam o núcleo e possuem carga negativa (-1).",
    },
  ],
};

export const PHYSICS_QUIZ: QuizDefinition = {
  id: "physics",
  title: "Physics",
  question_count: 5,
  time_per_question_seconds: 25,
  points_per_correct_answer: 10,
  allow_back: false,
  questions: [
    {
      id: "phys_1",
      prompt: "Qual é a velocidade aproximada da luz no vácuo?",
      options: [
        { id: "a", label: "300.000 km/s" },
        { id: "b", label: "150.000 km/s" },
        { id: "c", label: "1.000 km/h" },
        { id: "d", label: "3.000.000 km/s" },
      ],
      correct_option_id: "a",
      explanation: "A luz viaja a aproximadamente 299.792 km/s no vácuo.",
    },
    {
      id: "phys_2",
      prompt: "Quem formulou a Lei da Gravitação Universal?",
      options: [
        { id: "a", label: "Albert Einstein" },
        { id: "b", label: "Isaac Newton" },
        { id: "c", label: "Nikola Tesla" },
        { id: "d", label: "Galileu Galilei" },
      ],
      correct_option_id: "b",
      explanation: "Isaac Newton descreveu as leis do movimento e da gravitação universal.",
    },
    {
      id: "phys_3",
      prompt: "Qual é a unidade de medida da força no Sistema Internacional?",
      options: [
        { id: "a", label: "Joule (J)" },
        { id: "b", label: "Watt (W)" },
        { id: "c", label: "Newton (N)" },
        { id: "d", label: "Pascal (Pa)" },
      ],
      correct_option_id: "c",
      explanation: "A força é medida em Newtons (N = kg·m/s²).",
    },
    {
      id: "phys_4",
      prompt: "A energia não pode ser criada nem destruída, apenas transformada. Isso expressa a:",
      options: [
        { id: "a", label: "Lei da Inércia" },
        { id: "b", label: "Conservação da Energia" },
        { id: "c", label: "Lei da Ação e Reação" },
        { id: "d", label: "Teoria da Relatividade" },
      ],
      correct_option_id: "b",
      explanation: "O princípio da conservação da energia é um pilar da termodinâmica e mecânica.",
    },
    {
      id: "phys_5",
      prompt: "Qual força mantém os planetas em órbita ao redor do Sol?",
      options: [
        { id: "a", label: "Força Eletromagnética" },
        { id: "b", label: "Força Nuclear Forte" },
        { id: "c", label: "Força Gravitacional" },
        { id: "d", label: "Força Centrífuga" },
      ],
      correct_option_id: "c",
      explanation: "A atração gravitacional do Sol mantém os corpos celestes em suas órbitas.",
    },
  ],
};

export const ALL_QUIZZES: Record<string, QuizDefinition> = {
  math: MATH_QUIZ,
  chemistry: CHEMISTRY_QUIZ,
  physics: PHYSICS_QUIZ,
};
