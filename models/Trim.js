const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");

const Trim = sequelize.define("trim", {
    name: {
        type: DataTypes.STRING(75),
        allowNull: false
    },
    metaTitle: {
        type: DataTypes.STRING
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true
    },
    mainSlug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    oldPath: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    brand: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    model: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.DOUBLE,
    },
    featuredImage: {
        type: DataTypes.STRING,
        // allowNull: false,
    },
    engine: {
        type: DataTypes.STRING,
    },
    displacement: {
        type: DataTypes.STRING,
    },
    power: {
        type: DataTypes.INTEGER,
    },
    torque: {
        type: DataTypes.STRING,
    },
    transmission: {
        type: DataTypes.STRING,
    },
    gearBox: {
        type: DataTypes.STRING,
    },
    drive: {
        type: DataTypes.STRING,
    },
    fuelType: {
        type: DataTypes.STRING,
    },
    motor: {
        type: DataTypes.STRING,
    },
    motorType: {
        type: DataTypes.STRING,
    },
    batteryCapacity: {
        type: DataTypes.STRING,
    },
    chargingTime: {
        type: DataTypes.STRING,
    },
    batteryWarranty: {
        type: DataTypes.STRING,
    },
    range: {
        type: DataTypes.STRING,
    },
    zeroToHundred: {
        type: DataTypes.STRING,
    },
    topSpeed: {
        type: DataTypes.STRING,
    },
    fuelConsumption: {
        type: DataTypes.STRING,
    },
    cylinders: {
        type: DataTypes.STRING,
    },
    haveABS: {
        type: DataTypes.BOOLEAN,
    },
    haveFrontAirbags: {
        type: DataTypes.BOOLEAN,
    },
    haveSideAirbags: {
        type: DataTypes.BOOLEAN,
    },
    haveRearAirbags: {
        type: DataTypes.BOOLEAN,
    },
    haveFrontParkAssist: {
        type: DataTypes.BOOLEAN,
    },
    haveRearParkAssist: {
        type: DataTypes.BOOLEAN,
    },
    haveRearParkingCamera: {
        type: DataTypes.BOOLEAN,
    },
    have360ParkingCamera: {
        type: DataTypes.BOOLEAN,
    },
    haveCruiseControl: {
        type: DataTypes.BOOLEAN,
    },
    haveAdaptiveCuriseControl: {
        type: DataTypes.BOOLEAN,
    },
    haveLaneChangeAssist: {
        type: DataTypes.BOOLEAN,
    },
    bodyType: {
        type: DataTypes.STRING,
    },
    airbags: {
        type: DataTypes.STRING,
    },
    doors: {
        type: DataTypes.STRING,
    },
    frontBrakes: {
        type: DataTypes.STRING,
    },
    rearBrakes: {
        type: DataTypes.STRING,
    },
    length: {
        type: DataTypes.STRING,
    },
    width: {
        type: DataTypes.STRING,
    },
    height: {
        type: DataTypes.STRING,
    },
    wheelbase: {
        type: DataTypes.STRING,
    },
    weight: {
        type: DataTypes.STRING,
    },
    fuelTankSize: {
        type: DataTypes.STRING,
    },
    wheels: {
        type: DataTypes.STRING,
    },
    tyresFront: {
        type: DataTypes.STRING,
    },
    tyresRear: {
        type: DataTypes.STRING,
    },
    cargoSpace: {
        type: DataTypes.STRING,
    },
    seatingCapacity: {
        type: DataTypes.STRING,
    },
    haveLeatherInterior: {
        type: DataTypes.BOOLEAN,
    },
    haveFabricInterior: {
        type: DataTypes.BOOLEAN,
    },
    haveAppleCarPlay: {
        type: DataTypes.BOOLEAN,
    },
    haveAndroidAuto: {
        type: DataTypes.BOOLEAN,
    },
    haveRearSeatEntertainment: {
        type: DataTypes.BOOLEAN,
    },
    haveCooledSeats: {
        type: DataTypes.BOOLEAN,
    },
    haveClimateControl: {
        type: DataTypes.BOOLEAN,
    },
    isLuxury: {
        type: DataTypes.BOOLEAN,
    },
    isPremiumLuxury: {
        type: DataTypes.BOOLEAN,
    },
    isSafety: {
        type: DataTypes.BOOLEAN,
    },
    isFuelEfficient: {
        type: DataTypes.BOOLEAN,
    },
    isOffRoad: {
        type: DataTypes.BOOLEAN,
    },
    haveMusic: {
        type: DataTypes.BOOLEAN,
    },
    haveTechnology: {
        type: DataTypes.BOOLEAN,
    },
    havePerformance: {
        type: DataTypes.BOOLEAN,
    },
    isSpacious: {
        type: DataTypes.BOOLEAN,
    },
    isElectric: {
        type: DataTypes.BOOLEAN,
    },
    euroNcap: {
        type: DataTypes.STRING,
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isDiscontinued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
});

module.exports = Trim;
