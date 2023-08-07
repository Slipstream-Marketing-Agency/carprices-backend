const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const BlogCategory = require("../models/BlogCategory");
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const moment = require("moment");
const BlogBrand = require("../models/BlogBrand");
const BlogModel = require("../models/BlogModel");
const Tag = require("../models/Tag");
const BlogTag = require("../models/BlogTag");
const Model = require("../models/Model");
const Admin = require("../models/Admin");

module.exports.createBlog = asyncHandler(async (req, res, next) => {
    let {
        title,
        metaTitle,
        summary,
        content,
        coverImage,
        published,
        brands,
        categories,
        models,
        tags,
        type,
        slug,
        publishedAt,
        // authorFirst,
        // authorLast
    } = req.body.blog;

    fieldValidation(title, next);
    fieldValidation(coverImage, next);
    fieldValidation(content, next);
    fieldValidation(published, next);

    if (!slug) {
        slug = slugify(title, {
            lower: true
        });
    }


    // let publishedAt = null

    if (published) {
        publishedAt = new Date()
    } else {
        publishedAt = null
    }

    // console.log(publishedAt);

    // Admin.findOrCreate({
    //     email: authorFirst + "@carprices.ae",
    // }, {
    //     email: authorFirst + "@carprices.ae",
    //     password: "Test123",
    //     username: authorFirst,
    //     firstName: authorFirst,
    //     lastName: authorLast
    // });

    // const [row, created] = await Admin.findOrCreate({
    //     where: {
    //         email: authorFirst + "@carprices.ae",
    //     },
    //     defaults: {
    //         email: authorFirst + "@carprices.ae",
    //         password: "Test123",
    //         username: authorFirst,
    //         firstName: authorFirst,
    //         lastName: authorLast
    //     }
    // });

    // let authorId = row.id

    try {
        const blog = await Blog.create({
            title,
            metaTitle,
            slug,
            summary,
            published,
            publishedAt,
            coverImage,
            content,
            type,
            author: 2 //req.loggedAdmin.id //authorId// 
        })

        let blogBrands = brands.map(brand => ({ blogId: blog.id, brandId: brand }));
        let blogCategories = categories.map(category => ({ blogId: blog.id, categoryId: category }));
        let blogModels = models.map(model => ({ blogId: blog.id, modelId: model }));
        let blogTags = [];

        await Promise.all(
            tags.map(async tag => {
                let tagSlug = slugify(tag, {
                    lower: true
                });

                const [row, created] = await Tag.findOrCreate({
                    where: {
                        title: tag
                    },
                    defaults: {
                        title: tag,
                        slug: tagSlug
                    }
                });

                blogTags.push({
                    blogId: blog.id,
                    tagId: row.id
                })
                return tag;
            })
        )


        await BlogBrand.bulkCreate(blogBrands);
        await BlogCategory.bulkCreate(blogCategories);
        await BlogModel.bulkCreate(blogModels);
        await BlogTag.bulkCreate(blogTags);

        await redisClient.del("blogs");

        return res.status(201).json({ blog });
    } catch (error) {
        console.log('Error', error.message);
        // new ErrorResponse(err.message);
        return res.status(403).json({ message: error.message })
    }




});

module.exports.updateBlog = asyncHandler(async (req, res, next) => {
    let { id } = req.params;
    let {
        title,
        metaTitle,
        summary,
        content,
        coverImage,
        published,
        brands,
        categories,
        models,
        tags,
        type,
        slug,
        publishedAt,
        // authorFirst,
        // authorLast
    } = req.body.blog;

    fieldValidation(title, next);
    fieldValidation(coverImage, next);
    fieldValidation(content, next);
    fieldValidation(published, next);

    // if (!slug) {
    //     slug = slugify(title, {
    //         lower: true
    //     });
    // }


    // let publishedAt = null

    let blog = await Blog.findByPk(id);
    if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
    }

    let originalPublishedState = blog.published;
    publishedAt = blog.publishedAt;

    if (published !== originalPublishedState) {
        publishedAt = published ? new Date() : null;
    }
    // else {
    //     publishedAt = null
    // }

    // console.log(publishedAt);

    // Admin.findOrCreate({
    //     email: authorFirst + "@carprices.ae",
    // }, {
    //     email: authorFirst + "@carprices.ae",
    //     password: "Test123",
    //     username: authorFirst,
    //     firstName: authorFirst,
    //     lastName: authorLast
    // });

    // const [row, created] = await Admin.findOrCreate({
    //     where: {
    //         email: authorFirst + "@carprices.ae",
    //     },
    //     defaults: {
    //         email: authorFirst + "@carprices.ae",
    //         password: "Test123",
    //         username: authorFirst,
    //         firstName: authorFirst,
    //         lastName: authorLast
    //     }
    // });

    // let authorId = row.id

    try {
        const blog = await Blog.update({
            title,
            metaTitle,
            slug,
            summary,
            published,
            publishedAt,
            coverImage,
            content,
            type,
            author: req.loggedAdmin.id //authorId// 
        }, {
            where: {
                id
            }
        })

        let blogBrands = brands.map(brand => ({ blogId: id, brandId: brand }));
        let blogCategories = categories.map(category => ({ blogId: id, categoryId: category }));
        let blogModels = models.map(model => ({ blogId: id, modelId: model }));
        let blogTags = [];

        await Promise.all(
            tags.map(async tag => {
                let tagSlug = slugify(tag, {
                    lower: true
                });

                const [row, created] = await Tag.findOrCreate({
                    where: {
                        title: tag
                    },
                    defaults: {
                        title: tag,
                        slug: tagSlug
                    }
                });

                blogTags.push({
                    blogId: id,
                    tagId: row.id
                })
                return tag;
            })
        )

        await BlogBrand.destroy({
            where: {
                blogId: id
            }
        })
        await BlogCategory.destroy({
            where: {
                blogId: id
            }
        })
        await BlogModel.destroy({
            where: {
                blogId: id
            }
        })
        await BlogTag.destroy({
            where: {
                blogId: id
            }
        })
        console.log("blogTags ", blogTags);
        await BlogBrand.bulkCreate(blogBrands);
        await BlogCategory.bulkCreate(blogCategories);
        await BlogModel.bulkCreate(blogModels);
        await BlogTag.bulkCreate(blogTags);

        await redisClient.del("blogs");

        return res.status(201).json({ blog });
    } catch (error) {
        console.log('Error', error.message);
        // new ErrorResponse(err.message);
        return res.status(403).json({ message: error.message })
    }




});

module.exports.getAdminBlogs = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: { exclude: ['content'] },
        raw: true
    };
    if (!isAll) {
        conditions = {
            attributes: { exclude: ['content'] },
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand => {
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category => {
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model => {
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag => {
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getAdminBlogById = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    let blog = await Blog.findByPk(id, { raw: true });

    blog.brands = await BlogBrand.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.brands = await Promise.all(
        blog.brands.map(async brand => {
            brand = await CarBrand.findByPk(brand.brandId);
            return brand;
        })
    )
    blog.categories = await BlogCategory.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.categories = await Promise.all(
        blog.categories.map(async category => {
            category = await Category.findByPk(category.categoryId);
            return category;
        })
    )
    blog.models = await BlogModel.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.models = await Promise.all(
        blog.models.map(async model => {
            model = await Model.findByPk(model.modelId);
            return model;
        })
    )
    blog.tags = await BlogTag.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    console.log("blog.tags ", blog.tags);
    blog.tags = await Promise.all(
        blog.tags.map(async tag => {
            tag = await Tag.findByPk(tag.tagId);
            return tag;
        })
    )
    blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })



    res
        .status(200)
        .json({ blog });
});

module.exports.getBlogs = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];
    let where = {
        published: true,
        type
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        attributes: { exclude: ['content'] },
        where
    };
    if (!isAll) {
        conditions = {
            attributes: { exclude: ['content'] },
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand => {
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category => {
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model => {
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag => {
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogsMin = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];
    let where = {
        published: true,
        type
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        attributes: ['id', 'title', 'slug', 'coverImage'],
        where
    };
    if (!isAll) {
        conditions = {
            attributes: ['id', 'title', 'slug', 'coverImage'],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogsTag = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [];
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
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

    let tags = { rows: [], count: 0 };

    tags = await Tag.findAndCountAll(conditions);

    res
        .status(200)
        .json({ tags: tags.rows, tagsCount: tags.count, totalPage: Math.ceil(tags.count / pageSize) });
});

module.exports.getBlogsByModel = asyncHandler(async (req, res, next) => {

    const { model } = req.params;
    const { query } = req;

    let blogsByModel = await BlogModel.findAll(
        {
            where: {
                modelId: model
            },
            raw: true
        }
    )

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];

    let blogIds = blogsByModel.map(blog => {
        return blog.blogId
    })

    let modelData = await Model.findByPk(model, {
        attributes: ["name"],
        raw: true
    });

    let categoryData = await Category.findOne({
        where: {
            title: {
                [Op.iLike]: "%" + modelData.name + "%"
            },
        },
        raw: true
    })

    if (categoryData) {
        let blogsByCategory = await BlogCategory.findAll(
            {
                where: {
                    categoryId: categoryData.id
                },
                raw: true
            }
        )
        blogsByCategory.map(item => {
            blogIds.push(item.blogId)
        })
    }


    let where = {
        id: blogIds,
        type,
        published: true
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
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

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand => {
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category => {
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model => {
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag => {
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogsByBrand = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;
    const { query } = req;

    let blogsByBrand = await BlogBrand.findAll(
        {
            where: {
                brandId: brand
            },
            raw: true
        }
    )

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];

    let blogIds = blogsByBrand.map(blog => {
        return blog.blogId
    })

    let brandData = await CarBrand.findByPk(brand, {
        attributes: ["name"],
        raw: true
    });

    let categoryData = await Category.findOne({
        where: {
            title: {
                [Op.iLike]: "%" + brandData.name + "%"
            },
        },
        raw: true
    })

    if (categoryData) {
        let blogsByCategory = await BlogCategory.findAll(
            {
                where: {
                    categoryId: categoryData.id
                },
                raw: true
            }
        )
        console.log("blogsByCategory ", blogsByCategory);
        blogsByCategory.map(item => {
            blogIds.push(item.blogId)
        })
    }

    let where = {
        id: blogIds,
        type,
        published: true
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
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

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand => {
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category => {
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model => {
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag => {
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )

    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogsByTag = asyncHandler(async (req, res, next) => {

    const { tag } = req.params;
    const { query } = req;

    let blogsByTag = await BlogTag.findAll(
        {
            where: {
                tagId: tag
            },
            raw: true
        }
    )

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];

    let blogIds = blogsByTag.map(blog => {
        return blog.blogId
    })

    let where = {
        id: blogIds,
        type,
        published: true
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        attributes: { exclude: ['content'] },
        where
    };
    if (!isAll) {
        conditions = {
            where,
            attributes: { exclude: ['content'] },
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand => {
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category => {
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model => {
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag => {
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogBySlug = asyncHandler(async (req, res, next) => {

    const { slug } = req.params;

    let where = {
        published: true,
        slug
    };

    const blog = await Blog.findOne({ where, raw: true });


    blog.brands = await BlogBrand.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.brands = await Promise.all(
        blog.brands.map(async brand => {
            brand = await CarBrand.findByPk(brand.brandId);
            return brand;
        })
    )
    blog.categories = await BlogCategory.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.categories = await Promise.all(
        blog.categories.map(async category => {
            category = await Category.findByPk(category.categoryId);
            return category;
        })
    )
    blog.models = await BlogModel.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.models = await Promise.all(
        blog.models.map(async model => {
            model = await Model.findByPk(model.modelId);
            return model;
        })
    )
    blog.tags = await BlogTag.findAll({
        where: {
            blogId: blog.id
        },
        raw: true
    });
    blog.tags = await Promise.all(
        blog.tags.map(async tag => {
            tag = await Tag.findByPk(tag.tagId);
            return tag;
        })
    )
    blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })

    res
        .status(200)
        .json({ blog });
});

module.exports.createBlogCategory = asyncHandler(async (req, res, next) => {
    const {
        title,
        metaTitle,
        content,
    } = req.body.category;

    fieldValidation(title, next);
    // fieldValidation(metaTitle, next);
    // fieldValidation(content, next);

    const slug = slugify(title, {
        lower: true
    });

    const blogCategory = await Category.create({
        title,
        metaTitle,
        slug,
        content
    });

    await redisClient.del("blogCategory");

    res.status(201).json({ blogCategory });
});

module.exports.getAdminBlogCategory = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {};
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy
        }
    }

    let categories = { rows: [], count: 0 };

    categories = await Category.findAndCountAll(conditions);

    res
        .status(200)
        .json({ categories: categories.rows, categoriesCount: categories.count, totalPage: Math.ceil(categories.count / pageSize) });
});

module.exports.updateBlogCategory = asyncHandler(async (req, res, next) => {

    const { category } = req.params;
    const {
        title,
        metaTitle,
        content,
    } = req.body.cateogry;

    fieldValidation(title, next);
    // fieldValidation(metaTitle, next);
    // fieldValidation(content, next);

    const slug = slugify(title, {
        lower: true
    });

    await Category.update({
        title,
        metaTitle,
        slug,
        content
    }, {
        where: {
            id: category
        }
    });

    await redisClient.del("blogCategory");

    res.status(201).json({ message: "Category Updated" });
});

module.exports.getAdminBlogTags = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {};
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy
        }
    }

    let tags = { rows: [], count: 0 };

    tags = await Tag.findAndCountAll(conditions);

    res
        .status(200)
        .json({ tags: tags.rows, tagsCount: tags.count, totalPage: Math.ceil(tags.count / pageSize) });
});

module.exports.getBlogsByTags = asyncHandler(async (req, res, next) => {

    const { tags } = req.body;
    const { query } = req;

    let blogsByTag = await BlogTag.findAll(
        {
            where: {
                tagId: tags
            },
            raw: true
        }
    )

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];

    let blogIds = blogsByTag.map(blog => {
        return blog.blogId
    })

    let where = {
        id: blogIds,
        type,
        published: true
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        attributes: { exclude: ['content'] },
        where
    };
    if (!isAll) {
        conditions = {
            where,
            attributes: { exclude: ['content'] },
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            // blog.brands = await BlogBrand.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.brands = await Promise.all(
            //     blog.brands.map(async brand => {
            //         brand = await CarBrand.findByPk(brand.brandId);
            //         return brand;
            //     })
            // )
            // blog.categories = await BlogCategory.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.categories = await Promise.all(
            //     blog.categories.map(async category => {
            //         category = await Category.findByPk(category.categoryId);
            //         return category;
            //     })
            // )
            // blog.models = await BlogModel.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.models = await Promise.all(
            //     blog.models.map(async model => {
            //         model = await Model.findByPk(model.modelId);
            //         return model;
            //     })
            // )
            // blog.tags = await BlogTag.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.tags = await Promise.all(
            //     blog.tags.map(async tag => {
            //         tag = await Tag.findByPk(tag.tagId);
            //         return tag;
            //     })
            // )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.getBlogsByTagsWithSlug = asyncHandler(async (req, res, next) => {

    const { tags } = req.body;
    const { query } = req;

    let tagIds = await Tag.findAll({
        where: {
            slug: tags
        },
        raw: true
    })

    tagIds = tagIds.map(tag => tag.id)

    let blogsByTag = await BlogTag.findAll(
        {
            where: {
                tagId: tagIds
            },
            raw: true
        }
    )

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let type = query.type ?? "news";
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : [
        ["publishedAt", "DESC"]
    ];

    let blogIds = blogsByTag.map(blog => {
        return blog.blogId
    })

    let where = {
        id: blogIds,
        type,
        published: true
    };
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        attributes: { exclude: ['content'] },
        where
    };
    if (!isAll) {
        conditions = {
            where,
            attributes: { exclude: ['content'] },
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            // blog.brands = await BlogBrand.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.brands = await Promise.all(
            //     blog.brands.map(async brand => {
            //         brand = await CarBrand.findByPk(brand.brandId);
            //         return brand;
            //     })
            // )
            // blog.categories = await BlogCategory.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.categories = await Promise.all(
            //     blog.categories.map(async category => {
            //         category = await Category.findByPk(category.categoryId);
            //         return category;
            //     })
            // )
            // blog.models = await BlogModel.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.models = await Promise.all(
            //     blog.models.map(async model => {
            //         model = await Model.findByPk(model.modelId);
            //         return model;
            //     })
            // )
            // blog.tags = await BlogTag.findAll({
            //     where: {
            //         blogId: blog.id
            //     },
            //     raw: true
            // });
            // blog.tags = await Promise.all(
            //     blog.tags.map(async tag => {
            //         tag = await Tag.findByPk(tag.tagId);
            //         return tag;
            //     })
            // )
            blog.author = await Admin.findByPk(blog.author, { attributes: ["id", "username", "firstName", "lastName", "image"] })
            return blog;
        })
    )


    res
        .status(200)
        .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
