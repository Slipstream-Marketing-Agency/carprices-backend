const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const { WebStory, Slide } = require("../models/WebStory"); // Updated import to include Slide model
const moment = require("moment");


module.exports.createWebstory = asyncHandler(async (req, res, next) => {
    let { mainTitle, storyType, metaTitle, metaDescription, slug, storyLanguage, slides, published, publishedAt, url, urlName } = req.body.webstory;


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
            url,
            urlName,
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
    let webstoryId = req.params.id; // Assuming you can get the webstoryId from the route parameter
    let { mainTitle, storyType, metaTitle, metaDescription, slug, storyLanguage, slides, published, url, urlName, publishedAt } = req.body.webstory;

    try {
        let webstory = await WebStory.findByPk(webstoryId);

        if (!webstory) {
            return res.status(404).json({ message: 'WebStory not found' });
        }

        // Update main story details
        webstory.mainTitle = mainTitle;
        webstory.storyType = storyType;
        webstory.metaTitle = metaTitle;
        webstory.metaDescription = metaDescription;
        webstory.slug = slug || slugify(mainTitle, { lower: true });
        webstory.storyLanguage = storyLanguage;
        webstory.published = published;
        webstory.publishedAt = publishedAt;
        webstory.url = url;
        webstory.urlName = urlName;


        let originalPublishedState = webstory.published;
        publishedAt = webstory.publishedAt;

        if (published !== originalPublishedState) {
            publishedAt = published ? new Date() : null;
        }

        // Update or create associated Slide entries
        if (slides && slides.length > 0) {
            await Slide.destroy({ where: { webStoryId: webstoryId } }); // Delete existing slides for the webstory

            const slideEntries = slides.map((slide) => ({
                title: slide.title,
                image1: slide.image1,
                image2: slide.image2,
                subtitle: slide.subtitle,
                theme: slide.theme,
                webStoryId: webstory.id, // Associate slide with the webstory
            }));

            await Slide.bulkCreate(slideEntries);
        }

        await webstory.save(); // Save the updated webstory

        // Clear webstory cache if needed
        await redisClient.del("webstory");

        return res.status(200).json({ webstory });
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
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : [['publishedAt', 'DESC']];
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
    let orderBy = query.orderBy ? [[query.orderBy, "ASC"]] : [['publishedAt', 'DESC']];
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
        // Retrieve the WebStory with the provided ID, including associated slides in the order of the 'order' field
        const webstory = await WebStory.findByPk(webstoryId, {
            include: [{ model: Slide, order: [['id', 'ASC']] }],
            order: [[Slide, 'id', 'ASC']], // Order the web story's slides based on the 'order' field
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

module.exports.getWebstoryBySlug = asyncHandler(async (req, res, next) => {
    const webstorySlug = req.params.slug;

    try {
        // Retrieve the WebStory with the provided slug, including associated slides in the order of the 'order' field
        const webstory = await WebStory.findOne({
            where: { slug: webstorySlug },
            include: [{ model: Slide, order: [['id', 'ASC']] }],
            order: [[Slide, 'id', 'ASC']], // Order the web story's slides based on the 'order' field
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


module.exports.getWebstoryById = asyncHandler(async (req, res, next) => {
    const webstoryId = req.params.id;

    try {
        // Retrieve the WebStory with the provided ID, including associated slides in the order of the 'order' field
        const webstory = await WebStory.findByPk(webstoryId, {
            include: [{ model: Slide, order: [['id', 'ASC']] }],
            order: [[Slide, 'id', 'ASC']], // Order the web story's slides based on the 'order' field
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
