export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  seller: string;
  emoji: string;
  description: string;
  rating: number;
  reviews: number;
  stock: number;
  sold: number;
  colors: string[];
  models: string[];
  sellerRating: number;
  sellerProducts: number;
  sellerResponse: number;
  sellerJoined: string;
  sellerFollowers: number;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 49.99,
    seller: "TechStore",
    emoji: "🎧",
    description:
      "Premium wireless headphones with immersive sound, comfortable ear cushions, and long-lasting battery life.",
    rating: 4.8,
    reviews: 124,
    stock: 25,
    sold: 842,
    colors: ["Black", "White", "Blue"],
    models: ["Standard", "Pro"],
    sellerRating: 4.9,
    sellerProducts: 128,
    sellerResponse: 98,
    sellerJoined: "March 2025",
    sellerFollowers: 1240,
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 79.99,
    seller: "KeyHouse",
    emoji: "⌨️",
    description:
      "A premium mechanical keyboard built for gaming, programming, and everyday productivity.",
    rating: 4.9,
    reviews: 89,
    stock: 18,
    sold: 534,
    colors: ["Black", "White"],
    models: ["Blue Switch", "Red Switch", "Brown Switch"],
    sellerRating: 4.9,
    sellerProducts: 86,
    sellerResponse: 99,
    sellerJoined: "January 2025",
    sellerFollowers: 892,
  },
  {
    id: 3,
    name: "Premium Backpack",
    category: "Fashion",
    price: 39.99,
    seller: "UrbanGoods",
    emoji: "🎒",
    description:
      "Minimalist everyday backpack with multiple compartments and durable water-resistant material.",
    rating: 4.7,
    reviews: 67,
    stock: 32,
    sold: 713,
    colors: ["Black", "Gray", "Green"],
    models: ["20L", "30L"],
    sellerRating: 4.8,
    sellerProducts: 214,
    sellerResponse: 96,
    sellerJoined: "June 2024",
    sellerFollowers: 2100,
  },
  {
    id: 4,
    name: "Smart Watch",
    category: "Electronics",
    price: 129.99,
    seller: "FutureTech",
    emoji: "⌚",
    description:
      "Modern smartwatch with fitness tracking, notifications, health metrics, and a vibrant display.",
    rating: 4.6,
    reviews: 203,
    stock: 12,
    sold: 1208,
    colors: ["Black", "Silver"],
    models: ["40mm", "44mm"],
    sellerRating: 4.7,
    sellerProducts: 175,
    sellerResponse: 97,
    sellerJoined: "September 2024",
    sellerFollowers: 3400,
  },
  {
    id: 5,
    name: "Running Shoes",
    category: "Sports",
    price: 69.99,
    seller: "SportZone",
    emoji: "👟",
    description:
      "Lightweight running shoes designed for comfort, stability, and everyday training.",
    rating: 4.8,
    reviews: 156,
    stock: 40,
    sold: 935,
    colors: ["Black", "White", "Red"],
    models: ["40", "41", "42", "43", "44"],
    sellerRating: 4.8,
    sellerProducts: 342,
    sellerResponse: 98,
    sellerJoined: "April 2024",
    sellerFollowers: 2890,
  },
  {
    id: 6,
    name: "Gaming Mouse",
    category: "Gaming",
    price: 34.99,
    seller: "GameHub",
    emoji: "🖱️",
    description:
      "High-precision gaming mouse with adjustable DPI, ergonomic design, and programmable buttons.",
    rating: 4.7,
    reviews: 112,
    stock: 28,
    sold: 684,
    colors: ["Black", "White"],
    models: ["Wired", "Wireless"],
    sellerRating: 4.9,
    sellerProducts: 93,
    sellerResponse: 99,
    sellerJoined: "November 2024",
    sellerFollowers: 1780,
  },
  {
    id: 7,
    name: "Minimalist Lamp",
    category: "Home",
    price: 29.99,
    seller: "HomeSpace",
    emoji: "💡",
    description:
      "Clean minimalist desk lamp that brings a warm and modern atmosphere to any room.",
    rating: 4.5,
    reviews: 54,
    stock: 21,
    sold: 421,
    colors: ["White", "Black"],
    models: ["Desk", "Bedside"],
    sellerRating: 4.6,
    sellerProducts: 157,
    sellerResponse: 94,
    sellerJoined: "August 2024",
    sellerFollowers: 1260,
  },
  {
    id: 8,
    name: "Travel Camera",
    category: "Electronics",
    price: 299.99,
    seller: "PhotoWorld",
    emoji: "📷",
    description:
      "Compact travel camera designed for high-quality photos and videos wherever you go.",
    rating: 4.9,
    reviews: 76,
    stock: 8,
    sold: 317,
    colors: ["Black", "Silver"],
    models: ["Body Only", "18-55mm Kit"],
    sellerRating: 4.9,
    sellerProducts: 74,
    sellerResponse: 99,
    sellerJoined: "February 2024",
    sellerFollowers: 4210,
  },
];

