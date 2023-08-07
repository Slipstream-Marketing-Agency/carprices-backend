const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const { WebStory, Slide } = require("../models/WebStory"); // Updated import to include Slide model
const moment = require("moment");


module.exports.createWebstory = asyncHandler(async (req, res, next) => {
    let { mainTitle, storyType, metaTitle, metaDescription, slug, storyLanguage, slides, published, publishedAt } = req.body.webstory;


    if (!slug) {
        slug = slugify(mainTitle, {
            lower: true
        });
    }

    if (published) {
        publishedAt = new Date()
    } else {
        publishedAt = null
    }



    try {
        // Create the WebStory entry
        const webstory = await WebStory.create({
            mainTitle,
            storyType,
            metaTitle,
            metaDescription,
            slug,
            storyLanguage,
            published,
            publishedAt,
            author: "Carprices",
        });

        // Create associated Slide entries if slides are provided
        if (slides && slides.length > 0) {
            const slideEntries = slides.map((slide) => ({
                title: slide.title,
                image1: slide.image1,
                image2: slide.image2,
                subtitle: slide.subtitle,
                theme: slide.theme,
                webStoryId: webstory.id, // Associate slide with the newly created web story
            }));

            await Slide.bulkCreate(slideEntries);
        }

        // Clear webstory cache if needed
        await redisClient.del("webstory");

        return res.status(201).json({ webstory });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(403).json({ message: error.message });
    }
});

module.exports.updateWebstory = asyncHandler(async (req, res, next) => {
    const webstoryId = req.params.id;
    const { mainTitle, storyType, metaTitle, metaDescription, slug, storyLanguage, slides, published } = req.body.webstory;

    try {
        // Check if the WebStory exists
        const existingWebstory = await WebStory.findByPk(webstoryId);
        if (!existingWebstory) {
            return res.status(404).json({ message: 'WebStory not found' });
        }

        // Update the WebStory fields
        existingWebstory.mainTitle = mainTitle;
        existingWebstory.storyType = storyType;
        existingWebstory.metaTitle = metaTitle;
        existingWebstory.metaDescription = metaDescription;

        // If the slug is provided, update it
        if (slug) {
            existingWebstory.slug = slugify(slug, {
                lower: true
            });
        }

        existingWebstory.storyLanguage = storyLanguage;
        existingWebstory.published = published;

        // If published is true and no publishedAt date is set, set it to the current date
        if (published && !existingWebstory.publishedAt) {
            existingWebstory.publishedAt = new Date();
        }

        // If published is false, clear the publishedAt date
        if (!published) {
            existingWebstory.publishedAt = null;
        }

        // Save the updated WebStory
        await existingWebstory.save();

        // Update or create associated Slide entries if slides are provided
        if (slides && slides.length > 0) {
            for (const slide of slides) {
                if (slide.id) {
                    // If slide ID is provided, update the existing slide
                    const existingSlide = await Slide.findByPk(slide.id);
                    if (existingSlide) {
                        existingSlide.title = slide.title;
                        existingSlide.image1 = slide.image1;
                        existingSlide.image2 = slide.image2;
                        existingSlide.subtitle = slide.subtitle;
                        existingSlide.theme = slide.theme;
                        await existingSlide.save();
                    }
                } else {
                    // If slide ID is not provided, create a new slide and associate it with the WebStory
                    await Slide.create({
                        title: slide.title,
                        image1: slide.image1,
                        image2: slide.image2,
                        subtitle: slide.subtitle,
                        theme: slide.theme,
                        webStoryId: existingWebstory.id, // Associate slide with the existing web story
                    });
                }
            }
        }

        // Clear webstory cache if needed
        await redisClient.del("webstory");

        return res.status(200).json({ webstory: existingWebstory });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports.getWebStories = asyncHandler(async (req, res, next) => {
    const { query } = req;

    let isAll = query.isAll ?? false;
    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : null;
    let where = {};

    if (query.search) {
        where.mainTitle = { [Op.iLike]: `%${query.search}%` };
    }

    // Add condition to filter out unpublished stories
    where.published = true;

    let conditions = {
        order: orderBy,
    };

    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            include: [{ model: Slide }], // Include the slides associated with the web story
        };
    }

    const webstories = await WebStory.findAndCountAll(conditions);

    res.status(200).json({
        webstories: webstories.rows,
        webstoriesCount: webstories.count,
        totalPage: Math.ceil(webstories.count / pageSize),
    });
});



module.exports.getAdminWebStories = asyncHandler(async (req, res, next) => {
    const { query } = req;

    let isAll = query.isAll ?? false;
    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : null;
    let where = {};

    if (query.search) {
        where.mainTitle = { [Op.iLike]: `%${query.search}%` };
    }

    let conditions = {
        order: orderBy,
    };

    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            include: [{ model: Slide }], // Include the slides associated with the web story
        };
    }

    const webstories = await WebStory.findAndCountAll(conditions);

    res.status(200).json({
        webstories: webstories.rows,
        webstoriesCount: webstories.count,
        totalPage: Math.ceil(webstories.count / pageSize),
    });
});

module.exports.getAdminWebstoryById = asyncHandler(async (req, res, next) => {
    const webstoryId = req.params.id;

    try {
        // Retrieve the WebStory with the provided ID
        const webstory = await WebStory.findByPk(webstoryId, {
            include: [{ model: Slide }],
        });

        if (!webstory) {
            return res.status(404).json({ message: 'WebStory not found' });
        }

        return res.status(200).json({ webstory });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});




const fieldValidation = (field, next) => {
    if (!field) {
        return next(new ErrorResponse(`Missing fields`, 400));
    }
};
