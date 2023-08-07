const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");
const _ = require("lodash");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const moment = require("moment");
const Model = require("../models/Model");
const Trim = require("../models/Trim");
const TrimVideos = require("../models/TrimVideo");
const TrimImages = require("../models/TrimImages");
const HomeListing = require("../models/HomeListing");
const OldModelSlug = require("../models/OldModelSlug");

module.exports.createModel = asyncHandler(async (req, res, next) => {
    const {
        name,
        metaTitle,
        description,
        brand,
        // year,
        // isLuxury,
        // isPremiumLuxury,
        // isSafety,
        // isFuelEfficient,
        // isOffRoad,
        // haveMusic,
        // haveTechnology,
        // havePerformance,
        // isSpacious,
        isElectric,
        published
    } = req.body.model;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    // fieldValidation(year, next);
    fieldValidation(isElectric, next);

    let slug;

    if (typeof name == 'number') {
        slug = name
    } else {
        slug = slugify(name, {
            lower: true
        });
    }

    const model = await Model.create({
        name,
        metaTitle,
        description,
        brand,
        year: 2023,
        // isLuxury,
        // isPremiumLuxury,
        // isSafety,
        // isFuelEfficient,
        // isOffRoad,
        // haveMusic,
        // haveTechnology,
        // havePerformance,
        // isSpacious,
        isElectric,
        published,
        slug
    });

    await redisClient.del("models");

    res.status(201).json({ model });
});

module.exports.getAdminModels = asyncHandler(async (req, res, next) => {

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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            // for changing the year
            // model.highestYear = await Trim.max('year', {
            //     where: {
            //         model: model.id
            //     }
            // })
            // await Model.update({
            //     year: model.highestYear || 2023
            // }, {
            //     where: {
            //         id: model.id
            //     }
            // })
            // end of changing year
            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getAdminModelByBrand = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    let models = await Model.findAll({
        where: {
            brand
        },
        raw: true
    });

    models = await Promise.all(
        models.map(async model => {
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    },
                    raw: true
                });
            }
            return model
        })
    )

    res
        .status(200)
        .json({ models });
});

module.exports.getAdminModelById = asyncHandler(async (req, res, next) => {

    const { model: id } = req.params;

    let model = await Model.findByPk(id, { raw: true });

    model.brand = await CarBrand.findByPk(model.brand);

    model.trims = await Trim.findAll({
        where: {
            model: model.id
        },
        raw: true
    });

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )

    console.log("model.highTrim ", model.highTrim);

    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
    }

    res
        .status(200)
        .json({ model });
});

module.exports.updateModel = asyncHandler(async (req, res, next) => {

    const { model } = req.params;
    const {
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published
    } = req.body.model;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

    await Model.update({
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published,
        slug
    }, {
        where: {
            id: model
        }
    });

    await redisClient.del("models");

    res.status(201).json({ message: "Model Updated" });
});

module.exports.setHighTrim = asyncHandler(async (req, res, next) => {

    const {
        trimId: id
    } = req.body.model;

    fieldValidation(id, next);

    const trim = await Trim.findByPk(id);

    if (!trim) {
        return res.status(404).json({ message: "Trim not found" })
    }

    await Model.update({
        highTrim: trim.id,
        featuredImage: trim.featuredImage
    }, {
        where: {
            id: trim.model
        }
    });

    await redisClient.del("models");

    res.status(201).json({ message: "Main Trim Updated" });
});

module.exports.getModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true,
        year: { [Op.gte]: new Date().getFullYear() }
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
                model.mainTrim.images = await TrimImages.findAll({
                    where: {
                        trimId: model.mainTrim.id
                    }
                })
                model.mainTrim.videos = await TrimVideos.findAll({
                    where: {
                        trimId: model.mainTrim.id
                    }
                })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    },
                    raw: true
                });
                if (model.mainTrim) {
                    model.mainTrim.images = await TrimImages.findAll({
                        where: {
                            trimId: model.mainTrim?.id
                        }
                    })
                    model.mainTrim.videos = await TrimVideos.findAll({
                        where: {
                            trimId: model.mainTrim?.id
                        }
                    })
                }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getAllYearModelsURL = asyncHandler(async (req, res, next) => {
    const { query } = req;

    let isAll = query.isAll ?? false;
    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : null;
    let where = {
        published: true,
    };

    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` };
    }

    let conditions = {
        raw: true,
        where,
    };

    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true,
        };
    }

    let models = { rows: [], count: 0 };
    models = await Model.findAndCountAll(conditions);

    let allUrls = []; // Array to store all URLs

    await Promise.all(
        models.rows.map(async (model) => {
            model.brand = await CarBrand.findByPk(model.brand);

            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
                model.allYearMainTrims = await Trim.findAll({
                    attributes: ["id", "name", "year", "featuredImage", "slug"],
                    where: {
                        model: model.id,
                        slug: model.mainTrim?.slug, // Check if mainTrim exists
                        published: true,
                    },
                    raw: true,
                });

                let possibleYears = [2023, 2022, 2021, 2020];
                let trimYears = model.allYearMainTrims.map((item) => item.year);
                await Promise.all(
                    possibleYears.map(async (year) => {
                        if (!trimYears.find((val) => val == year)) {
                            let yearTrim = await Trim.findOne({
                                attributes: ["id", "name", "year", "featuredImage", "slug"],
                                where: {
                                    model: model.id,
                                    year,
                                    published: true,
                                },
                                raw: true,
                            });
                            if (yearTrim) {
                                model.allYearMainTrims.push(yearTrim);
                            }
                        }
                    })
                );

                model.allYearMainTrims = _.sortBy(model.allYearMainTrims, "year", "desc");

                // Create an array of URLs using the data
                let modelUrls = model.allYearMainTrims.map((trim) => {
                    if (trim && trim.year && model.brand && trim.slug) { // Check if required properties exist
                        return `https://carprices.ae/brands/${model?.brand.slug}/${trim?.year}/${model?.slug}`;
                    }
                    return null;
                });

                // Filter out any null or "undefined" values
                modelUrls = modelUrls.filter((url) => url !== null && url !== undefined);

                // Concatenate the URLs to the allUrls array
                allUrls = allUrls.concat(modelUrls);
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true,
                    },
                    raw: true,
                });
                if (model.mainTrim) {
                    model.mainTrim.images = await TrimImages.findAll({
                        where: {
                            trimId: model.mainTrim.id, // Check if mainTrim exists
                        },
                    });
                    model.mainTrim.videos = await TrimVideos.findAll({
                        where: {
                            trimId: model.mainTrim.id, // Check if mainTrim exists
                        },
                    });
                }

                // Create the URL if required properties exist
                if (model.brand && model.mainTrim?.year && model.slug) {
                    let modelUrl = `https://carprices.ae/brands/${model?.brand?.slug}/${model?.mainTrim?.year}/${model?.slug}`;

                    // Add the URL to the allUrls array if it's not "undefined"
                    if (modelUrl !== "https://carprices.ae/brands/undefined/undefined/undefined") {
                        allUrls.push(modelUrl);
                    }
                }
            }
        })
    );

    res.status(200).json({
        urls: allUrls,
    });
});


module.exports.searchModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true,
        year: { [Op.gte]: new Date().getFullYear() }
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: ["id", "name", "slug"],
        raw: true,
        where
    };
    if (!isAll) {
        conditions = {
            attributes: ["id", "name", "slug"],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    // models.rows = await Promise.all(
    //     models.rows.map(async model => {
    //         model.brand = await CarBrand.findByPk(model.brand);


    //         return model;
    //     })
    // )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrandMin = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: ["id", "name", "slug"],
        raw: true,
        where
    };
    if (!isAll) {
        conditions = {
            attributes: ["id", "name", "slug"],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrand = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrandSlug = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const brandData = await CarBrand.findOne({
        where: {
            slug: brand
        }
    })

    if (!brandData) {
        return res.status(404).json({ message: "Brand not found!" })
    }

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand: brandData.id,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsTableListByBrandSlug = asyncHandler(async (req, res, next) => {
    const { brand } = req.params;
  
    const brandData = await CarBrand.findOne({
      where: {
        slug: brand
      }
    });
  
    if (!brandData) {
      return res.status(404).json({ message: "Brand not found!" });
    }
  
    const { query } = req;
  
    let isAll = query.isAll ?? false;
    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : null;
    let where = {
      brand: brandData.id,
      published: true
    };
  
    if (query.search) {
      where.name = { [Op.iLike]: `%${query.search}%` };
    }
  
    let conditions = {
      raw: true,
      where
    };
  
    if (!isAll) {
      conditions = {
        where,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        order: orderBy,
        raw: true
      };
    }
  
    let models = { rows: [], count: 0 };
  
    models = await Model.findAndCountAll(conditions);
  
    models.rows = await Promise.all(
      models.rows.map(async (model) => {
        model.brand = await CarBrand.findByPk(model.brand);
        if (model.highTrim) {
          model.mainTrim = await Trim.findByPk(model.highTrim);
        } else {
          model.mainTrim = await Trim.findOne({
            where: {
              model: model.id,
              published: true
            }
          });
        }
  
        // Include trims of the model
        model.trims = await Trim.findAll({
          where: {
            model: model.id,
            published: true,
            year: 2023,
            price: {
              [Op.not]: null
            }
          }
        });
  
        // Filter the model attributes here
        const filteredModel = {
          name: model.name,
          year: model.year,
          slug: model.slug,
          brandSlug:model.brand.slug,
          minPrice: model.trims.length ? Math.min(...model.trims.map((trim) => trim.price)) : null,
          maxPrice: model.trims.length ? Math.max(...model.trims.map((trim) => trim.price)) : null,
        //   trims: model.trims
        };
  
        return filteredModel;
      })
    );
  
    res.status(200).json({
      models: models.rows,
      modelsCount: models.count,
      totalPage: Math.ceil(models.count / pageSize)
    });
  });
  


module.exports.getModelsByBrandAndYear = asyncHandler(async (req, res, next) => {

    const { brand, year } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
        year,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrandAndYearSlug = asyncHandler(async (req, res, next) => {

    const { brand, year } = req.params;

    const brandData = await CarBrand.findOne({
        where: {
            slug: brand
        }
    })

    if (!brandData) {
        return res.status(404).json({ message: "Brand not found!" })
    }

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand: brandData.id,
        // year,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            if (model.mainTrim) {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        year,
                        published: true
                    }
                });
            }


            return model;
        })
    )

    models.rows = models.rows.filter(model => model.mainTrim != null);
    models.count = models.rows.length;

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.setFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isFeatured: true
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.removeFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isFeatured: false
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.getAdminFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        isFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true,
        id: [510, 312, 276, 181, 68, 363, 411, 101]
        // isFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);

            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.setElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isElectricFeatured: true
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.removeElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isElectricFeatured: false
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.getAdminElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        isElectricFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        id: [482, 520, 375, 78, 445, 21, 246, 128],
        // published: true,
        // isElectric: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getSpecificModels = asyncHandler(async (req, res, next) => {

    const { id } = req.body;

    let where = {
        id: id,
        published: true
    };

    // [268, 228, 126, 244]

    let conditions = {
        raw: true,
        where
    };

    let models = await Model.findAll(conditions);

    models = await Promise.all(
        models.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            return model;
        })
    )

    res
        .status(200)
        .json({ models });
});

module.exports.getModelsBySlug = asyncHandler(async (req, res, next) => {

    const { model: slug } = req.params;

    let where = {
        slug,
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);
    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
    } else {
        model.mainTrim = await Trim.findOne({
            where: {
                model: model.id,
                published: true
            },
            raw: true
        });
        if (model.mainTrim) {
            model.mainTrim.images = await TrimImages.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
            model.mainTrim.videos = await TrimVideos.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
        }

    }

    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
        raw: true
    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.minPrice = await Trim.min("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxPrice = await Trim.max("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )

    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug,
            published: true
        },
        raw: true
    });

    let possibleYears = [2023, 2022, 2021, 2020]
    let trimYears = model.allYearMainTrims.map(item => item.year)

    await Promise.all(
        possibleYears.map(async year => {
            if (!trimYears.find(val => val == year)) {
                let yearTrim = await Trim.findOne({
                    attributes: ["id", "name", "year", "featuredImage", "slug"],
                    where: {
                        model: model.id,
                        year,
                        published: true
                    },
                    raw: true
                });
                if (yearTrim) {
                    model.allYearMainTrims.push(yearTrim)
                }
            }

        })
    )

    model.allYearMainTrims = _.sortBy(model.allYearMainTrims, 'year', 'desc')


    res
        .status(200)
        .json({ model });
});

module.exports.getModelsBySlugBrand = asyncHandler(async (req, res, next) => {

    const { model: slug, brand: brandSlug } = req.params;

    const brand = await CarBrand.findOne({ where: { slug: brandSlug }, raw: true });

    let where = {
        slug,
        brand: brand.id
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);
    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
    } else {
        model.mainTrim = await Trim.findOne({
            where: {
                model: model.id,
                published: true
            },
            raw: true
        });
        if (model.mainTrim) {
            model.mainTrim.images = await TrimImages.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
            model.mainTrim.videos = await TrimVideos.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
        }

    }

    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
        raw: true
    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.minPrice = await Trim.min("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxPrice = await Trim.max("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )



    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug,
            published: true
        },
        raw: true
    });

    let possibleYears = [2023, 2022, 2021, 2020]
    let trimYears = model.allYearMainTrims.map(item => item.year)

    await Promise.all(
        possibleYears.map(async year => {
            if (!trimYears.find(val => val == year)) {
                let yearTrim = await Trim.findOne({
                    attributes: ["id", "name", "year", "featuredImage", "slug"],
                    where: {
                        model: model.id,
                        year,
                        published: true
                    },
                    raw: true
                });
                if (yearTrim) {
                    model.allYearMainTrims.push(yearTrim)
                }
            }

        })
    )

    model.allYearMainTrims = _.sortBy(model.allYearMainTrims, 'year', 'desc')


    res
        .status(200)
        .json({ model });
});

module.exports.getModelsBySlugBrandAndYear = asyncHandler(async (req, res, next) => {

    const { model: slug, brand: brandSlug, year } = req.params;

    const brand = await CarBrand.findOne({ where: { slug: brandSlug }, raw: true });

    let where = {
        slug,
        brand: brand.id
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);

    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        console.log("model.mainTrim ", model.mainTrim);
        model.mainTrim = await Trim.findOne({
            where: {
                slug: model.mainTrim.slug,
                model: model.id,
                year,
                published: true
            },
            raw: true
        });
        console.log("model.mainTrim ", model.mainTrim);
    }
    if (!model.highTrim || model.mainTrim == null) {
        model.mainTrim = await Trim.findOne({
            where: {
                model: model.id,
                year,
                published: true
            },
            raw: true
        });

    }

    model.mainTrim.images = await TrimImages.findAll({
        where: {
            trimId: model.mainTrim?.id
        }
    })
    model.mainTrim.videos = await TrimVideos.findAll({
        where: {
            trimId: model.mainTrim?.id
        }
    })



    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
        raw: true
    });

    model.minPrice = await Trim.min("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPrice = await Trim.max("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year,
            published: true
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )

    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug,
            published: true
        },
        raw: true
    });

    let possibleYears = [2023, 2022, 2021, 2020]
    let trimYears = model.allYearMainTrims.map(item => item.year)

    await Promise.all(
        possibleYears.map(async year => {
            if (!trimYears.find(val => val == year)) {
                let yearTrim = await Trim.findOne({
                    attributes: ["id", "name", "year", "featuredImage", "slug"],
                    where: {
                        model: model.id,
                        year,
                        published: true
                    },
                    raw: true
                });
                if (yearTrim) {
                    model.allYearMainTrims.push(yearTrim)
                }
            }

        })
    )

    model.allYearMainTrims = _.sortBy(model.allYearMainTrims, 'year', 'desc')

    res
        .status(200)
        .json({ model });
});

module.exports.topMostSearchedCars = asyncHandler(async (req, res, next) => {

    let pageSize = 8;
    let currentPage = 1;
    let where = {
        published: true,
        id: [415, 500, 408, 490, 11, 370, 511, 401]
    };

    let conditions = {
        where,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        // order: orderBy,
        raw: true
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, });
});

module.exports.getPopularModelsByBrand = asyncHandler(async (req, res, next) => {

    let { brand, currentModel } = req.body

    let pageSize = 4;
    let currentPage = 1;
    let where = {
        published: true,
        brand,
        id: {
            [Op.ne]: currentModel
        }
    };

    let conditions = {
        where,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        // order: orderBy,
        raw: true
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        published: true
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id,
                    year: model.mainTrim.year,
                    published: true
                }
            });

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, });
});

module.exports.compareCarModels = asyncHandler(async (req, res, next) => {

    const compareListIds = [{ v1: 415, v2: 500 }, { v1: 511, v2: 401 }, { v1: 68, v2: 363 }]

    let models = []

    await Promise.all(
        compareListIds.map(async items => {
            let v1 = await Model.findOne({
                where: {
                    id: items.v1
                },
                raw: true
            })
            if (v1) {
                v1.brand = await CarBrand.findByPk(v1.brand);
                if (v1.highTrim) {
                    v1.mainTrim = await Trim.findByPk(v1.highTrim);
                } else {
                    v1.mainTrim = await Trim.findOne({
                        where: {
                            model: v1.id,
                            published: true
                        }
                    });

                }
                v1.minPrice = await Trim.min("price", {
                    where: {
                        model: v1.id,
                        year: v1.mainTrim.year,
                        published: true
                    }
                });

                v1.maxPrice = await Trim.max("price", {
                    where: {
                        model: v1.id,
                        year: v1.mainTrim.year,
                        published: true
                    }
                });
            }

            let v2 = await Model.findOne({
                where: {
                    id: items.v2
                },
                raw: true
            })
            if (v2) {
                v2.brand = await CarBrand.findByPk(v2.brand);
                if (v2.highTrim) {
                    v2.mainTrim = await Trim.findByPk(v2.highTrim);
                } else {
                    v2.mainTrim = await Trim.findOne({
                        where: {
                            model: v2.id,
                            published: true
                        }
                    });

                }
                v2.minPrice = await Trim.min("price", {
                    where: {
                        model: v2.id,
                        year: v2.mainTrim.year,
                        published: true
                    }
                });

                v2.maxPrice = await Trim.max("price", {
                    where: {
                        model: v2.id,
                        year: v2.mainTrim.year,
                        published: true
                    }
                });
            }


            models.push({ v1, v2 })
        })
    )

    res
        .status(200)
        .json({ models: models, });
});

module.exports.handleOldModelURLRedirect = asyncHandler(async (req, res, next) => {

    const { oldPath } = req.body;

    let trim = await Trim.findOne({
        where: {
            oldPath: {
                [Op.iLike]: '%' + oldPath + '%'
            }
        }
    })

    if (!trim) {
        res
            .status(404)
            .json({ message: "Trim not found" });
        return
    }

    trim.brand = await CarBrand.findByPk(trim.brand);
    trim.model = await Model.findByPk(trim.model, {
        // attributes: ["id", "name"]
    });

    res
        .status(200)
        .json({ trim });


});

module.exports.getOldSlugModel = asyncHandler(async (req, res, next) => {

    const { slug } = req.params;

    const findModel = await OldModelSlug.findOne({
        where: {
            oldSlug: slug
        }
    })

    if (!findModel) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    const model = await Model.findByPk(findModel.model, { raw: true });

    res
        .status(200)
        .json({ model });
});



module.exports.addOldModelSlug = asyncHandler(async (req, res, next) => {

    const { models } = req.body;

    await Promise.all(
        models.map(async model => {
            let modelData = await Model.findOne({
                where: {
                    slug: String(model.Slug)
                }
            })
            await OldModelSlug.create({
                model: modelData.id,
                oldSlug: model.Urls.split('/')[model.Urls.split('/').length - 1]
            })
        })
    )

    res
        .status(200)
        .json({ message: 'Done' });
});

module.exports.setAdminHomeListings = asyncHandler(async (req, res, next) => {

    const { orderNumber, modelId, modelId2, brandId, type } = req.body;

    console.log("bbb ", req.body);

    let homeListingItem = await HomeListing.findOne({
        where: {
            type,
            orderNumber
        }
    })

    if (homeListingItem) {
        await HomeListing.update({
            modelId, brandId, modelId2
        }, {
            where: {
                type,
                orderNumber
            }
        }).catch(e => {
            console.log("Error ", e);
        })
        return res
            .status(200)
            .json({ message: "List Updated" });
    } else {
        await HomeListing.create({
            modelId,
            modelId2,
            brandId,
            type,
            orderNumber
        })
        return res
            .status(200)
            .json({ message: "List Created" });
    }

});

module.exports.getAdminHomeListings = asyncHandler(async (req, res, next) => {

    const { type } = req.params;

    let homeListings = await HomeListing.findAll({
    })

    return res
        .status(200)
        .json({ homeListings });

});

module.exports.getAdminHomeListingsByType = asyncHandler(async (req, res, next) => {

    const { type } = req.params;

    let homeListings = await HomeListing.findAll({
        where: {
            type
        },
        order: [['orderNumber', 'ASC']],
        raw: true
    })

    homeListings = await Promise.all(
        homeListings.map(async item => {
            console.log('iiii ',);
            item.model = await Model.findByPk(item.modelId, { raw: true })
            if (!item.model) {
                item.brand = await CarBrand.findByPk(item.brandId)
                return item
            }
            item.model.brand = await CarBrand.findByPk(item.model.brand)
            if (item.model.highTrim) {
                item.model.mainTrim = await Trim.findByPk(item.model.highTrim);
            } else {
                item.model.mainTrim = await Trim.findOne({
                    where: {
                        model: item.model.id,
                        published: true
                    }
                });
            }
            if (item.modelId2) {
                item.model2 = await Model.findByPk(item.modelId2, { raw: true })
                item.model2.brand = await CarBrand.findByPk(item.model2.brand)
                if (item.model2.highTrim) {
                    item.model2.mainTrim = await Trim.findByPk(item.model2.highTrim);
                } else {
                    item.model2.mainTrim = await Trim.findOne({
                        where: {
                            model: item.model2.id,
                            published: true
                        }
                    });
                }
            }
            return item
        })
    )

    return res
        .status(200)
        .json({ homeListings });

});

module.exports.getAdminHomeListingsById = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    let homeListing = await HomeListing.findOne({
        where: {
            id
        },
        order: [['orderNumber', 'ASC']],
        raw: true
    })

    // homeListings = await Promise.all(
    //     homeListings.map(async item => {
    //         console.log('iiii ',);
    homeListing.model = await Model.findByPk(homeListing.modelId, { raw: true })
    if (!homeListing.model) {
        homeListing.brand = await CarBrand.findByPk(homeListing.brandId)
        return res
            .status(200)
            .json({ homeListing });
    }
    homeListing.model.brand = await CarBrand.findByPk(homeListing.model.brand)
    if (homeListing.model.highTrim) {
        homeListing.model.mainTrim = await Trim.findByPk(homeListing.model.highTrim);
    } else {
        homeListing.model.mainTrim = await Trim.findOne({
            where: {
                model: homeListing.model.id,
                published: true
            }
        });
    }
    if (homeListing.modelId2) {
        homeListing.model2 = await Model.findByPk(homeListing.modelId2, { raw: true })
        homeListing.model2.brand = await CarBrand.findByPk(homeListing.model2.brand)
        if (homeListing.model2.highTrim) {
            homeListing.model2.mainTrim = await Trim.findByPk(homeListing.model2.highTrim);
        } else {
            homeListing.model2.mainTrim = await Trim.findOne({
                where: {
                    model: homeListing.model2.id,
                    published: true
                }
            });
        }
    }
    //         return item
    //     })
    // )

    return res
        .status(200)
        .json({ homeListing });

});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
