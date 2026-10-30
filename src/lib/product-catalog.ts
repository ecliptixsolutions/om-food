import onionFlakes from "@/assets/onion-flakes.webp";
import mincedOnion from "@/assets/minced-onion.webp";
import onionGranules from "@/assets/onion-granules.webp";
import onionPowder from "@/assets/onion-powder.webp";

export const productCatalog = [
  {
    name: "Dehydrated onion flakes / kibbled onion",
    group: "Dehydrated onions",
    description: "Dehydrated onion formats for ingredient and food business inquiries.",
    image: onionFlakes,
    alt: "Dehydrated onion flakes and kibbled onion pieces.",
    path: "/dehydrated-onions",
  },
  {
    name: "Minced onion",
    group: "Dehydrated onions",
    description: "Discuss minced onion format, requirements and current availability.",
    image: mincedOnion,
    alt: "Minced dehydrated onion pieces.",
    path: "/dehydrated-onions",
  },
  {
    name: "Onion granules",
    group: "Dehydrated onions",
    description: "Enquire about granules and the specifications your business needs.",
    image: onionGranules,
    alt: "Dehydrated onion granules.",
    path: "/dehydrated-onions",
  },
  {
    name: "Onion powder",
    group: "Dehydrated onions",
    description: "Share your powder requirements for an availability discussion.",
    image: onionPowder,
    alt: "Fine dehydrated onion powder.",
    path: "/dehydrated-onions",
  },
  {
    name: "Dehydrated garlic flakes",
    group: "Dehydrated garlic",
    description:
      "Dried garlic flakes for seasoning blends, food manufacturing and commercial ingredient applications.",
    image:
      "https://images.pexels.com/photos/4871137/pexels-photo-4871137.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Dehydrated garlic flakes.",
    path: "/products",
  },
  {
    name: "Dehydrated minced garlic",
    group: "Dehydrated garlic",
    description: "Minced dried garlic for seasoning, sauces and food processing requirements.",
    image:
      "https://images.pexels.com/photos/35534608/pexels-photo-35534608.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Minced dehydrated garlic.",
    path: "/products",
  },
  {
    name: "Dehydrated garlic granules",
    group: "Dehydrated garlic",
    description:
      "Garlic granules for commercial seasoning, ingredient blending and food production inquiries.",
    image:
      "https://images.pexels.com/photos/8329341/pexels-photo-8329341.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Dehydrated garlic granules.",
    path: "/products",
  },
  {
    name: "Dehydrated garlic powder",
    group: "Dehydrated garlic",
    description:
      "Fine garlic powder for seasoning blends, sauces and commercial food applications.",
    image:
      "https://images.pexels.com/photos/6808976/pexels-photo-6808976.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Fine dehydrated garlic powder.",
    path: "/products",
  },
] as const;
