const { where, Op, QueryTypes } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const CarBrand = require("../models/CarBrand");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const {
  appendFollowers,
  appendFavorites,
  appendTagList,
} = require("../util/helpers");
const redisClient = require("../util/caching");
const sequelize = require("../util/database");
const Model = require("../models/Model");
const ContactForm = require("../models/ContactForm");
const Trim = require("../models/Trim");
const Newsletter = require("../models/Newsletter");

const includeOptions = [
  // {
  //   model: Tag,
  //   as: "tagLists",
  //   attributes: ["name"],
  //   through: { attributes: [] },
  // },
  // { model: User, as: "author", attributes: { exclude: ["email", "password"] } },
];

module.exports.getCarBrands = asyncHandler(async (req, res, next) => {

  // const cacheResults = await redisClient.get("carBrands");
  // if (cacheResults) {
  //   isCached = true;
  //   results = JSON.parse(cacheResults);
  //   return res
  //   .status(200)
  //   .json(results);
  // } 

  const { query } = req;

  let isAll = query.isAll ?? false;

  let pageSize = query.pageSize ?? 10;
  let currentPage = query.currentPage ?? 1;
  let orderBy = query.orderBy ? [
    [query.orderBy, "ASC"]
  ] : null;
  let where = {};
  if (query.search) {
    where.name = { [Op.iLike]: `%${query.search}%` }
  }

  let conditions = {
    order: orderBy,
    raw: true
  };
  if (!isAll) {
    conditions = {
      where,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      order: orderBy,
      raw: true
    }
  }

  let carBrands = { rows: [], count: 0 };

  carBrands = await CarBrand.findAndCountAll(conditions);

  carBrands.rows = await Promise.all(
    carBrands.rows.map(async brand => {
      brand.modelCount = await Model.count({
        where: {
          brand: brand.id
        }
      })
      return brand;
    })
  )

  // await redisClient.set("carBrands", JSON.stringify({ carBrands: carBrands.rows, carBrandsCount: carBrands.count }), {
  //   EX: 60 * 60 * 24,
  //   NX: true,
  // });

  res
    .status(200)
    .json({ carBrands: carBrands.rows, carBrandsCount: carBrands.count });
});

module.exports.mainSearch = asyncHandler(async (req, res, next) => {

  const { keyword } = req.params;
  // let keyword = "Audi a7"

  console.log("keyword ", keyword);

  let first_word = ''
  let second_word = ''
  let words = keyword.split(" ")
  console.log('www ', words);
  if (words.length == 2) {
    first_word = words[0] + '%'
    second_word = words[1] + '%'
  } else {
    first_word = words[0] + '%'
    second_word = words[0] + '%'
  }

  let searchBrand = await CarBrand.findAll({
    where: {
      [Op.or]: keyword.split(" ").map(word => ({
        name: {
          [Op.iLike]: word + "%"
        }
      }))
    },
    limit: 8,
    raw: true
  })

  searchBrand = searchBrand.map(item => ({ ...item, type: "brand" }))

  let searchModelWithName = await Model.findAll({
    attributes: ["id", "name", "slug", "brand", "highTrim"],
    where: {
      [Op.or]: keyword.split(" ").map(word => ({
        name: {
          [Op.iLike]: word + "%"
        }
      })),
    },
    limit: 8,
    raw: true
  })

  let brandWhere = {
    [Op.or]: searchBrand.map(brand => ({
      brand: brand.id
    })),
  }
  if (searchModelWithName.length != 0) {
    brandWhere.id = {
      [Op.and]: searchModelWithName.map(model => ({
        [Op.ne]: model.id
      }))
    }
  }


  let searchModelWithBrand = await Model.findAll({
    attributes: ["id", "name", "slug", "brand", "highTrim"],
    where: brandWhere,
    limit: 8,
    raw: true
  })

  let searchModel = searchModelWithName.concat(searchModelWithBrand)

  searchModel = await Promise.all(
    searchModel.map(async model => {
      model.brand = await CarBrand.findByPk(model.brand)
      model.type = "model"
      if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { attributes: ["id", "name", "slug", "mainSlug", "year"], raw: true });
      } else {
        model.mainTrim = await Trim.findOne({
          attributes: ["id", "name", "slug", "mainSlug", "year"],
          where: {
            model: model.id,
            published: true
          },
          raw: true
        });
      }
      return model;
    })
  )


  // let searchTrim = await sequelize.query(
  //   'SELECT m.name as modelName, b.name as brandName, t.name as trimName, m.id as modelId, b.id as brandId, t.id as trimId, m.slug as modelSlug, b.slug as brandSlug, t.slug as trimSlug, * FROM trims as t, models as m, car_brands as b WHERE t.model = m.id AND m.brand = b.id AND (b.name ILIKE :search_name OR m.name ILIKE :search_name OR t.name ILIKE :search_name OR b.name ILIKE :first_word OR m.name ILIKE :second_word OR b.name ILIKE :second_word OR m.name ILIKE :first_word) LIMIT 5',
  //   {
  //     replacements: { search_name: keyword+'%', first_word, second_word },
  //     type: QueryTypes.SELECT
  //   }
  // );

  // searchTrim = searchTrim.map()

  let search = searchBrand.concat(searchModel)

  res.status(200).json({
    search
  })

});

module.exports.contactFormSubmit = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    mobile,
    subject,
    message,
  } = req.body.contact;

  await ContactForm.create({
    name,
    email,
    mobile,
    subject,
    message,
  });

  res.status(201).json({ message: "Contact form submitted" });
});

module.exports.subscriptionFormSubmit = asyncHandler(async (req, res, next) => {
  const {
    email
  } = req.body.subscription;

  let oldData = await Newsletter.findOne({
    where: {
      email
    }
  })

  if (oldData) {
    res.status(403).json({ message: "Newsletter Already Subscribed" });
    return
  }

  await Newsletter.create({
    email,
  });

  res.status(201).json({ message: "Newsletter Subscribed" });
});

const fieldValidation = (field, next) => {
  if (!field) {
    return next(new ErrorResponse(`Missing fields`, 400));
  }
};
