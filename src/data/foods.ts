import type { FoodProfile } from "../types";

export const FOODS: FoodProfile[] = [
  { id: "banana", name: "Banana", emoji: "🍌", ethyleneProducer: 1.0, ethyleneSensitivity: 0.3, idealTemp: 13, idealHumidity: 90, shelfLifeDays: 7, priceUsd: 0.35 },
  { id: "apple", name: "Apple", emoji: "🍎", ethyleneProducer: 0.8, ethyleneSensitivity: 0.3, idealTemp: 2, idealHumidity: 90, shelfLifeDays: 28, priceUsd: 0.5 },
  { id: "tomato", name: "Tomato", emoji: "🍅", ethyleneProducer: 0.6, ethyleneSensitivity: 0.3, idealTemp: 12, idealHumidity: 88, shelfLifeDays: 10, priceUsd: 0.6 },
  { id: "lettuce", name: "Lettuce", emoji: "🥬", ethyleneProducer: 0, ethyleneSensitivity: 0.9, idealTemp: 2, idealHumidity: 95, shelfLifeDays: 7, priceUsd: 1.8 },
  { id: "spinach", name: "Spinach", emoji: "🌿", ethyleneProducer: 0, ethyleneSensitivity: 0.9, idealTemp: 2, idealHumidity: 95, shelfLifeDays: 6, priceUsd: 2.5 },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", ethyleneProducer: 0, ethyleneSensitivity: 0.7, idealTemp: 2, idealHumidity: 92, shelfLifeDays: 5, priceUsd: 3.5 },
  { id: "cucumber", name: "Cucumber", emoji: "🥒", ethyleneProducer: 0, ethyleneSensitivity: 0.8, idealTemp: 10, idealHumidity: 92, shelfLifeDays: 10, priceUsd: 0.9 },
  { id: "carrot", name: "Carrot", emoji: "🥕", ethyleneProducer: 0, ethyleneSensitivity: 0.6, idealTemp: 1, idealHumidity: 95, shelfLifeDays: 21, priceUsd: 0.4 },
  { id: "potato", name: "Potato", emoji: "🥔", ethyleneProducer: 0, ethyleneSensitivity: 0.2, idealTemp: 8, idealHumidity: 85, shelfLifeDays: 60, priceUsd: 0.5 },
  { id: "onion", name: "Onion", emoji: "🧅", ethyleneProducer: 0, ethyleneSensitivity: 0.1, idealTemp: 4, idealHumidity: 65, shelfLifeDays: 60, priceUsd: 0.4 },
];
