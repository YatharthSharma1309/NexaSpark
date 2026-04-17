const connectDb = require("../config/db");
const Product = require("../models/Product");
const { products } = require("./data");

const seed = async () => {
  await connectDb();
  await Product.deleteMany({});
  await Product.insertMany(products);
  // eslint-disable-next-line no-console
  console.log("Products seeded");
  process.exit(0);
};

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seeding failed:", error);
  process.exit(1);
});
