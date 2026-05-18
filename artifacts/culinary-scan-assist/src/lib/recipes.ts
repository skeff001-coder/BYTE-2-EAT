import r1 from "@/assets/recipe-1.jpg";
import r2 from "@/assets/recipe-2.jpg";
import r3 from "@/assets/recipe-3.jpg";
import r4 from "@/assets/recipe-4.jpg";

export type Recipe = {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  tag: string;
  image: string;
  calories: number;
  servings: number;
  ingredients: string[];
  steps: string[];
};

export const trendingRecipes: Recipe[] = [
  {
    id: "1",
    title: "Garden Veggie Stir-Fry",
    time: "20 min",
    difficulty: "Easy",
    tag: "Vegan",
    image: r1,
    calories: 320,
    servings: 2,
    ingredients: [
      "2 tbsp sesame oil",
      "1 red bell pepper, sliced",
      "1 courgette, sliced",
      "100g broccoli florets",
      "2 cloves garlic, minced",
      "1 tbsp soy sauce",
      "1 tsp fresh ginger, grated",
      "1 tsp cornflour",
      "Sesame seeds to garnish",
    ],
    steps: [
      "Heat sesame oil in a wok over high heat.",
      "Add garlic and ginger, stir-fry for 30 seconds.",
      "Add broccoli and stir-fry for 2 minutes.",
      "Add bell pepper and courgette, cook for 3 more minutes.",
      "Mix soy sauce with cornflour and a splash of water, pour over veg.",
      "Toss everything together until the sauce thickens.",
      "Serve immediately, garnished with sesame seeds.",
    ],
  },
  {
    id: "2",
    title: "Creamy Avocado Pasta",
    time: "15 min",
    difficulty: "Easy",
    tag: "Quick",
    image: r2,
    calories: 490,
    servings: 2,
    ingredients: [
      "200g pasta (linguine or spaghetti)",
      "2 ripe avocados",
      "2 cloves garlic",
      "Juice of 1 lemon",
      "2 tbsp olive oil",
      "Small bunch fresh basil",
      "Salt and black pepper",
      "Chilli flakes (optional)",
    ],
    steps: [
      "Cook pasta according to packet instructions. Reserve ½ cup pasta water.",
      "Blend avocados, garlic, lemon juice, olive oil and basil until smooth.",
      "Season with salt and pepper.",
      "Drain pasta and toss with the avocado sauce, adding pasta water to loosen.",
      "Serve immediately with chilli flakes if desired.",
    ],
  },
  {
    id: "3",
    title: "Green Power Smoothie Bowl",
    time: "10 min",
    difficulty: "Easy",
    tag: "Healthy",
    image: r3,
    calories: 280,
    servings: 1,
    ingredients: [
      "1 frozen banana",
      "1 cup frozen mango chunks",
      "2 handfuls baby spinach",
      "120ml coconut milk",
      "Toppings: granola, kiwi slices, chia seeds, honey",
    ],
    steps: [
      "Blend banana, mango, spinach and coconut milk until completely smooth.",
      "Pour into a bowl — the mixture should be thick, not pourable.",
      "Add toppings: granola, fresh kiwi, chia seeds and a drizzle of honey.",
      "Serve immediately.",
    ],
  },
  {
    id: "4",
    title: "Herb Grilled Chicken",
    time: "30 min",
    difficulty: "Medium",
    tag: "Protein",
    image: r4,
    calories: 410,
    servings: 2,
    ingredients: [
      "2 chicken breasts",
      "2 tbsp olive oil",
      "2 cloves garlic, crushed",
      "1 tsp dried oregano",
      "1 tsp smoked paprika",
      "½ tsp dried thyme",
      "Juice of ½ lemon",
      "Salt and black pepper",
    ],
    steps: [
      "Mix olive oil, garlic, oregano, paprika, thyme, lemon juice, salt and pepper.",
      "Score the chicken breasts and coat thoroughly in the marinade.",
      "Leave to marinate for at least 10 minutes (or overnight in the fridge).",
      "Heat a griddle pan over high heat. Cook chicken 6–7 minutes per side.",
      "Rest for 5 minutes before slicing and serving.",
    ],
  },
];
