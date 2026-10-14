const router = require("express").Router();
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client } = require("@aws-sdk/client-s3");
const { prisma, asyncHandler, auth, admin, slug } = require("../lib");
const { upload, uploadToS3 } = require("../middleware/s3Upload");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

async function withImageUrl(product) {
  if (!product || !product.image) return product;

  // S3 object keys are stored as products/<unique-filename>.
  if (product.image.startsWith("products/")) {
    const image = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: product.image,
      }),
      { expiresIn: 3600 }
    );

    return { ...product, image };
  }

  // Preserve existing /uploads and external image URLs.
  return product;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      search = "",
      category,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 12));
    const where = {
      AND: [
        { name: { contains: search } },
        ...(category ? [{ category: { slug: category } }] : []),
      ],
    };

    const orderBy =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "rating"
            ? { rating: "desc" }
            : { createdAt: "desc" };

    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        include: { category: true },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: await Promise.all(data.map(withImageUrl)),
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: Number(req.params.id) || 0 },
          { slug: req.params.id },
        ],
      },
      include: { category: true },
    });

    if (!product) {
      throw Object.assign(new Error("Product not found"), { status: 404 });
    }

    res.json({ success: true, data: await withImageUrl(product) });
  })
);

router.post(
  "/",
  auth,
  admin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const d = req.body;
    const image = req.file ? await uploadToS3(req.file) : d.image || null;

    const product = await prisma.product.create({
      data: {
        name: d.name,
        slug: slug(d.name) + "-" + Date.now(),
        description: d.description,
        price: d.price,
        discountPrice: d.discountPrice || null,
        stock: +d.stock,
        categoryId: +d.categoryId,
        image,
        rating: +d.rating || 4.5,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      data: await withImageUrl(product),
    });
  })
);

router.patch(
  "/:id",
  auth,
  admin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const d = req.body;
    const image = req.file ? await uploadToS3(req.file) : undefined;

    const product = await prisma.product.update({
      where: { id: +req.params.id },
      data: {
        ...(d.name && {
          name: d.name,
          slug: slug(d.name) + "-" + Date.now(),
        }),
        ...(d.description && { description: d.description }),
        ...(d.price !== undefined && { price: d.price }),
        ...(d.discountPrice !== undefined && {
          discountPrice: d.discountPrice || null,
        }),
        ...(d.stock !== undefined && { stock: +d.stock }),
        ...(d.categoryId && { categoryId: +d.categoryId }),
        ...(image !== undefined && { image }),
      },
      include: { category: true },
    });

    res.json({ success: true, data: await withImageUrl(product) });
  })
);

router.delete(
  "/:id",
  auth,
  admin,
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  })
);

module.exports = router;
