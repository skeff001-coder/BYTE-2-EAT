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
};

export const trendingRecipes: Recipe[] = [
  { id: "1", title: "Garden Veggie Stir-Fry", time: "20 min", difficulty: "Easy", tag: "Vegan", image: r1 },
  { id: "2", title: "Creamy Avocado Pasta", time: "15 min", difficulty: "Easy", tag: "Quick", image: r2 },
  { id: "3", title: "Green Power Smoothie Bowl", time: "10 min", difficulty: "Easy", tag: "Healthy", image: r3 },
  { id: "4", title: "Herb Grilled Chicken", time: "30 min", difficulty: "Medium", tag: "Protein", image: r4 },
];
