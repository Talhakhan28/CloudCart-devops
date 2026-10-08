const { PrismaClient } = require("@prisma/client"),
  bcrypt = require("bcryptjs");
const p = new PrismaClient();
const list = [
  [
    "AeroPods Pro",
    "Immersive wireless earbuds with adaptive noise cancellation.",
    129.99,
    99.99,
    "Electronics",
  ],
  [
    "Orbit Smartwatch",
    "Health tracking and seven-day battery.",
    189.99,
    149.99,
    "Electronics",
  ],
  [
    "Nova Bluetooth Speaker",
    "Rich waterproof sound in a compact body.",
    79.99,
    59.99,
    "Electronics",
  ],
  [
    "Studio Headphones",
    "Comfort-first over-ear headphones.",
    159.99,
    119.99,
    "Electronics",
  ],
  [
    "Everyday Linen Shirt",
    "Breathable tailored shirt.",
    54.99,
    39.99,
    "Fashion",
  ],
  [
    "Cloud Knit Hoodie",
    "Soft heavyweight relaxed hoodie.",
    74.99,
    59.99,
    "Fashion",
  ],
  [
    "Leather Sneakers",
    "Minimal all-day comfort sneakers.",
    109.99,
    89.99,
    "Shoes",
  ],
  ["Trail Runner X", "Lightweight cushioned runners.", 139.99, 109.99, "Shoes"],
  [
    "Summit Backpack",
    "Organization for work and travel.",
    84.99,
    69.99,
    "Accessories",
  ],
  [
    "Arc Sunglasses",
    "Polarized frames with UV400.",
    49.99,
    34.99,
    "Accessories",
  ],
  [
    "Halo Desk Lamp",
    "Warm adjustable illumination.",
    64.99,
    49.99,
    "Home & Lifestyle",
  ],
  [
    "Dune Ceramic Set",
    "Dinnerware set for four.",
    89.99,
    74.99,
    "Home & Lifestyle",
  ],
  [
    "Canvas Weekender",
    "Durable structured carry-on.",
    119.99,
    89.99,
    "Accessories",
  ],
  [
    "Mira Smart Scale",
    "Clear body metrics daily.",
    69.99,
    54.99,
    "Electronics",
  ],
  [
    "Waffle Throw Blanket",
    "Textured cotton comfort layer.",
    59.99,
    44.99,
    "Home & Lifestyle",
  ],
];
const sl = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
async function main() {
  let h = await bcrypt.hash("Admin@123", 12);
  await p.user.upsert({
    where: { email: "admin@cloudcart.local" },
    update: {},
    create: {
      name: "CloudCart Admin",
      email: "admin@cloudcart.local",
      password: h,
      role: "ADMIN",
    },
  });
  for (const e of ["alice@cloudcart.local", "sam@cloudcart.local"])
    await p.user.upsert({
      where: { email: e },
      update: {},
      create: {
        name: e.split("@")[0],
        email: e,
        password: await bcrypt.hash("Customer@123", 12),
      },
    });
  for (const name of [
    "Electronics",
    "Fashion",
    "Shoes",
    "Accessories",
    "Home & Lifestyle",
  ])
    await p.category.upsert({
      where: { slug: sl(name) },
      update: {},
      create: { name, slug: sl(name) },
    });
  for (let i = 0; i < list.length; i++) {
    let [name, description, price, discountPrice, cat] = list[i],
      category = await p.category.findUnique({ where: { slug: sl(cat) } });
    await p.product.upsert({
      where: { slug: sl(name) },
      update: {},
      create: {
        name,
        slug: sl(name),
        description,
        price,
        discountPrice,
        stock: 8 + i * 3,
        rating: 4.2 + (i % 7) / 10,
        categoryId: category.id,
        image: `https://images.unsplash.com/photo-${["1505740420928-5e560c06d30e", "1523275335684-37898b6baf30", "1608043152269-423dbba4e7e1", "1503602642458-232111445657", "1602810318383-e386cc2a3ccf", "1556821840-3a63f95609a7", "1542291026-7eec264c27ff", "1551698618-1dfe5d97d256", "1553062407-98eeb64c6a62", "1511499767150-a48a237f0083", "1507473885765-e6ed057f782c", "1494438639946-1ebd1d20bf85", "1553062407-98eeb64c6a62", "1556228720-195a672e8a03", "1583845112203-29329902332e"][i]}?auto=format&fit=crop&w=800&q=80`,
      },
    });
  }
  console.log("Seed complete");
}
main().finally(() => p.$disconnect());
