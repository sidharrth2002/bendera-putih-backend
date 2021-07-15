const logger = require("../../winston-config");
const db = require("../models");
const sequelize = require("sequelize");
const moment = require("moment");

// TODO: only send back reports made in the past week
module.exports.getAllFlags = (req, res) => {
  const { offset, limit } = req.body;

  db.flag
    .findAll({
      limit: !limit ? null : limit,
      offset: !offset ? null : offset,
      where: {
        status: "APPROVED",
        updatedAt: {
          [sequelize.Op.gte]: moment().subtract(7, "days").toDate(),
        },
      },
    })
    .then((flags) => {
      res.status(200).json(flags);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// get flags within a radius
// TODO: debug this
module.exports.getAllFlagsInRadius = async (req, res) => {
  const { radius, latitude, longitude } = req.body;

  db.flag
    .findAll({
      attributes: [
        [
          sequelize.literal(
            "6371 * acos(cos(radians(" +
              latitude +
              ")) * cos(radians(ST_X(coordinates))) * cos(radians(" +
              longitude +
              ") - radians(ST_Y(coordinates))) + sin(radians(" +
              latitude +
              ")) * sin(radians(ST_X(coordinates))))"
          ),
          "distance",
        ],
      ],
      order: sequelize.col("distance"),
      limit: 10,
    })
    .then((inRadius) => {
      res.status(200).send(inRadius);
    });
};

// create new flag
module.exports.createFlag = (req, res) => {
  // for now, send from frontend
  // after this, take the ID from JWT
  const { latitude, longitude, description, image, phonenumber } = req.body;

  const userId = req.decoded.data;

  const coordinates = {
    type: "Point",
    coordinates: [latitude, longitude],
  };
  db.flag
    .create({
      description: description,
      coordinates,
      userId,
      minioimage: image,
      phonenumber: phonenumber !== "" ? phonenumber : null,
      status: "PENDING",
    })
    .then((newFlag) => res.status(200).send(newFlag))
    .catch((err) => {
      res.status(500).send(err);
    });
};

// delete a flag
// only admins can delete
module.exports.deleteFlag = (req, res) => {
  const { id } = req.body;

  db.flag
    .destroy({
      where: {
        id,
      },
    })
    .then((stat) => res.sendStatus(200))
    .catch((err) => {
      res.status(500).send(err);
    });
};

module.exports.getApprovedFlags = (req, res) => {
  const { offset, limit } = req.body;

  db.flag
    .findAll({
      limit: !limit ? null : limit,
      offset: !offset ? null : offset,
      where: {
        status: "APPROVED",
      },
    })
    .then((flags) => {
      res.status(200).send(flags);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// Delete this soon
// module.exports.createTestFlag = (req, res) => {
//   let point = { type: "Point", coordinates: [39.807222, -76.984722] };
//   db.flag
//     .create({
//       coordinates: point,
//       description: "Test Description",
//       userId: "",
//     })
//     .then((newFlag) => res.status(200).send(newFlag))
//     .catch(err => {
//       res.status(500).send(err);
//     })
// };
